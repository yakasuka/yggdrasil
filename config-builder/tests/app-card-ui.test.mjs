import test from "node:test";
import assert from "node:assert/strict";
import { defaults } from "../shared/compiler.js";
import { appsPanel } from "../src/panels/apps.js";
import { appExitOptions, appBatchBarHTML } from "../src/widget-cards.js";
import { uiIcon, iconForEmoji } from "../src/icons.js";

const ctx = () => ({ profile: defaults(), inspection: null, service: "ready" });

test("APP card shows a persistent current-exit pill on its face", () => {
  const html = appsPanel(ctx());
  assert.match(html, /data-policy-current/, "card carries the current-exit pill");
  assert.match(html, /policy-current-glyph/, "pill shows the exit glyph");
  assert.match(html, /policy-current-label/, "pill shows the exit label");
  assert.match(html, /默认出口 跟随代理/, "default exit is reflected in aria-label");
});

test("fixed exits use crisp SVG icons, not the ugly generic emoji", () => {
  const html = appsPanel(ctx());
  // The old generic emoji for fixed exits must be gone from the picker glyphs.
  assert.ok(!html.includes(">🎚️<"), "no sliders emoji glyph");
  assert.ok(!html.includes(">⛔<"), "no prohibit emoji glyph");
  assert.ok(!html.includes(">➡️<"), "no arrow emoji glyph");
  // Region flags (incl. OTHER's 🌐) are meaningful country markers and are
  // deliberately kept as coloured Twemoji — only the generic glyphs are gone.
  // The SVG icon language is present instead.
  assert.match(html, /class="ui-icon/, "inline SVG icons render the exits");
});

test("ban + select-all icons exist and map cleanly", () => {
  assert.match(uiIcon("ban"), /<svg[^>]*class="ui-icon/, "ban icon renders");
  assert.match(uiIcon("select-all"), /<svg/, "select-all icon renders");
  // Existing emoji→icon mapping still resolves (used elsewhere).
  assert.equal(iconForEmoji("🎚️"), "switch");
});

test("exit options are shared and ordered proxy → regions → reject → direct", () => {
  const opts = appExitOptions(ctx());
  const values = opts.map((o) => o[0]);
  assert.equal(values[0], "proxy");
  assert.equal(values[values.length - 2], "reject");
  assert.equal(values[values.length - 1], "direct");
  assert.ok(values.some((v) => v.startsWith("region:")), "includes selected regions");
  for (const [, , glyph] of opts) assert.ok(glyph.length > 0, "every option has a glyph");
});

test("APP toolbar exposes a batch-select toggle", () => {
  const html = appsPanel(ctx());
  assert.match(html, /data-app-multi/, "batch toggle button present");
  assert.match(html, /批量/, "labelled for the user");
});

test("batch action bar carries select-all / remove / done / exit capsules", () => {
  const bar = appBatchBarHTML(ctx());
  assert.match(bar, /data-app-batchbar/, "bar root present");
  assert.match(bar, /data-batch-select-all/, "select-all control");
  assert.match(bar, /data-batch-count/, "live count");
  assert.match(bar, /data-batch-remove/, "batch remove");
  assert.match(bar, /data-batch-done/, "done control");
  assert.match(bar, /data-batch-exit="proxy"/, "exit capsules reuse the same values");
  assert.match(bar, /data-batch-exit="reject"/);
  assert.match(bar, /data-batch-exit="direct"/);
  assert.match(bar, /hidden/, "bar starts hidden");
});

test("batch exits stay in lock-step with the per-card options", () => {
  const opts = appExitOptions(ctx()).map((o) => o[0]);
  const bar = appBatchBarHTML(ctx());
  const barValues = [...bar.matchAll(/data-batch-exit="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(barValues, opts, "batch bar and card menu expose identical exits");
});

test("batch multi-select module loads and exports its controller", async () => {
  const mod = await import("../src/app-multiselect.js");
  assert.equal(typeof mod.bindMultiSelect, "function");
});
