import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildConfig,
  collectEntries,
  createUrlProbe,
} from "../server/url-probe.js";

const records = [
  {
    nodes: [
      { id: "P1:0", name: "jp", server: "1.2.3.4", port: 443 },
      { id: "P1:1", name: "kr", server: "5.6.7.8", port: 8443 },
    ],
    proxies: [
      { name: "jp", type: "hysteria2", server: "1.2.3.4", port: 443, password: "x" },
      { name: "kr", type: "hysteria2", server: "5.6.7.8", port: 8443, password: "y" },
    ],
  },
];

test("collectEntries maps requested ids to full proxy definitions", () => {
  const entries = collectEntries(records, ["P1:1"]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, "P1:1");
  assert.equal(entries[0].proxy.password, "y");
  assert.deepEqual(collectEntries(records, ["P9:9"]), []);
});

test("buildConfig emits mihomo proxies named by index with a select group", () => {
  const entries = collectEntries(records, ["P1:0", "P1:1"]);
  const cfg = buildConfig(entries, 23456, "https://example.com/204");
  assert.equal(cfg["external-controller"], "127.0.0.1:23456");
  assert.deepEqual(cfg.proxies.map((p) => p.name), ["N0", "N1"]);
  assert.equal(cfg.proxies[0].password, "x");
  assert.deepEqual(cfg["proxy-groups"][0].proxies, ["N0", "N1"]);
  assert.equal(cfg.rules[0], "MATCH,G");
});

test("createUrlProbe returns null without a binary", () => {
  assert.equal(createUrlProbe({}), null);
});

test("urlProbe measures each node via mihomo delay API and kills the process", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ygg-urlprobe-test-"));
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("/proxies") && !url.includes("/delay"))
      return { ok: true, json: async () => ({}) };
    const match = url.match(/\/proxies\/(N\d)\/delay/);
    const index = Number(match[1].slice(1));
    return {
      ok: true,
      json: async () => ({ delay: index === 0 ? 123 : 456 }),
    };
  };
  let killed = false;
  let capturedConfigPath = "";
  const spawnImpl = (_bin, args) => {
    capturedConfigPath = args[args.indexOf("-f") + 1];
    return { pid: 999999 };
  };
  const origKill = process.kill;
  process.kill = (pid, sig) => {
    killed = pid === -999999 && sig === "SIGKILL";
    return true;
  };
  try {
    const probe = createUrlProbe({
      mihomoBin: "/fake/mihomo",
      fetchImpl,
      spawnImpl,
      sleepImpl: async () => {},
      tempDir: dir,
    });
    const result = await probe(records, ["P1:0", "P1:1"]);
    assert.deepEqual(result, [
      { id: "P1:0", latencyMs: 123, kind: "url-test" },
      { id: "P1:1", latencyMs: 456, kind: "url-test" },
    ]);
    assert.ok(killed, "mihomo process group must be killed after probing");
    assert.match(capturedConfigPath, /mihomo\.yaml$/);
  } finally {
    process.kill = origKill;
    await rm(dir, { recursive: true, force: true });
  }
});

test("urlProbe degrades to null latency on API failures", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ygg-urlprobe-test-"));
  const fetchImpl = async (url) => {
    if (url.includes("/proxies") && !url.includes("/delay"))
      return { ok: true, json: async () => ({}) };
    throw Error("boom");
  };
  const origKill = process.kill;
  process.kill = () => true;
  try {
    const probe = createUrlProbe({
      mihomoBin: "/fake/mihomo",
      fetchImpl,
      spawnImpl: () => ({ pid: 999998 }),
      sleepImpl: async () => {},
      tempDir: dir,
    });
    const result = await probe(records, ["P1:0"]);
    assert.equal(result[0].latencyMs, null);
    assert.equal(result[0].kind, "url-test");
  } finally {
    process.kill = origKill;
    await rm(dir, { recursive: true, force: true });
  }
});
