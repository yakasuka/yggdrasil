import test from "node:test";
import assert from "node:assert/strict";
import { latencyTone, latencyPill, latencyLegend } from "../src/ui.js";

test("latency tiers map to the right health colour and label", () => {
  assert.deepEqual(latencyTone(null), { tone: "idle", label: "未检测" });
  assert.deepEqual(latencyTone(undefined), { tone: "idle", label: "未检测" });
  assert.deepEqual(latencyTone(80), { tone: "good", label: "顺畅" });
  assert.deepEqual(latencyTone(149), { tone: "good", label: "顺畅" });
  assert.deepEqual(latencyTone(150), { tone: "ok", label: "良好" });
  assert.deepEqual(latencyTone(300), { tone: "ok", label: "良好" });
  assert.deepEqual(latencyTone(400), { tone: "congested", label: "堵塞" });
  assert.deepEqual(latencyTone(600), { tone: "congested", label: "堵塞" });
  assert.deepEqual(latencyTone(800), { tone: "timeout", label: "超时" });
  assert.deepEqual(latencyTone(1200), { tone: "timeout", label: "超时" });
});

test("latency pill renders the tier class, value and label", () => {
  const fast = latencyPill(96);
  assert.match(fast, /class="latency-pill latency-pill--good"/);
  assert.match(fast, /96 ms/);
  assert.match(fast, /顺畅/);
  assert.ok(fast.includes("<i"), "pill carries the status dot");

  const missing = latencyPill(null);
  assert.match(missing, /latency-pill--idle/);
  assert.match(missing, /未检测/);
});

test("legend lists all four non-idle tiers", () => {
  const legend = latencyLegend();
  for (const label of ["顺畅", "良好", "堵塞", "超时"])
    assert.ok(legend.includes(label), `${label} in legend`);
  assert.ok(!legend.includes("未检测"), "idle is not a health tier");
});
