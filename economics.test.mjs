import test from "node:test";
import assert from "node:assert/strict";
import { measureRegionalPilot } from "./src/lib/economics.ts";
const cost = (id, amountKzt) => ({ id, amountKzt, evidenceRef: `pilot-report:${id}` });
test("unknown regional evidence is unavailable, not zero or a fabricated estimate", () => {
  assert.deepEqual(
    measureRegionalPilot({ slots: null, avoidedCosts: null, additionalCosts: null }),
    { recoveredHours: null, budgetEffectKzt: null },
  );
  assert.equal(
    measureRegionalPilot({ slots: [], avoidedCosts: [], additionalCosts: null }).budgetEffectKzt,
    null,
  );
});
test("only completed rebooked slots count as recovered clinical time", () => {
  const slot = { id: "1", durationMinutes: 20, rebooked: true, completed: true };
  const result = measureRegionalPilot({
    slots: [
      slot,
      { ...slot, id: "2", completed: false },
      { ...slot, id: "3", rebooked: false },
      { ...slot, id: "4", durationMinutes: 40 },
    ],
    avoidedCosts: null,
    additionalCosts: null,
  });
  assert.equal(result.recoveredHours, 1);
  assert.equal(result.budgetEffectKzt, null);
});
test("documented added costs can exceed avoided costs; capacity does not create cash", () => {
  const result = measureRegionalPilot({
    slots: [{ id: "1", durationMinutes: 60, rebooked: true, completed: true }],
    avoidedCosts: [cost("a", 100)],
    additionalCosts: [cost("b", 150)],
  });
  assert.equal(result.recoveredHours, 1);
  assert.equal(result.budgetEffectKzt, -50);
  assert.equal(
    measureRegionalPilot({ slots: [], avoidedCosts: [], additionalCosts: [] }).budgetEffectKzt,
    0,
  );
});
test("a payment or slot cannot be counted twice, including across budget categories", () => {
  assert.throws(
    () =>
      measureRegionalPilot({
        slots: [],
        avoidedCosts: [cost("same", 100)],
        additionalCosts: [cost("same", 50)],
      }),
    RangeError,
  );
  const slot = { id: "same", durationMinutes: 15, rebooked: true, completed: true };
  assert.throws(
    () => measureRegionalPilot({ slots: [slot, slot], avoidedCosts: null, additionalCosts: null }),
    RangeError,
  );
});
test("financial evidence and finite non-negative amounts are required", () => {
  for (const item of [cost("a", -1), cost("a", Infinity), { ...cost("a", 5), evidenceRef: "" }]) {
    assert.throws(
      () => measureRegionalPilot({ slots: null, avoidedCosts: [item], additionalCosts: [] }),
      RangeError,
    );
  }
  assert.throws(
    () =>
      measureRegionalPilot({
        slots: [{ id: "a", durationMinutes: NaN, rebooked: true, completed: true }],
        avoidedCosts: null,
        additionalCosts: null,
      }),
    RangeError,
  );
});
