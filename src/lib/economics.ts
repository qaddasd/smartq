/** Illustrative monthly resource model, not clinic financial reporting. */
export interface EconomicInputs {
  centers: number;
  slotsPerDay: number;
  workingDays: number;
  noShowBefore: number;
  noShowAfter: number;
  refillRate: number;
  slotMinutes: number;
  slotValue: number;
  adminMinutes: number;
  staffHourlyCost: number;
  subscription: number;
  messageCost: number;
  messagesPerVisit: number;
  monthlySupport: number;
  setupCost: number;
}

export const defaultEconomicInputs: EconomicInputs = {
  centers: 3,
  slotsPerDay: 60,
  workingDays: 22,
  noShowBefore: 18,
  noShowAfter: 10,
  refillRate: 65,
  slotMinutes: 20,
  slotValue: 2500,
  adminMinutes: 1.5,
  staffHourlyCost: 1800,
  subscription: 70000,
  messageCost: 7,
  messagesPerVisit: 3,
  monthlySupport: 30000,
  setupCost: 1500000,
};

export function calculateEconomics(input: EconomicInputs) {
  if (Object.values(input).some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Inputs must be finite and non-negative");
  }
  if ([input.noShowBefore, input.noShowAfter, input.refillRate].some((value) => value > 100)) {
    throw new RangeError("Percentages must be between 0 and 100");
  }
  if (input.noShowAfter > input.noShowBefore) {
    throw new RangeError("Target no-show cannot exceed baseline in this improvement model");
  }
  const bookings = input.centers * input.slotsPerDay * input.workingDays;
  const missedBefore = (bookings * input.noShowBefore) / 100;
  const missedAfter = (bookings * input.noShowAfter) / 100;
  // Only the fraction actually filled and attended counts as recovered capacity.
  const recoveredVisits = ((missedBefore - missedAfter) * input.refillRate) / 100;
  const clinicalHours = (recoveredVisits * input.slotMinutes) / 60;
  const adminHours = (bookings * input.adminMinutes) / 60;
  const capacityValue = recoveredVisits * input.slotValue;
  const adminValue = adminHours * input.staffHourlyCost;
  const resourceValue = capacityValue + adminValue;
  const subscriptionCost = input.centers * input.subscription;
  const messagingCost = bookings * input.messagesPerVisit * input.messageCost;
  const monthlyCost = subscriptionCost + messagingCost + input.monthlySupport;
  const resourceBalance = resourceValue - monthlyCost;
  const firstYearCost = input.setupCost + monthlyCost * 12;
  const coverageMonths = resourceBalance > 0 ? input.setupCost / resourceBalance : null;
  const costPerRecoveredVisit = recoveredVisits > 0 ? monthlyCost / recoveredVisits : null;
  return {
    bookings,
    missedBefore,
    missedAfter,
    recoveredVisits,
    clinicalHours,
    adminHours,
    capacityValue,
    adminValue,
    resourceValue,
    subscriptionCost,
    messagingCost,
    monthlyCost,
    resourceBalance,
    firstYearCost,
    coverageMonths,
    costPerRecoveredVisit,
    attendedBefore: bookings - missedBefore,
    attendedAfter: bookings - missedBefore + recoveredVisits,
    unfilledAfter: missedBefore - recoveredVisits,
  };
}
