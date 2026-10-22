import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CalendarDays, Check, MapPin, Download, Info, BellRing } from "lucide-react";
import { Screen, Card, Button, DemoTag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { getCenter } from "@/lib/centers";
import { appointmentTime, canCheckIn, services } from "@/lib/visits";
import { downloadVisitCalendar } from "@/lib/calendar";
import { useClock } from "@/hooks/use-clock";
export const Route = createFileRoute("/appointments")({ component: Appointments });
function Appointments() {
  const { state, copy, cancelVisit, confirmVisit, issueTicket, hydrated } = useStore();
  const navigate = useNavigate();
  const now = useClock();
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");
  const upcoming = state.visits.filter((v) => v.status === "booked" || v.status === "arrived");
  const visits = (
    tab === "upcoming"
      ? upcoming
      : state.visits.filter((v) => v.status === "completed" || v.status === "cancelled")
  ).sort((a, b) =>
    tab === "upcoming"
      ? appointmentTime(a.date, a.time) - appointmentTime(b.date, b.time)
      : appointmentTime(b.date, b.time) - appointmentTime(a.date, a.time),
  );
  return (
    <Screen
      title={copy("Мои посещения", "Менің қабылдауларым")}
      subtitle={copy(
        "Ближайшие записи и история — в одном месте.",
        "Алдағы жазылулар мен тарих — бір жерде.",
      )}
      right={<DemoTag />}
    >
      <div className="flex justify-between items-center gap-4 mb-5">
        <div className="tabs-row !mb-0">
          <button aria-pressed={tab === "upcoming"} onClick={() => setTab("upcoming")}>
            {copy("Предстоящие", "Алдағы")} · {upcoming.length}
          </button>
          <button aria-pressed={tab === "history"} onClick={() => setTab("history")}>
            {copy("История", "Тарих")}
          </button>
        </div>
        <Link to="/book" className="muted-link">
          {copy("Новая запись", "Жаңа жазылу")}
          <ArrowRight size={15} />
        </Link>
      </div>
      {error && (
        <p role="alert" className="demo-note mb-4">
          {error}
        </p>
      )}
      {!hydrated ? (
        <p>{copy("Загрузка…", "Жүктелуде…")}</p>
      ) : !visits.length ? (
        <Card className="empty-state">
          <CalendarDays size={42} />
          <h2>
            {copy(
              tab === "upcoming" ? "Пока нет предстоящих посещений" : "История пока пуста",
              tab === "upcoming" ? "Алдағы қабылдаулар жоқ" : "Тарих әзірге бос",
            )}
          </h2>
          <p>
            {copy(
              "Выберите удобное время. Запись появится здесь и останется после закрытия приложения.",
              "Қолайлы уақытты таңдаңыз. Жазылу осы жерде пайда болады және қолданбаны жапқаннан кейін сақталады.",
            )}
          </p>
          <Link to="/book" className="hero-link !mt-0">
            {copy("Записаться", "Жазылу")}
            <ArrowRight size={15} />
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visits.map((v) => {
            const c = getCenter(v.centerId)!;
            const s = services.find((s) => s.id === v.serviceId)!;
            const past = appointmentTime(v.date, v.time) < now - 60 * 60000;
            return (
              <Card key={v.id} className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="clinic-symbol">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <h2 className="font-semibold text-base">{s[state.lang]}</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {v.date} · {v.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-md ${v.status === "cancelled" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"}`}
                  >
                    {v.status === "completed"
                      ? copy("Завершён", "Аяқталды")
                      : v.status === "cancelled"
                        ? copy("Отменён", "Тоқтатылды")
                        : v.status === "arrived"
                          ? copy("В очереди", "Кезекте")
                          : past
                            ? copy("Время прошло", "Уақыты өтті")
                            : copy("Запланирован", "Жоспарланған")}
                  </span>
                </div>
                <p className="mt-5 text-sm">{c.name[state.lang]}</p>
                <p className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  <MapPin size={14} className="shrink-0" />
                  {c.address[state.lang]}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {copy("Кабинет", "Кабинет")} {s.room} · {copy("Время Актау", "Ақтау уақыты")}
                </p>
                {v.status === "booked" && (
                  <div className={`attendance-panel mt-4 ${v.confirmedAt ? "is-confirmed" : ""}`}>
                    <span className="attendance-icon">
                      {v.confirmedAt ? <Check size={18} /> : <BellRing size={18} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b>
                        {v.confirmedAt
                          ? copy("Вы подтвердили визит", "Қабылдауды растадыңыз")
                          : copy("Подтвердите, что придёте", "Келетініңізді растаңыз")}
                      </b>
                      <p>
                        {v.confirmedAt
                          ? copy("Напоминание включено", "Еске салу қосылды")
                          : copy(
                              "Если планы изменились, перенесите или отмените запись заранее — время получит другой пациент.",
                              "Жоспарыңыз өзгерсе, жазылуды алдын ала ауыстырыңыз немесе тоқтатыңыз — уақыт басқа пациентке беріледі.",
                            )}
                      </p>
                    </div>
                    {!v.confirmedAt && (
                      <button className="attendance-confirm" onClick={() => confirmVisit(v.id)}>
                        {copy("Я приду", "Мен келемін")}
                      </button>
                    )}
                  </div>
                )}
                {v.status === "booked" && v.serviceId === "screening" && (
                  <div className="prep-card mt-3">
                    <Info size={17} />
                    <div>
                      <b>{copy("Как подготовиться", "Қалай дайындалу керек")}</b>
                      <p>
                        {copy(
                          "Возьмите удостоверение личности и приходите за 10 минут. Координатор уточнит подготовку для вашего вида скрининга.",
                          "Жеке куәлігіңізді алып, 10 минут ерте келіңіз. Координатор скрининг түріне сай дайындықты нақтылайды.",
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {(v.status === "booked" || v.status === "arrived") && (
                  <div className="mt-4">
                    <button
                      className="muted-link"
                      onClick={() => {
                        try {
                          downloadVisitCalendar(
                            v,
                            state.lang,
                            state.settings.reminders ? state.settings.remindBefore : null,
                          );
                        } catch {
                          setError(
                            copy(
                              "Не удалось подготовить календарь.",
                              "Күнтізбені дайындау мүмкін болмады.",
                            ),
                          );
                        }
                      }}
                    >
                      <Download size={14} />
                      {copy("Добавить в календарь", "Күнтізбеге қосу")}
                    </button>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {copy(
                        "Файл .ics. При переносе обновите запись в календаре вручную.",
                        "Файл .ics. Уақыт өзгергенде, күнтізбедегі жазбаны қолмен жаңартыңыз.",
                      )}
                    </p>
                  </div>
                )}
                {v.status === "arrived" ? (
                  <Link to="/queue" className="muted-link mt-5">
                    {copy("Открыть талон", "Талонды ашу")}
                    <ArrowRight size={15} />
                  </Link>
                ) : (
                  v.status === "booked" && (
                    <>
                      <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t">
                        <Button
                          size="sm"
                          disabled={!canCheckIn(v, now) || !!state.ticket}
                          onClick={() => {
                            try {
                              issueTicket(v.centerId, v.id);
                              navigate({ to: "/queue" });
                            } catch {
                              setError(
                                copy(
                                  "Сейчас нельзя подтвердить прибытие. Проверьте время записи.",
                                  "Қазір келуді растау мүмкін емес. Жазылу уақытын тексеріңіз.",
                                ),
                              );
                            }
                          }}
                        >
                          <Check size={14} />
                          {copy("Я на месте", "Мен келдім")}
                        </Button>
                        <Link
                          to="/book"
                          search={{ edit: v.id }}
                          className="px-3 py-2 text-xs text-primary rounded-lg bg-primary-soft"
                        >
                          {copy("Перенести", "Уақытын өзгерту")}
                        </Link>
                        <button
                          className="px-3 py-2 text-xs text-muted-foreground"
                          onClick={() => setConfirm(v.id)}
                        >
                          {copy("Не смогу прийти", "Келе алмаймын")}
                        </button>
                      </div>
                      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                        {state.ticket
                          ? copy(
                              "Сначала завершите текущую очередь.",
                              "Алдымен ағымдағы кезекті аяқтаңыз.",
                            )
                          : copy(
                              "Прибытие: за 30 минут до записи и в течение часа после неё.",
                              "Келуді растау: қабылдаудан 30 минут бұрын және одан кейін бір сағат ішінде.",
                            )}
                      </p>
                      {confirm === v.id && (
                        <div className="mt-4 rounded-xl bg-danger-soft p-4" role="alert">
                          <p className="text-xs mb-3">
                            {copy(
                              "Отменить эту запись? Время освободится.",
                              "Осы жазылуды тоқтатасыз ба? Уақыт босатылады.",
                            )}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                cancelVisit(v.id);
                                setConfirm(null);
                              }}
                            >
                              {copy("Да, отменить", "Иә, тоқтату")}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>
                              {copy("Оставить", "Қалдыру")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                )}
              </Card>
            );
          })}
        </div>
      )}
      <p className="demo-note mt-6">
        {copy(
          "Демонстрационные записи хранятся в этом браузере. Реальная запись в медицинские организации не выполняется.",
          "Демонстрациялық жазылулар осы браузерде сақталады. Медициналық ұйымдарға нақты жазылу орындалмайды.",
        )}
      </p>
    </Screen>
  );
}
