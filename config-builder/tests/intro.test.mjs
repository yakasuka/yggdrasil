import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const caustics = readFileSync(
  new URL("../src/caustics.js", import.meta.url),
  "utf8",
);

test("the full-screen water intro plays on every visit", () => {
  // The old behaviour hid the intro once localStorage remembered a visit,
  // on reload, or when reduced motion was set. None of those may gate it now.
  assert.ok(!html.includes('intro-seen'), "no one-shot localStorage gate");
  assert.ok(
    !html.includes('getEntriesByType("navigation")'),
    "reload must not skip the intro",
  );
  assert.ok(html.includes('dataset.intro'), "intro state is still resolved");
  assert.ok(html.includes('?intro=1'), "reduced motion can be overridden");

  assert.ok(
    !caustics.includes('setItem("yggdrasil:config-builder:intro-seen"'),
    "caustics must not re-arm the one-shot gate",
  );
  assert.ok(
    !caustics.includes('root.dataset.intro === "skip" || reduced.matches'),
    "a second reduced-motion check must not skip the intro",
  );
});

test("?intro=off is an explicit escape hatch", () => {
  assert.ok(html.includes('choice === "off"'), "off switch is honoured");
});
