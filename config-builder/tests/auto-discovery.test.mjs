// Guardrail: anything added to the YAML template must flow all the way to the
// UI. These tests inject a brand-new region / app / strategy / rule module into
// the real template text and assert it is derived AND displayable, so a future
// hardcoded filter cannot silently drop new content again.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { catalogFromYaml } from "../shared/catalog-from-yaml.js";
import {
  strategyDefs,
  strategyIds,
  moduleView,
  ruleModules,
} from "../shared/compiler.js";
import { strategyView } from "../src/strategy-catalog.js";

const TEMPLATE_URL = new URL(
  "../../resources/template/ratatoskr-template.yaml",
  import.meta.url,
);
const template = (await readFile(TEMPLATE_URL, "utf8")).replace(/^\uFEFF/, "");

// Inject four new things into a copy of the real template. New groups use
// block style (the template's one-liners are flow style, which forbids nested
// author metadata); both shapes are accepted by metaOf().
function augmented() {
  let text = template;
  // 1. New region filter + its group (authored label via flat x-label).
  text = text.replace(
    "  US: &FilterUS ",
    "  FR: &FilterFR '(?i)^(?!=>).*(?:🇫🇷|法国|France|\\b(?:FR|FRA)\\d*\\b)'\n  US: &FilterUS ",
  );
  text = text.replace(
    "  - {name: ✨ Hermes,",
    "  - name: 🥐 France\n" +
      "    type: select\n" +
      "    filter: *FilterFR\n" +
      "    x-label: 法国\n" +
      "    icon: \"https://example.com/fr.png\"\n" +
      "  - {name: ✨ Hermes,",
  );
  // 2. New APP select group + a rule pointing at it.
  text = text.replace(
    "  - {name: ✨ Hermes,",
    "  - name: 🧪 NewApp\n" +
      "    type: select\n" +
      "    proxies: [🎚️ 节点选择, DIRECT]\n" +
      "    x-label: 新应用\n" +
      "    x-category: 其他服务\n" +
      "    icon: \"https://example.com/newapp.png\"\n" +
      "  - {name: ✨ Hermes,",
  );
  text = text.replace(
    "  - GEOSITE,adobe,🎨 Adobe",
    "  - DOMAIN-SUFFIX,newapp.example,🧪 NewApp\n  - GEOSITE,adobe,🎨 Adobe",
  );
  // 3. New automatic strategy with an authored id + label.
  text = text.replace(
    "  - {name: ⚡ 自动选择,",
    "  - name: 🧪 Canary\n" +
      "    type: url-test\n" +
      "    include-all: true\n" +
      "    filter: *FilterAll\n" +
      "    url: \"https://example.com/generate_204\"\n" +
      "    x-id: canary\n" +
      "    x-label: 金丝雀\n" +
      "  - {name: ⚡ 自动选择,",
  );
  // 4. New rule provider with an explicit module + display text, and a rule.
  text = text.replace(
    "  🪐 Astra Domain:",
    "  🧪 Canary Set:\n" +
      "    <<: *RP-domain\n" +
      "    x-module: canary-rules\n" +
      "    x-label: 金丝雀规则\n" +
      "    x-symbol: 🧪\n" +
      "    x-description: 测试规则模块\n" +
      "    url: \"https://example.com/canary.yaml\"\n" +
      "  🪐 Astra Domain:",
  );
  text = text.replace(
    "  - DOMAIN-SUFFIX,newapp.example,🧪 NewApp",
    "  - RULE-SET,🧪 Canary Set,🎚️ 节点选择\n  - DOMAIN-SUFFIX,newapp.example,🧪 NewApp",
  );
  return text;
}

const model = await catalogFromYaml(augmented());

test("a new region with authored label is derived", () => {
  const fr = model.regions.find((r) => r.id === "FR");
  assert.ok(fr, "new region must appear in catalog");
  assert.equal(fr.label, "法国");
  assert.equal(fr.flag, "🇫🇷");
});

test("a new app is derived with its authored label and icon", () => {
  const app = model.apps.find((a) => a.label === "新应用");
  assert.ok(app, "new app must appear in catalog");
  assert.equal(app.icon, "https://example.com/newapp.png");
});

test("a new strategy is derived and reaches both compiler and UI", () => {
  const canary = model.strategies.find((s) => s.id === "canary");
  assert.ok(canary, "new strategy must appear in catalog");
  assert.equal(canary.label, "金丝雀");
  assert.ok(strategyIds(model).includes("canary"), "compiler must accept new strategy id");
  assert.ok(strategyDefs(model).some((s) => s.id === "canary"), "compiler must have its definition");
  const ui = strategyView(model);
  assert.ok(ui.some((s) => s.id === "canary"), "strategy card must render for new strategy");
  const card = ui.find((s) => s.id === "canary");
  assert.equal(card.label, "金丝雀");
  assert.ok(card.description, "unknown strategy still gets fallback text");
});

test("a new rule module is derived and displayable via moduleView", () => {
  assert.ok(ruleModules(model).includes("canary-rules"), "new module id must be present");
  const view = moduleView("canary-rules", model);
  assert.equal(view.label, "金丝雀规则");
  assert.equal(view.symbol, "🧪");
  assert.equal(view.description, "测试规则模块");
});

test("an unknown module/id still gets a generic display instead of being dropped", () => {
  const view = moduleView("never-seen-before", model);
  assert.equal(view.id, "never-seen-before");
  assert.ok(view.label && view.description && view.symbol, "generic fallback must be complete");
  const strategy = strategyView({ ...model, strategies: [{ id: "mystery", name: "🧊 Mystery" }] });
  const card = strategy.find((s) => s.id === "mystery");
  assert.ok(card, "unknown strategy must still produce a card");
  assert.ok(card.description && card.label, "unknown strategy must have fallback text");
});
