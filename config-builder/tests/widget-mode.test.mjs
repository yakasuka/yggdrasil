import test from "node:test";
import assert from "node:assert/strict";
import {
  allIds,
  disabledIds,
  displayOrder,
  setEnabled,
  moveOrder,
  enabledIds,
} from "../src/widget-mode.js";
import { defaults, catalog, normalize } from "../shared/compiler.js";

test("every widget kind derives its full id set from the catalog", () => {
  for (const kind of ["region", "strategy", "app", "module"]) {
    const ids = allIds(kind, catalog);
    assert.ok(ids.length > 0, `${kind} has ids`);
    assert.equal(new Set(ids).size, ids.length, `${kind} ids are unique`);
  }
  assert.ok(allIds("region", catalog).includes("OTHER"));
});

test("disabling a widget moves it into the library, enabling brings it back", () => {
  const p = defaults(catalog);
  const id = p.modules[0];
  assert.ok(enabledIds("module", p).includes(id));
  assert.ok(!disabledIds("module", p, catalog).includes(id));

  assert.equal(setEnabled("module", id, false, p, catalog), true);
  assert.ok(!enabledIds("module", p).includes(id));
  assert.ok(disabledIds("module", p, catalog).includes(id));

  assert.equal(setEnabled("module", id, true, p, catalog), true);
  assert.ok(enabledIds("module", p).includes(id));
});

test("region OTHER is toggled through profile.other and stays in synch", () => {
  const p = defaults(catalog);
  assert.equal(p.other, true);
  setEnabled("region", "OTHER", false, p, catalog);
  assert.equal(p.other, false);
  assert.ok(!enabledIds("region", p).includes("OTHER"));
  setEnabled("region", "OTHER", true, p, catalog);
  assert.ok(enabledIds("region", p).includes("OTHER"));
});

test("fixed strategies can never be removed", () => {
  const p = defaults(catalog);
  assert.equal(setEnabled("strategy", "gateway", false, p, catalog), false);
  assert.equal(setEnabled("strategy", "manual", false, p, catalog), false);
  assert.ok(enabledIds("strategy", p).includes("gateway"));
  assert.ok(enabledIds("strategy", p).includes("manual"));
});

test("app toggling keeps appsMode consistent", () => {
  const p = defaults(catalog);
  const id = p.apps[0];
  assert.equal(p.appsMode, "all");
  setEnabled("app", id, false, p, catalog);
  assert.equal(p.appsMode, "custom");
  setEnabled("app", id, true, p, catalog);
  assert.equal(p.appsMode, "all");
});

test("reorder persists and new/unknown ids are appended, never dropped", () => {
  const p = defaults(catalog);
  const ids = displayOrder("module", p, catalog);
  const first = ids[0],
    third = ids[2];
  const order = moveOrder("module", first, third, p, catalog);
  assert.equal(order[order.indexOf(third) - 1], first, "first now sits before third");
  assert.equal(order.length, ids.length, "no ids lost");

  // A stale order missing ids still lists everything.
  const stale = defaults(catalog);
  stale.order.modules = [first];
  assert.equal(displayOrder("module", stale, catalog).length, ids.length);
});

test("invalid ids are ignored by setEnabled / moveOrder", () => {
  const p = defaults(catalog);
  assert.equal(setEnabled("app", "not-a-real-app", true, p, catalog), false);
  assert.equal(setEnabled("app", "not-a-real-app", false, p, catalog), false);
  const before = JSON.stringify(p.order);
  moveOrder("app", "not-a-real-app", null, p, catalog);
  // moveOrder filters invalid ids out but keeps the known set intact.
  assert.ok(p.order.apps.includes(allIds("app", catalog)[0]));
});

test("order survives normalize()", () => {
  const p = defaults(catalog);
  p.title = "测试";
  p.providers = [{ name: "机场", url: "https://example.com/sub" }];
  const reordered = [...p.order.apps].reverse();
  p.order.apps = reordered;
  const out = normalize(p, catalog);
  assert.deepEqual(out.order.apps, reordered);
});
