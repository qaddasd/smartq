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
  return Math.round((ahead * 60) / mu + 1);
}
export const forecastSlots = ["09:00", "11:00", "12:30", "14:30", "16:00", "17:30"] as const;
