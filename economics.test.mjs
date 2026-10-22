import test from "node:test";
import assert from "node:assert/strict";
import { calculateEconomics, defaultEconomicInputs } from "./src/lib/economics.ts";

test("default monthly example accounts for recovered visits and each expense", () => {
  const result = calculateEconomics(defaultEconomicInputs);
  assert.equal(result.bookings, 3960);
  assert.ok(Math.abs(result.recoveredVisits - 205.92) < 1e-9);
  assert.ok(Math.abs(result.clinicalHours - 68.64) < 1e-9);
  assert.equal(result.adminHours, 99);
  assert.equal(result.monthlyCost, 323160);
  assert.ok(Math.abs(result.resourceBalance - 369840) < 1e-6);
  assert.equal(result.firstYearCost, 5377920);
  assert.ok(Math.abs(result.attendedAfter + result.unfilledAfter - result.bookings) < 1e-9);
});

test("no improvement or zero refill cannot invent extra visits", () => {
  for (const change of [{ noShowAfter: 18 }, { refillRate: 0 }, { slotsPerDay: 0 }]) {
    const result = calculateEconomics({ ...defaultEconomicInputs, ...change });
    assert.equal(result.recoveredVisits, 0);
    assert.equal(result.costPerRecoveredVisit, null);
  }
});

test("negative balance has no resource coverage period and never means cash savings", () => {
  const result = calculateEconomics({ ...defaultEconomicInputs, subscription: 1000000 });
  assert.ok(result.resourceBalance < 0);
  assert.equal(result.coverageMonths, null);
});

test("full recovery cannot exceed the baseline missed visits", () => {
  const result = calculateEconomics({ ...defaultEconomicInputs, noShowAfter: 0, refillRate: 100 });
  assert.equal(result.recoveredVisits, result.missedBefore);
  assert.equal(result.attendedAfter, result.bookings);
  assert.equal(result.unfilledAfter, 0);
});

test("invalid rates and non-finite amounts are rejected", () => {
  for (const change of [
    { noShowAfter: 19 },
    { refillRate: 101 },
    { messageCost: -1 },
    { slotValue: Infinity },
    { centers: NaN },
  ]) {
    assert.throws(() => calculateEconomics({ ...defaultEconomicInputs, ...change }), RangeError);
  }
});
