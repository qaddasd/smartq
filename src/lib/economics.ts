/** Mangystau pilot: operational capacity and documented budget costs stay separate. */
export const economicsRegion = { ru: "Мангистауская область", kk: "Маңғыстау облысы" } as const;
export const regionalScreeningVolume = {
  annualExaminations: 3800,
  status: "source-pending",
  origin: "Provided by the project team; primary source and reporting year pending",
} as const;
export const economicSources = {
  regional: "https://www.gov.kz/memleket/entities/mangystau/press/news/details/1059480",
  reminders:
    "https://www.cochrane.org/evidence/CD007458_mobile-phone-messaging-reminders-attendance-healthcare-appointments",
} as const;
export interface BudgetRecord {
  id: string;
  amountKzt: number;
  evidenceRef: string;
}
export interface RecoveredSlot {
  id: string;
  durationMinutes: number;
  rebooked: boolean;
  completed: boolean;
}
/** Inputs must cover the same pilot period, payer and regional institutions.
 * Avoided costs are separately documented reductions, never slot tariffs or payroll valuations.
 * null means no verified data; [] means a verified zero, not missing information.
 */
export function measureRegionalPilot(input: {
  slots: RecoveredSlot[] | null;
  avoidedCosts: BudgetRecord[] | null;
  additionalCosts: BudgetRecord[] | null;
}) {
  const ids = new Set<string>();
  for (const item of [...(input.avoidedCosts ?? []), ...(input.additionalCosts ?? [])]) {
    if (
      !item.id.trim() ||
      ids.has(item.id) ||
      !item.evidenceRef.trim() ||
      !Number.isFinite(item.amountKzt) ||
      item.amountKzt < 0
    ) {
      throw new RangeError(
        "Budget records require unique IDs, evidence and non-negative finite KZT amounts",
      );
    }
    ids.add(item.id);
  }
  const slots = new Set<string>();
  let minutes = 0;
  for (const slot of input.slots ?? []) {
    if (
      !slot.id.trim() ||
      slots.has(slot.id) ||
      !Number.isFinite(slot.durationMinutes) ||
      slot.durationMinutes < 0
    ) {
      throw new RangeError("Slot records require unique IDs and non-negative finite durations");
    }
    slots.add(slot.id);
    if (slot.rebooked && slot.completed) minutes += slot.durationMinutes;
  }
  return {
    recoveredHours: input.slots === null ? null : minutes / 60,
    budgetEffectKzt:
      input.avoidedCosts === null || input.additionalCosts === null
        ? null
        : input.avoidedCosts.reduce((sum, item) => sum + item.amountKzt, 0) -
          input.additionalCosts.reduce((sum, item) => sum + item.amountKzt, 0),
  };
}
