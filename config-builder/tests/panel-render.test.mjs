import test from "node:test";
import assert from "node:assert/strict";
import { defaults } from "../shared/compiler.js";
import { sourcesPanel } from "../src/panels/sources.js";
import { regionsPanel } from "../src/panels/regions.js";
import { strategiesPanel } from "../src/panels/strategies.js";
import { appsPanel } from "../src/panels/apps.js";
import { rulesPanel } from "../src/panels/rules.js";
import { reviewPanel } from "../src/panels/review.js";

// Every wizard step must render without throwing. A panel that references a
// helper it forgot to import (e.g. `title`) looks fine in the bundle until the
// user clicks that step, at which point the whole panel goes blank. Rendering
// each panel here turns that silent runtime crash into a failing test.
const panels = [
  ["订阅来源", sourcesPanel],
  ["地区节点", regionsPanel],
  ["节点策略", strategiesPanel],
  ["APP 分流", appsPanel],
  ["规则模块", rulesPanel],
  ["最终确认", reviewPanel],
];

for (const [label, panel] of panels) {
  test(`${label} 面板可正常渲染`, () => {
    const ctx = { profile: defaults(), inspection: null, service: "ready" };
    let html;
    assert.doesNotThrow(() => (html = panel(ctx)), `${label} 面板渲染不应抛异常`);
    assert.equal(typeof html, "string", `${label} 应返回 HTML 字符串`);
    assert.ok(html.length > 0, `${label} 不应为空`);
  });
}

test("规则模块面板列出模板中的全部规则模块", () => {
  const html = rulesPanel({ profile: defaults() });
  assert.match(html, /个规则模块/);
  // Every module present in the template must produce a toggle, so newly
  // authored rule sets never silently disappear from the picker.
  for (const id of ["private", "china", "gfw", "game-direct", "ports"]) {
    assert.match(html, new RegExp(`data-module="${id}"`), `${id} 应有开关`);
  }
});
