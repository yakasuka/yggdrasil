import test from "node:test";
import assert from "node:assert/strict";
import {
  springStep,
  springPosition,
  enterPanel,
  celebrate,
} from "../src/motion.js";

test("step cursor spring follows the same trajectory across display refresh rates", () => {
  function simulate(hz) {
    let value = 0,
      velocity = 0;
    for (let i = 0; i < hz / 4; i++)
      [value, velocity] = springStep(value, velocity, 180, 1 / hz);
    return [value, velocity];
  }
  const sixty = simulate(60),
    oneTwenty = simulate(120);
  assert.ok(Math.abs(sixty[0] - oneTwenty[0]) < 0.00001);
  assert.ok(Math.abs(sixty[1] - oneTwenty[1]) < 0.00001);
});

test("redirecting an in-flight cursor retains velocity and settles without overshoot", () => {
  let value = 0,
    velocity = 0;
  for (let i = 0; i < 8; i++)
    [value, velocity] = springStep(value, velocity, 120, 1 / 60);
  const current = value;
  [value, velocity] = springStep(value, velocity, 260, 1 / 120);
  assert.ok(value > current && value - current < 20);
  assert.ok(velocity > 0);
  for (let i = 0; i < 180; i++) {
    [value, velocity] = springStep(value, velocity, 260, 1 / 60);
    assert.ok(value <= 260.00001);
  }
  assert.ok(Math.abs(value - 260) < 0.001);
});

test("reduced motion keeps progress feedback immediate and skips decorative effects", () => {
  const previous = {
    matchMedia: globalThis.matchMedia,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  try {
    globalThis.matchMedia = () => ({ matches: true });
    globalThis.requestAnimationFrame = () => {
      throw Error("No moving animation expected");
    };
    globalThis.cancelAnimationFrame = () => {};
    const positions = [];
    const move = springPosition((x, y) => positions.push([x, y]));
    move(0, 20);
    move(0, 100);
    assert.deepEqual(positions, [
      [0, 20],
      [0, 100],
    ]);
    enterPanel({
      animate() {
        throw Error("No panel motion expected");
      },
    });
    celebrate(null);
  } finally {
    Object.assign(globalThis, previous);
  }
});
