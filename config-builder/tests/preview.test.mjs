import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { catalog, defaults } from "../shared/compiler.js";
import { previewInspection, previewRegions } from "../shared/preview.js";
import { regionsPanel } from "../src/panels/regions.js";

test("preview inspection offers template regions without inventing nodes", () => {
  const inspection = previewInspection(catalog);
  assert.deepEqual(inspection.nodes, []);
  assert.deepEqual(inspection.providers, []);
  assert.equal(inspection.capabilities.tcp, false);
  assert.deepEqual(
    inspection.regions.map((r) => r.id),
    catalog.regions.map((r) => r.id),
  );
  assert.ok(inspection.regions.every((r) => r.count === 0));
  assert.deepEqual(previewRegions(catalog), catalog.regions.map((r) => r.id));
  const html = regionsPanel({
    profile: defaults(catalog),
    inspection,
    preview: true,
  });
  assert.match(html, /可提前决定保留哪些/);
  assert.match(html, /预览模式下不显示节点与连接耗时/);
});

test("wizard exposes an early-configuration entry and unlocked steps", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="skip-sources"/);
  assert.match(html, /先配置其他步骤/);
  assert.match(html, /id="preview-banner"/);
  assert.match(html, /导入配置/);
  assert.match(html, /分享配置/);
  assert.match(html, /预览模式 · 尚未解析节点/);

  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /button\.disabled = busy;/);
  assert.doesNotMatch(app, /furthest/);
  assert.doesNotMatch(app, /validateStep/);
  assert.match(app, /if \(next > 0 && !ctx\.inspection && !ctx\.preview\)/);
  assert.match(app, /if \(ctx\.preview\) changed\(\);/);
  assert.match(app, /const wasPreview = ctx\.preview;/);
});

test("theme follows the system while no manual choice is stored", async () => {
  const source = await readFile(new URL("../src/theme.js", import.meta.url), "utf8");
  assert.match(source, /prefers-color-scheme/);
  assert.match(source, /if \(!saved\) apply\(\)/);
});

test("final step never shows a detached YAML file card", async () => {
  const review = await readFile(
    new URL("../src/panels/review.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(review, /Eaibee/);
  assert.match(review, /id="file-card" hidden/);
  assert.match(review, /ratatoskr · 未命名\.yaml/);
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(ctx\.preview \|\| ctx\.service !== "ready"\)/);
  assert.match(app, /\$\("#download"\)\.hidden = !final \|\| !ready;/);
});
