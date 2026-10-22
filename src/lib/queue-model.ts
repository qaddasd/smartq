/** M/M/c (Erlang C), rates per hour. The model assumes identical parallel rooms. */
export interface ModelResult {
  rho: number;
  pWait: number;
  lq: number;
  wqMin: number;
  stable: boolean;
}
export function erlangC(lambda: number, mu: number, c: number): ModelResult {
  if (
    ![lambda, mu, c].every(Number.isFinite) ||
    lambda < 0 ||
    mu <= 0 ||
    c < 1 ||
    !Number.isInteger(c)
  ) {
    return { rho: 0, pWait: 0, lq: 0, wqMin: 0, stable: false };
  }
  if (lambda === 0) return { rho: 0, pWait: 0, lq: 0, wqMin: 0, stable: true };
  const rho = lambda / (c * mu);
  if (rho >= 1) return { rho, pWait: 1, lq: Infinity, wqMin: Infinity, stable: false };
  // Erlang B recurrence avoids overflowing factorials for larger room counts.
  const a = lambda / mu;
  let b = 1;
  for (let k = 1; k <= c; k++) b = (a * b) / (k + a * b);
  const pWait = b / (1 - rho + rho * b);
  const wqHours = pWait / (c * mu - lambda);
  return { rho, pWait, lq: lambda * wqHours, wqMin: wqHours * 60, stable: true };
}
export function estimateTicketWait(ahead: number, mu: number) {
  if (!Number.isFinite(ahead) || !Number.isFinite(mu) || mu <= 0 || ahead <= 0) return 0;
  // One assigned room: expected workload ahead, not stationary Little's law.
  // Assumes a full mean service time per person; no arbitrary minute offset.
  return Math.round((ahead * 60) / mu);
}
export const forecastSlots = ["09:00", "11:00", "12:30", "14:30", "16:00", "17:30"] as const;

export const queueSources = {
  screening: "https://doi.org/10.1371/journal.pcbi.1010179",
  finite: "https://homepages.ecs.vuw.ac.nz/~schukova/SCIE201/Lectures/Lecture9_final2018.html",
} as const;

/** Little's law. L is a time-average population, not a single queue snapshot. */
export function littleLawMinutes(meanNumber: number, throughputPerHour: number): number | null {
  if (
    !Number.isFinite(meanNumber) ||
    meanNumber < 0 ||
    !Number.isFinite(throughputPerHour) ||
    throughputPerHour <= 0
  )
    return null;
  return (meanNumber / throughputPerHour) * 60;
}

/**
 * Clinic adaptation: one FCFS queue, c identical parallel resources, Poisson
 * arrivals and independent exponential service times. Not the M/G/infinity
 * disease-state network in Dean et al. (2022), pp. 4–5.
 * For Q = number WAITING (excludes those in service), and integer x >= 0:
 * P(Q > x) = P(N >= c + x + 1) = ErlangC * rho^(x + 1).
 * This is a stationary exceedance probability, not a forecast of a peak event.
 */
export function screeningMetrics(lambda: number, mu: number, rooms: number, threshold = 5) {
  if (
    ![lambda, mu, rooms, threshold].every(Number.isFinite) ||
    lambda < 0 ||
    mu <= 0 ||
    rooms < 1 ||
    !Number.isInteger(rooms) ||
    threshold < 0 ||
    !Number.isInteger(threshold)
  ) {
    throw new RangeError("Invalid clinic model inputs");
  }
  const model = erlangC(lambda, mu, rooms);
  const serviceMin = 60 / mu;
  const busyRooms = model.stable ? lambda / mu : null;
  const meanInSystem = model.stable ? model.lq + lambda / mu : null;
  const waitMin = model.stable ? (lambda === 0 ? 0 : littleLawMinutes(model.lq, lambda)) : null;
  const totalMin =
    meanInSystem === null
      ? null
      : lambda === 0
        ? serviceMin
        : littleLawMinutes(meanInSystem, lambda);
  return {
    ...model,
    serviceMin,
    busyRooms,
    meanInSystem,
    waitMin,
    totalMin,
    idleRooms: busyRooms === null ? null : rooms - busyRooms,
    overflowProbability: model.stable ? model.pWait * model.rho ** (threshold + 1) : null,
    threshold,
  };
}

/** log(n!) without overflowing n!, for Poisson tails. */
function logFactorial(n: number) {
  if (n < 2) return 0;
  if (n < 256) {
    let value = 0;
    for (let i = 2; i <= n; i++) value += Math.log(i);
    return value;
  }
  // Stirling's expansion, with error below 1e-14 in the supported domain.
  const inverse = 1 / n;
  return (
    (n + 0.5) * Math.log(n) -
    n +
    Math.log(2 * Math.PI) / 2 +
    inverse / 12 -
    inverse ** 3 / 360 +
    inverse ** 5 / 1260
  );
}

/**
 * Source-only M/G/infinity occupancy: P(N > x), N ~ Poisson(a).
 * a = lambda/mu; eta_1 may replace lambda only without internal arrivals.
 * NOT the waiting-room overflow probability for finite clinical resources.
 * Sum the smaller tail directly to avoid cancellation of small probabilities.
 */
export function poissonExceedance(mean: number, threshold: number) {
  if (
    !Number.isFinite(mean) ||
    mean < 0 ||
    mean > 1e6 ||
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1e6
  )
    throw new RangeError("Invalid Poisson inputs");
  const x = Math.floor(threshold);
  if (mean === 0) return 0;
  if (x < mean) {
    let term = Math.exp(-mean + x * Math.log(mean) - logFactorial(x));
    let cdf = term;
    for (let k = x; k > 0; k--) {
      term *= k / mean;
      cdf += term;
      if (term < cdf * 1e-15) break;
    }
    return Math.max(0, Math.min(1, 1 - cdf));
  }
  let k = x + 1;
  let term = Math.exp(-mean + k * Math.log(mean) - logFactorial(k));
  let tail = term;
  while (term > 0) {
    k += 1;
    term *= mean / k;
    tail += term;
    if (term < tail * 1e-15) break;
  }
  return Math.max(0, Math.min(1, tail));
}

/** Least resources meeting explicit, user-chosen targets. Not a clinical norm. */
export function recommendRooms(
  lambda: number,
  mu: number,
  threshold: number,
  maxWaitMin: number,
  maxRisk: number,
  maxRooms = 32,
) {
  if (
    ![maxWaitMin, maxRisk, maxRooms].every(Number.isFinite) ||
    maxWaitMin < 0 ||
    maxRisk < 0 ||
    maxRisk > 1 ||
    !Number.isInteger(maxRooms) ||
    maxRooms < 1 ||
    maxRooms > 256
  )
    throw new RangeError("Invalid resource policy");
  for (let rooms = 1; rooms <= maxRooms; rooms++) {
    const model = screeningMetrics(lambda, mu, rooms, threshold);
    if (
      model.waitMin !== null &&
      model.overflowProbability !== null &&
      model.waitMin <= maxWaitMin &&
      model.overflowProbability <= maxRisk
    )
      return rooms;
  }
  return null;
}
