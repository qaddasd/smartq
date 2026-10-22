/** Scheduling rules for the local demonstration. All appointment times are in Aktau. */
export type VisitStatus = "booked" | "arrived" | "completed" | "cancelled";
export interface Visit {
  id: string;
  centerId: string;
  serviceId: string;
  date: string;
  time: string;
  status: VisitStatus;
  createdAt: number;
  completedAt?: number;
  revision?: number;
  remindedFor?: string;
  confirmedAt?: number;
}
export const services = [
  {
    id: "therapy",
    ru: "Терапевт",
    kk: "Терапевт",
    room: 201,
    centers: ["polyclinic-1", "polyclinic-2"],
  },
  {
    id: "screening",
    ru: "Профилактический осмотр",
    kk: "Профилактикалық тексеру",
    room: 105,
    centers: ["polyclinic-1", "polyclinic-2"],
  },
  {
    id: "oncology",
    ru: "Консультация онколога",
    kk: "Онколог кеңесі",
    room: 203,
    centers: ["onco-center"],
  },
  {
    id: "pediatric",
    ru: "Консультация педиатра",
    kk: "Педиатр кеңесі",
    room: 102,
    centers: ["children-hospital"],
  },
] as const;
export const clinicDate = (now = Date.now()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Qyzylorda",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
export const appointmentTime = (date: string, time: string) =>
  Date.parse(`${date}T${time}:00+05:00`);
export function nextDates(now = Date.now(), days = 7) {
  const start = appointmentTime(clinicDate(now), "12:00");
  return Array.from({ length: days }, (_, i) => clinicDate(start + i * 86400000));
}
export const timeSlots = Array.from(
  { length: 28 },
  (_, i) =>
    `${String(9 + Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
);
export function canBook(
  visits: Visit[],
  centerId: string,
  serviceId: string,
  date: string,
  time: string,
  now = Date.now(),
  excludeId?: string,
) {
  const service = services.find((s) => s.id === serviceId);
  return (
    !!service &&
    (service.centers as readonly string[]).includes(centerId) &&
    nextDates(now).includes(date) &&
    timeSlots.includes(time) &&
    appointmentTime(date, time) > now &&
    !visits.some(
      (v) =>
        v.id !== excludeId &&
        v.status !== "cancelled" &&
        v.status !== "completed" &&
        v.date === date &&
        v.time === time,
    )
  );
}
export function canCheckIn(visit: Visit, now = Date.now()) {
  const at = appointmentTime(visit.date, visit.time);
  return (
    visit.status === "booked" &&
    clinicDate(now) === visit.date &&
    now >= at - 30 * 60000 &&
    now <= at + 60 * 60000
  );
}
export function waitRange(waitMin: number) {
  if (waitMin <= 0) return [0, 0] as const;
  return [Math.max(1, waitMin - 3), waitMin + 5] as const;
}

/** Reminder identity follows the scheduled time, so a reschedule can notify again. */
export const reminderKey = (visit: Visit) => `${visit.date}T${visit.time}`;
export function reminderDue(visit: Visit, leadMinutes: number, now = Date.now()) {
  const remaining = appointmentTime(visit.date, visit.time) - now;
  return (
    visit.status === "booked" &&
    [5, 10, 15].includes(leadMinutes) &&
    remaining > 0 &&
    remaining <= leadMinutes * 60000 &&
    visit.remindedFor !== reminderKey(visit)
  );
}
