// Real url-test latency probing with a local proxy core (mihomo / Clash Meta).
//
// A TCP connect cannot measure UDP-based nodes such as hysteria2 — the node
// ports only speak QUIC/UDP. This module spins up a short-lived mihomo process
// whose outbound proxies are the parsed subscription nodes, then asks mihomo's
// REST API to time a request through each node to the health-check URL. The
// result is the same latency the client's url-test group reports.
//
// It is opt-in: the Node service only injects it when config.mihomoBin points
// to an executable. Cloudflare Workers keep the TCP-connect fallback.

import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomInt } from "node:crypto";

const DEFAULT_TEST_URL = "https://www.gstatic.com/generate_204";
const DEFAULT_TIMEOUT_MS = 10000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url, ms) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(ms),
  });
  const data = await response.json();
  if (!response.ok) throw Error(`mihomo API ${response.status}`);
  return data;
}

export function buildConfig(entries, controllerPort, testURL) {
  const proxies = entries.map(({ proxy }, i) => ({ ...proxy, name: `N${i}` }));
  return {
    "external-controller": `127.0.0.1:${controllerPort}`,
    mode: "rule",
    "allow-lan": false,
    proxies,
    "proxy-groups": [
      { name: "G", type: "select", proxies: proxies.map((p) => p.name) },
    ],
    rules: ["MATCH,G"],
    "health-check": { "url": testURL },
  };
}

// Map a parsed node (Mihomo YAML proxy object) into a name/id pair. `record`
// comes from inspect(): record.nodes[i].id === "P<n>:<i>" matches
// record.proxies[i].
export function collectEntries(records, ids) {
  const wanted = new Set(ids);
  const entries = [];
  for (const record of records) {
    const proxies = record.proxies || [];
    const nodes = record.nodes || [];
    nodes.forEach((node, i) => {
      if (!wanted.has(node.id)) return;
      const proxy = proxies[i];
      if (!proxy || !proxy.server || !proxy.port) return;
      entries.push({ id: node.id, proxy });
    });
  }
  return entries;
}

export function createUrlProbe({
  mihomoBin,
  testURL = DEFAULT_TEST_URL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
  spawnImpl = spawn,
  sleepImpl = sleep,
  tempDir,
} = {}) {
  if (!mihomoBin) return null;

  return async function urlProbe(records, ids) {
    const entries = collectEntries(records, ids);
    if (!entries.length)
      return ids.map((id) => ({
        id,
        latencyMs: null,
        kind: "url-test",
        error: "没有可检测的节点。",
      }));

    const dir = tempDir || (await mkdtemp(join(tmpdir(), "ygg-urlprobe-")));
    const controllerPort = 20000 + randomInt(20000);
    const configPath = join(dir, "mihomo.yaml");
    let child;
    try {
      await writeFile(
        configPath,
        JSON.stringify(buildConfig(entries, controllerPort, testURL)),
        "utf8",
      );
      child = spawnImpl(mihomoBin, ["-d", dir, "-f", configPath], {
        stdio: "ignore",
        detached: true,
      });

      // Wait for the REST controller to accept connections.
      let ready = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        try {
          await fetchImpl(`http://127.0.0.1:${controllerPort}/proxies`, {
            signal: AbortSignal.timeout(500),
          });
          ready = true;
          break;
        } catch {
          await sleepImpl(150);
        }
      }
      if (!ready) throw Error("mihomo 控制接口未就绪。");

      const timeoutParam = Math.max(1000, timeoutMs);
      const encodedURL = encodeURIComponent(testURL);
      const results = await Promise.all(
        entries.map(async ({ id }, i) => {
          try {
            const data = await fetchImpl(
              `http://127.0.0.1:${controllerPort}/proxies/N${i}/delay?url=${encodedURL}&timeout=${timeoutParam}`,
              { signal: AbortSignal.timeout(timeoutParam + 2000) },
            );
            const body = await data.json();
            const ms = Number(body.delay);
            return {
              id,
              latencyMs: Number.isFinite(ms) && ms > 0 ? Math.round(ms) : null,
              kind: "url-test",
            };
          } catch {
            return {
              id,
              latencyMs: null,
              kind: "url-test",
              error: "连接未成功或目标不支持检测。",
            };
          }
        }),
      );
      return results;
    } finally {
      if (child && child.pid) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          try {
            child.kill("SIGKILL");
          } catch {}
        }
      }
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  };
}
