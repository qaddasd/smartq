import test from "node:test";
import assert from "node:assert/strict";
import { erlangC, estimateTicketWait } from "./src/lib/queue-model.ts";
import { advanceTicket, delayTicket } from "./src/lib/queue-state.ts";
import {
  appointmentTime,
  canBook,
  canCheckIn,
  clinicDate,
  nextDates,
  waitRange,
} from "./src/lib/visits.ts";
import { centers, findAlternative, parseQrPayload } from "./src/lib/centers.ts";
const now = Date.parse("2026-10-16T04:00:00Z"); // 09:00 in Aktau
const visit = {
  id: "one",
  centerId: "polyclinic-2",
  serviceId: "therapy",
  date: "2026-10-16",
  time: "10:00",
  status: "booked",
  createdAt: now,
};
test("Aktau date changes independently of the device timezone", () => {
  assert.equal(clinicDate(Date.parse("2026-10-16T20:00:00Z")), "2026-10-17");
  assert.equal(nextDates(now).length, 7);
  assert.equal(appointmentTime("2026-10-16", "10:00"), Date.parse("2026-10-16T05:00:00Z"));
});
test("book only a future, valid service and supported appointment slot", () => {
  assert.equal(canBook([], visit.centerId, visit.serviceId, visit.date, "10:00", now), true);
  for (const [c, s, d, t] of [
    ["polyclinic-2", "oncology", "2026-10-16", "10:00"],
    ["polyclinic-2", "therapy", "2026-10-16", "08:45"],
    ["polyclinic-2", "therapy", "2026-10-16", "09:00"],
    ["polyclinic-2", "therapy", "2026-10-30", "10:00"],
    ["polyclinic-2", "therapy", "2026-10-16", "10:01"],
  ])
    assert.equal(canBook([], c, s, d, t, now), false);
});
test("a patient cannot double-book a time, including another centre", () => {
  assert.equal(
    canBook([visit], visit.centerId, visit.serviceId, visit.date, visit.time, now),
    false,
  );
  assert.equal(
    canBook([visit], "polyclinic-1", visit.serviceId, visit.date, visit.time, now),
    false,
  );
});
test("rescheduling excludes its own visit; cancellation releases the slot", () => {
  assert.equal(
    canBook([visit], visit.centerId, visit.serviceId, visit.date, visit.time, now, visit.id),
    true,
  );
  assert.equal(
    canBook(
      [{ ...visit, status: "cancelled" }],
      visit.centerId,
      visit.serviceId,
      visit.date,
      visit.time,
      now,
    ),
    true,
  );
});
test("check-in is limited to the same day and the allowed time window", () => {
  const at = appointmentTime(visit.date, visit.time);
  assert.equal(canCheckIn(visit, at - 30 * 60000), true);
  assert.equal(canCheckIn(visit, at - 31 * 60000), false);
  assert.equal(canCheckIn(visit, at + 60 * 60000), true);
  assert.equal(canCheckIn(visit, at + 61 * 60000), false);
  assert.equal(canCheckIn({ ...visit, status: "arrived" }, at), false);
});
test("zero arrivals means zero wait and no overload", () => {
  assert.deepEqual(erlangC(0, 12, 3), { rho: 0, pWait: 0, lq: 0, wqMin: 0, stable: true });
});
test("Erlang C matches a known M/M/1 queue", () => {
  const m = erlangC(6, 12, 1);
  assert.equal(m.rho, 0.5);
  assert.equal(m.pWait, 0.5);
  assert.equal(m.wqMin, 5);
  assert.equal(m.lq, 0.5);
});
test("capacity overload is explicit; invalid inputs never leak NaN", () => {
  assert.equal(erlangC(36, 12, 3).stable, false);
  for (const args of [
    [-1, 12, 3],
    [20, 0, 3],
    [20, 12, 0],
    [20, 12, 1.5],
    [NaN, 12, 3],
  ]) {
    const m = erlangC(...args);
    assert.equal(m.stable, false);
    assert.equal(Number.isNaN(m.rho), false);
  }
});
test("opening another room reduces modelled waiting", () => {
  assert.ok(erlangC(30, 12, 4).wqMin < erlangC(30, 12, 3).wqMin);
});
const ticket = {
  number: 126,
  centerId: "polyclinic-2",
  room: 201,
  ahead: 3,
  waitMin: 16,
  status: "waiting",
  issuedAt: now,
  demoStep: -1,
};
test("queue completes in order, with explicit call after last person ahead", () => {
  let t = ticket;
  for (const [ahead, status] of [
    [2, "waiting"],
    [1, "soon"],
    [0, "next"],
    [0, "now"],
  ]) {
    t = advanceTicket(t, 12, now + 100);
    assert.equal(t.ahead, ahead);
    assert.equal(t.status, status);
  }
  assert.equal(t.waitMin, 0);
  assert.deepEqual(advanceTicket(t, 12), t);
  assert.equal(ticket.ahead, 3);
});
test("delay survives queue movement and is cleared from wait on call", () => {
  const delayed = delayTicket(ticket, 5, now);
  assert.equal(delayed.waitMin, 21);
  assert.equal(delayed.delayMin, 5);
  const next = advanceTicket(delayed, 12);
  assert.equal(next.waitMin, 15);
  assert.equal(delayTicket({ ...ticket, status: "now" }, 5).waitMin, 16);
});
test("bad wait inputs are bounded and range has a sensible lower bound", () => {
  assert.equal(estimateTicketWait(-3, 12), 0);
  assert.equal(estimateTicketWait(3, 0), 0);
  assert.deepEqual(waitRange(0), [0, 0]);
  assert.deepEqual(waitRange(2), [1, 7]);
});
test("only medically comparable categories are suggested as alternatives", () => {
  assert.equal(findAlternative(centers.find((c) => c.id === "onco-center")), undefined);
  assert.equal(findAlternative(centers.find((c) => c.id === "polyclinic-2")).id, "polyclinic-1");
});
test("QR accepts known centres only", () => {
  assert.equal(parseQrPayload("smartq://center/polyclinic-2"), "polyclinic-2");
  assert.equal(parseQrPayload("https://smartq.example/center/polyclinic-1"), "polyclinic-1");
  assert.equal(parseQrPayload("unknown-id"), null);
});

// Calendar and reminder regressions: time zones, valid UTF-8 and duplicate delivery.
const { visitCalendar, calendarText, foldCalendarLine } = await import("./src/lib/calendar.ts");
const { reminderDue, reminderKey } = await import("./src/lib/visits.ts");
test("calendar preserves Aktau appointment as a UTC instant and has a 15-minute duration", () => {
  const text = visitCalendar(visit, "ru", 10, now).replace(/\r\n /g, "");
  assert.ok(text.includes("DTSTART:20261016T050000Z\r\n"));
  assert.ok(text.includes("DTEND:20261016T051500Z\r\n"));
  assert.ok(text.includes("TRIGGER:-PT10M"));
  assert.ok(text.includes("демо"));
  assert.ok(text.endsWith("END:VCALENDAR\r\n"));
});
test("calendar folds Cyrillic without breaking UTF-8 and keeps physical lines within 75 bytes", () => {
  const source = "SUMMARY:" + "Қабылдауға жазылу — консультация врача ".repeat(8);
  const folded = foldCalendarLine(source);
  assert.equal(folded.replace(/\r\n /g, ""), source);
  for (const line of folded.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  for (const line of visitCalendar(visit, "kk").split("\r\n"))
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
});
test("calendar text escapes structural separators and newlines", () => {
  assert.equal(calendarText("A,B;C\\D\r\nEND:VEVENT"), "A\\,B\\;C\\\\D\\nEND:VEVENT");
});
test("calendar keeps UID after reschedule, increments sequence, and respects no-alarm setting", () => {
  const original = visitCalendar(visit, "ru", null, now);
  const changed = visitCalendar({ ...visit, time: "11:00", revision: 1 }, "ru", null, now);
  assert.equal(original.match(/UID:[^\r]+/)[0], changed.match(/UID:[^\r]+/)[0]);
  assert.ok(changed.includes("SEQUENCE:1"));
  assert.equal(changed.includes("VALARM"), false);
  const cancelled = visitCalendar({ ...visit, status: "cancelled" }, "ru", 10, now);
  assert.ok(cancelled.includes("STATUS:CANCELLED"));
  assert.equal(cancelled.includes("VALARM"), false);
});
test("reminder fires only within its window, and never for cancelled or arrived visits", () => {
  const at = appointmentTime(visit.date, visit.time);
  assert.equal(reminderDue(visit, 10, at - 11 * 60000), false);
  assert.equal(reminderDue(visit, 10, at - 10 * 60000), true);
  assert.equal(reminderDue(visit, 10, at), false);
  assert.equal(reminderDue({ ...visit, status: "cancelled" }, 10, at - 60000), false);
  assert.equal(reminderDue({ ...visit, status: "arrived" }, 10, at - 60000), false);
});
test("persisted reminder identity prevents repeat delivery; rescheduling gets a new reminder", () => {
  const delivered = { ...visit, remindedFor: reminderKey(visit) };
  assert.equal(reminderDue(delivered, 10, appointmentTime(visit.date, visit.time) - 60000), false);
  const moved = { ...delivered, time: "11:00" };
  assert.equal(reminderDue(moved, 10, appointmentTime(moved.date, moved.time) - 60000), true);
});

const { attendanceSchedule, attendanceReminderDue } = await import("./src/lib/visits.ts");
test("attendance reminders respect booking date, latest stage and persistent delivery", () => {
  const at = appointmentTime(visit.date, visit.time);
  const booked = { ...visit, createdAt: at - 96 * 3600000 };
  const stages = attendanceSchedule(booked);
  assert.deepEqual(
    stages.map((s) => s.hours),
    [72, 24, 2],
  );
  assert.equal(attendanceReminderDue(booked, at - 73 * 3600000), null);
  assert.equal(attendanceReminderDue(booked, at - 71 * 3600000).hours, 72);
  assert.equal(attendanceReminderDue(booked, at - 20 * 3600000).hours, 24);
  const sent = { ...booked, attendanceReminded: [stages[1].key] };
  assert.equal(attendanceReminderDue(sent, at - 20 * 3600000), null);
  assert.equal(attendanceReminderDue(sent, at - 3600000).hours, 2);
  assert.equal(
    attendanceReminderDue({ ...booked, scheduledAt: at - 3 * 3600000 }, at - 2.5 * 3600000),
    null,
  );
  assert.equal(attendanceReminderDue({ ...booked, createdAt: at - 3600000 }, at - 1800000), null);
  for (const status of ["cancelled", "arrived", "completed"])
    assert.equal(attendanceReminderDue({ ...booked, status }, at - 3600000), null);
  assert.equal(attendanceReminderDue(booked, at), null);
  assert.equal(attendanceReminderDue({ ...sent, time: "11:00" }, at - 20 * 3600000).hours, 24);
});
test("calendar includes future attendance alarms and omits expired ones", () => {
  const at = appointmentTime(visit.date, visit.time);
  const early = visitCalendar(visit, "ru", 10, at - 96 * 3600000);
  for (const hours of [72, 24, 2]) assert.ok(early.includes(`TRIGGER:-PT${hours}H`));
  const late = visitCalendar(visit, "ru", 10, at - 3 * 3600000);
  assert.ok(!late.includes("TRIGGER:-PT72H"));
  assert.ok(!late.includes("TRIGGER:-PT24H"));
  assert.ok(late.includes("TRIGGER:-PT2H"));
});
