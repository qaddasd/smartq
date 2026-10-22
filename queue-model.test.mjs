import test from "node:test";
import assert from "node:assert/strict";
import {
  screeningMetrics,
  poissonExceedance,
  littleLawMinutes,
  recommendRooms,
} from "./src/lib/queue-model.ts";
import { centers, centerModel, centerWaitMin, centerLoad } from "./src/lib/centers.ts";
const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("M/M/1 closed form: total and waiting time are distinct, strict tail is off-by-one safe", () => {
  const m = screeningMetrics(6, 12, 1, 3);
  close(m.rho, 0.5);
  close(m.waitMin, 5);
  close(m.totalMin, 10);
  close(m.meanInSystem, 1);
  close(m.busyRooms, 0.5);
  close(m.idleRooms, 0.5);
  // For M/M/1 P(N=n)=(1-rho)*rho^n, Q=max(0,N-1).
  // Q>3 iff N>=5, so tail is rho^5 = 1/32.
  close(m.overflowProbability, 1 / 32);
  close(screeningMetrics(6, 12, 1, 0).overflowProbability, 0.25);
});

test("M/M/2 reference: lambda=6, mu=4, c=2 has Erlang C=9/14", () => {
  const m = screeningMetrics(6, 4, 2, 2);
  close(m.pWait, 9 / 14);
  close(m.waitMin, 135 / 7);
  close(m.totalMin, 240 / 7);
  close(m.lq, 27 / 14);
  close(m.meanInSystem, 24 / 7);
  close(m.overflowProbability, (9 / 14) * (3 / 4) ** 3);
});

test("Little's law has matching units and never divides by zero", () => {
  assert.equal(littleLawMinutes(4, 8), 30);
  assert.equal(littleLawMinutes(0, 8), 0);
  for (const args of [
    [4, 0],
    [-1, 8],
    [1, Infinity],
    [NaN, 8],
  ])
    assert.equal(littleLawMinutes(...args), null);
});

test("no input flow uses explicitly defined limiting values", () => {
  const m = screeningMetrics(0, 12, 3, 5);
  assert.equal(m.waitMin, 0);
  assert.equal(m.totalMin, 5);
  assert.equal(m.overflowProbability, 0);
  assert.equal(m.idleRooms, 3);
});

test("at capacity and above, stationary metrics and risk are unavailable, not fabricated", () => {
  for (const lambda of [36, 60]) {
    const m = screeningMetrics(lambda, 12, 3, 5);
    assert.equal(m.stable, false);
    for (const key of [
      "waitMin",
      "totalMin",
      "meanInSystem",
      "busyRooms",
      "idleRooms",
      "overflowProbability",
    ])
      assert.equal(m[key], null);
  }
});

test("Poisson source formula agrees with closed forms, including a tiny upper tail", () => {
  close(poissonExceedance(2, 3), 0.14287653950145296, 1e-14);
  close(poissonExceedance(2, 3.9), poissonExceedance(2, 3), 1e-14);
  close(poissonExceedance(2, 0), 1 - Math.exp(-2), 1e-14);
  assert.equal(poissonExceedance(0, 5), 0);
  assert.ok(Math.abs(poissonExceedance(1, 20) / 7.542625077205278e-21 - 1) < 1e-12);
});

test("Poisson source formula is numerically stable at large mean (decimal reference)", () => {
  close(poissonExceedance(1000, 1000), 0.491590632831494, 1e-10);
  for (const x of [0, 950, 1000, 1050, 2000]) {
    const p = poissonExceedance(1000, x);
    assert.ok(p >= 0 && p <= 1);
  }
});

test("M/G/infinity occupancy is not substituted for finite waiting-room risk", () => {
  const finite = screeningMetrics(6, 12, 1, 3).overflowProbability;
  const infinite = poissonExceedance(6 / 12, 3);
  assert.ok(Math.abs(finite - infinite) > 0.02);
});

test("more resources reduce waiting and exceedance; higher queue threshold reduces risk", () => {
  const a = screeningMetrics(30, 12, 3, 5);
  const b = screeningMetrics(30, 12, 4, 5);
  assert.ok(b.waitMin < a.waitMin);
  assert.ok(b.overflowProbability < a.overflowProbability);
  assert.ok(screeningMetrics(30, 12, 3, 6).overflowProbability < a.overflowProbability);
});

test("resource recommendation is feasible and minimal within the chosen policy", () => {
  const count = recommendRooms(26, 12, 5, 10, 0.1);
  assert.equal(count, 3);
  const m = screeningMetrics(26, 12, count, 5);
  assert.ok(m.waitMin <= 10 && m.overflowProbability <= 0.1);
  assert.equal(recommendRooms(80, 1, 5, 10, 0.1, 8), null);
});

test("all centre displays use the same calculation instead of a fixed offset", () => {
  for (const center of centers) {
    const m = centerModel(center);
    close(m.rho, center.demo.lambda / (center.demo.mu * center.demo.rooms));
    assert.equal(centerWaitMin(center), Math.round(m.waitMin * 10) / 10);
    assert.equal(centerLoad(center), m.rho >= 0.85 ? "high" : m.rho >= 0.65 ? "mid" : "low");
    close(m.totalMin, m.waitMin + 60 / center.demo.mu);
  }
});

test("invalid scientific model inputs are rejected", () => {
  for (const args of [
    [-1, 12, 3, 5],
    [26, 0, 3, 5],
    [26, 12, 1.5, 5],
    [26, 12, 3, -1],
    [NaN, 12, 3, 5],
  ])
    assert.throws(() => screeningMetrics(...args), RangeError);
  for (const args of [
    [-1, 5],
    [Infinity, 5],
    [1, -1],
    [1, Infinity],
  ])
    assert.throws(() => poissonExceedance(...args), RangeError);
});
