import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CalendarCheck2, Check, Clock3, MapPin } from "lucide-react";
import { z } from "zod";
import { Button, Card, DemoTag, Screen } from "@/components/ui-kit";
import { centers } from "@/lib/centers";
import { useStore } from "@/lib/store";
import { appointmentTime, canBook, nextDates, services, timeSlots } from "@/lib/visits";
import { useClock } from "@/hooks/use-clock";
import { VisitReminders } from "@/components/VisitReminders";
export const Route = createFileRoute("/book")({
  validateSearch: z.object({ center: z.string().optional(), edit: z.string().optional() }),
  component: Booking,
});
function Booking() {
  const { state, copy, bookVisit, hydrated } = useStore();
  const search = Route.useSearch();
  const previous = state.visits.find((v) => v.id === search.edit);
  // The form mounts after hydration so that a reschedule always has the persisted values.
  if (!hydrated)
    return (
      <Screen title={copy("Запись на приём", "Қабылдауға жазылу")}>
        <p>{copy("Загрузка…", "Жүктелуде…")}</p>
      </Screen>
    );
  if (search.edit && (!previous || previous.status !== "booked"))
    return (
      <Screen title={copy("Перенос недоступен", "Уақытты өзгерту мүмкін емес")}>
        <Link to="/appointments">{copy("Вернуться к посещениям", "Қабылдауларға оралу")}</Link>
      </Screen>
    );
  return (
    <BookingForm
      key={search.edit ?? search.center ?? "new"}
      initialCenter={previous?.centerId ?? search.center ?? "polyclinic-2"}
      {...(previous ? { previous } : {})}
    />
  );
}
function BookingForm({
  initialCenter,
  previous,
}: {
  initialCenter: string;
  previous?: import("@/lib/visits").Visit;
}) {
  const { state, copy, bookVisit } = useStore();
  const now = useClock();
  const navigate = useNavigate();
  const validCenter = centers.some((c) => c.id === initialCenter) ? initialCenter : "polyclinic-2";
  const [centerId, setCenter] = useState(validCenter);
  const [serviceId, setService] = useState<string>(
    previous?.serviceId ??
      services.find((s) => (s.centers as readonly string[]).includes(validCenter))!.id,
  );
  const [date, setDate] = useState(
    previous?.date ??
      nextDates().find((d) =>
        timeSlots.some((t) => canBook(state.visits, validCenter, serviceId, d, t)),
      ) ??
      nextDates()[0]!,
  );
  const [time, setTime] = useState(previous?.time ?? "");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const center = centers.find((c) => c.id === centerId)!;
  const service = services.find((s) => s.id === serviceId)!;
  const available = canBook(state.visits, centerId, serviceId, date, time, now, previous?.id);
  function submit() {
    if (bookVisit(centerId, serviceId, date, time, previous?.id)) {
      setDone(true);
      setError(false);
    } else setError(true);
  }
  if (done)
    return (
      <Screen
        title={copy(
          previous ? "Запись перенесена" : "Вы записаны",
          previous ? "Жазылу уақыты өзгертілді" : "Қабылдауға жазылдыңыз",
        )}
        right={<DemoTag />}
      >
        <Card className="mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 grid place-items-center rounded-full bg-primary-soft text-primary">
            <Check size={30} />
          </div>
          <h2 className="mt-5 text-xl font-semibold">{service[state.lang]}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{center.name[state.lang]}</p>
          <div className="my-6 rounded-xl bg-secondary p-4 text-lg font-semibold">
            {date} · {time}
          </div>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            {copy(
              "Демонстрационная запись сохранена в этом браузере. В медицинский центр она не отправляется.",
              "Демонстрациялық жазылу осы браузерде сақталды. Медициналық орталыққа жіберілмейді.",
            )}
          </p>
          <Button onClick={() => navigate({ to: "/appointments" })}>
            {copy("Мои посещения", "Менің қабылдауларым")}
            <ArrowRight size={16} />
          </Button>
        </Card>
        <div className="mx-auto mt-5 max-w-2xl">
          <VisitReminders
            visit={state.visits.find(
              (v) =>
                v.centerId === centerId &&
                v.date === date &&
                v.time === time &&
                v.status === "booked",
            )}
          />
        </div>
      </Screen>
    );
  return (
    <Screen
      title={copy(
        previous ? "Перенести запись" : "Записаться на приём",
        previous ? "Жазылу уақытын өзгерту" : "Қабылдауға жазылу",
      )}
      subtitle={copy(
        "Выберите удобный день и время. Все часы — по времени Актау.",
        "Қолайлы күн мен уақытты таңдаңыз. Барлық уақыт Ақтау бойынша.",
      )}
      back
      right={<DemoTag />}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,1fr)]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <h2 className="steps-title">
              <span className="step-number">1</span>
              {copy("Куда и к кому", "Қайда және кімге")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="field">
                {copy("Медицинский центр", "Медициналық орталық")}
                <select
                  value={centerId}
                  onChange={(e) => {
                    setCenter(e.target.value);
                    setService(
                      services.find((s) =>
                        (s.centers as readonly string[]).includes(e.target.value),
                      )!.id,
                    );
                    setTime("");
                    setError(false);
                  }}
                >
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[state.lang]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {copy("Услуга", "Қызмет")}
                <select
                  value={serviceId}
                  onChange={(e) => {
                    setService(e.target.value);
                    setTime("");
                  }}
                >
                  {services
                    .filter((s) => (s.centers as readonly string[]).includes(centerId))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s[state.lang]}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="steps-title">
              <span className="step-number">2</span>
              {copy("День и время", "Күн мен уақыт")}
            </h2>
            <div className="date-grid">
              {nextDates(now).map((d) => {
                const day = new Date(appointmentTime(d, "12:00"));
                return (
                  <button
                    key={d}
                    className="date-choice"
                    aria-pressed={date === d}
                    onClick={() => {
                      setDate(d);
                      setTime("");
                      setError(false);
                    }}
                  >
                    <span>
                      {day.toLocaleDateString(state.lang === "kk" ? "kk-KZ" : "ru-RU", {
                        timeZone: "Asia/Qyzylorda",
                        weekday: "short",
                      })}
                    </span>
                    <strong>{day.getUTCDate()}</strong>
                    <span>
                      {day.toLocaleDateString(state.lang === "kk" ? "kk-KZ" : "ru-RU", {
                        timeZone: "Asia/Qyzylorda",
                        month: "short",
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-5 mb-3">
              {copy("Доступное время · длительность 15 минут", "Бос уақыт · ұзақтығы 15 минут")}
            </p>
            <div className="slot-grid">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  className="time-choice"
                  aria-pressed={time === slot}
                  disabled={
                    !canBook(state.visits, centerId, serviceId, date, slot, now, previous?.id)
                  }
                  onClick={() => {
                    setTime(slot);
                    setError(false);
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </Card>
        </div>
        <aside>
          <Card className="p-6">
            <span className="text-primary">
              <CalendarCheck2 size={26} />
            </span>
            <h2 className="mt-4 font-semibold text-base">
              {copy("Ваша запись", "Сіздің жазылуыңыз")}
            </h2>
            <p className="mt-5 text-sm font-medium">{service[state.lang]}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {center.name[state.lang]}
            </p>
            <div className="flex gap-2 text-xs text-muted-foreground mt-5">
              <MapPin size={15} className="shrink-0" />
              {center.address[state.lang]}
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground mt-3">
              <Clock3 size={15} />
              {date} · {time || copy("Выберите время", "Уақытты таңдаңыз")}
            </div>
            <div className="mt-5 pt-5 border-t text-xs text-muted-foreground">
              {copy("Кабинет", "Кабинет")} {service.room}
            </div>
            {error && (
              <p role="alert" className="text-danger text-xs mt-4">
                {copy(
                  "Время недоступно. Выберите другой слот.",
                  "Уақыт қолжетімсіз. Басқа уақытты таңдаңыз.",
                )}
              </p>
            )}
            <Button className="mt-5" disabled={!available} onClick={submit}>
              {copy(
                previous ? "Подтвердить перенос" : "Подтвердить запись",
                previous ? "Өзгерісті растау" : "Жазылуды растау",
              )}
              <ArrowRight size={16} />
            </Button>
          </Card>
          <p className="demo-note mt-4">
            {copy(
              "Учебное расписание. Запись не бронирует реальный приём в клинике.",
              "Оқу кестесі. Жазылу клиникадағы нақты қабылдауды брондамайды.",
            )}
          </p>
          <Link to="/screening" className="muted-link mt-4">
            {copy(
              "Как проходит скрининг и как подготовиться →",
              "Скрининг қалай өтеді және қалай дайындалу керек →",
            )}
          </Link>
        </aside>
      </div>
    </Screen>
  );
}
