import type { Lang } from "./i18n";
import { getCenter } from "./centers.ts";
import { appointmentTime, services, attendanceReminderHours, type Visit } from "./visits.ts";

/** RFC 5545 TEXT escaping and UTF-8-safe content line folding. */
export function calendarText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
export function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  let result = "";
  let length = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (length + bytes > 75) {
      result += "\r\n ";
      length = 1;
    }
    result += character;
    length += bytes;
  }
  return result;
}
const calendarTime = (timestamp: number) =>
  new Date(timestamp)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
export function visitCalendar(
  visit: Visit,
  lang: Lang,
  reminderMinutes: number | null = 10,
  now = Date.now(),
) {
  const center = getCenter(visit.centerId);
  const service = services.find((item) => item.id === visit.serviceId);
  const start = appointmentTime(visit.date, visit.time);
  if (!center || !service || !Number.isFinite(start)) throw new Error("Invalid calendar visit");
  const title = `SmartQ · ${service[lang]} (${lang === "kk" ? "демо" : "демо"})`;
  const description =
    lang === "kk"
      ? `Демонстрациялық жазылу. ${service.room} кабинет. Бұл клиникадағы нақты бронь емес. Қолданбадағы өзгерістер күнтізбеге автоматты түрде берілмейді.`
      : `Демонстрационная запись. Кабинет ${service.room}. Это не реальная бронь в клинике. Изменения в приложении автоматически не обновляют календарь.`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartQ//Health Demo//RU",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${encodeURIComponent(visit.id)}@smartq.local`,
    `DTSTAMP:${calendarTime(now)}`,
    `SEQUENCE:${Math.max(0, Math.floor(visit.revision ?? 0))}`,
    `DTSTART:${calendarTime(start)}`,
    `DTEND:${calendarTime(start + 15 * 60000)}`,
    `SUMMARY:${calendarText(title)}`,
    `LOCATION:${calendarText(`${center.name[lang]}, ${center.address[lang]}`)}`,
    `DESCRIPTION:${calendarText(description)}`,
    `STATUS:${visit.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
  ];
  if (
    reminderMinutes !== null &&
    [5, 10, 15].includes(reminderMinutes) &&
    visit.status !== "cancelled"
  ) {
    for (const hours of attendanceReminderHours) {
      // Do not import already expired alerts into the patient's calendar.
      if (start - hours * 3600000 <= now) continue;
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `TRIGGER:-PT${hours}H`,
        `DESCRIPTION:${calendarText(title)}`,
        "END:VALARM",
      );
    }
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `TRIGGER:-PT${reminderMinutes}M`,
      `DESCRIPTION:${calendarText(title)}`,
      "END:VALARM",
    );
  }
  return [...lines, "END:VEVENT", "END:VCALENDAR"].map(foldCalendarLine).join("\r\n") + "\r\n";
}
export function downloadVisitCalendar(visit: Visit, lang: Lang, reminderMinutes: number | null) {
  const url = URL.createObjectURL(
    new Blob([visitCalendar(visit, lang, reminderMinutes)], {
      type: "text/calendar;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `SmartQ-${visit.date}-${visit.time.replace(":", "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
