import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  BellRing,
  RefreshCcw,
  HeartPulse,
} from "lucide-react";
import { Screen, Card, LoadBadge, DemoTag } from "@/components/ui-kit";
import { TicketCard } from "@/components/TicketCard";
import { useStore } from "@/lib/store";
import { centers, centerLoad, centerWaitMin } from "@/lib/centers";
import { appointmentTime, services } from "@/lib/visits";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartQ — ваше время имеет значение" },
      {
        name: "description",
        content:
          "Запись на приём, электронная очередь и прогноз загрузки медицинских центров Актау.",
      },
    ],
  }),
  component: HomePage,
});
function HomePage() {
  const { state, copy, hydrated } = useStore();
  const upcoming = state.visits
    .filter(
      (v) => v.status === "booked" && appointmentTime(v.date, v.time) > Date.now() - 60 * 60000,
    )
    .sort((a, b) => appointmentTime(a.date, a.time) - appointmentTime(b.date, b.time))[0];
  const upcomingCenter = upcoming ? centers.find((c) => c.id === upcoming.centerId) : null;
  const service = services.find((s) => s.id === upcoming?.serviceId);
  return (
    <Screen
      title={
        state.displayName
          ? copy(`Здравствуйте, ${state.displayName}`, `Сәлеметсіз бе, ${state.displayName}`)
          : copy("Здоровье начинается вовремя", "Денсаулық уақытылы тексеруден басталады")
      }
      subtitle={copy(
        "Запишитесь на скрининг, получите напоминание и не пропустите важный этап обследования.",
        "Скринингке жазылыңыз, еске салу алыңыз және тексерудің маңызды кезеңін өткізіп алмаңыз.",
      )}
      right={<DemoTag />}
    >
      <div className="dashboard-grid">
        <div>
          {hydrated && state.ticket ? (
            <TicketCard ticket={state.ticket} />
          ) : (
            <section className="hero-panel">
              <span className="hero-eyebrow">
                <Sparkles size={13} />
                {copy("SMARTSCREEN · ПРОФИЛАКТИКА", "SMARTSCREEN · АЛДЫН АЛУ")}
              </span>
              <h2>
                {copy(
                  "Не откладывайте\nважное обследование.",
                  "Маңызды тексеруді\nкейінге қалдырмаңыз.",
                )}
              </h2>
              <p>
                {copy(
                  "SmartQ напомнит о визите, поможет перенести запись и освободит время для другого пациента, если вы не сможете прийти.",
                  "SmartQ қабылдауды еске салады, уақытты ауыстыруға көмектеседі және келе алмасаңыз, бос уақытты басқа пациентке ұсынады.",
                )}
              </p>
              <Link to="/book" className="hero-link">
                {copy("Записаться на приём", "Қабылдауға жазылу")}
                <ArrowRight size={16} />
              </Link>
            </section>
          )}
          <div className="quick-actions">
            <Link to="/book" className="quick-action">
              <CalendarDays size={22} />
              <div>
                <b>{copy("Записаться", "Жазылу")}</b>
                <small>{copy("Выбрать время", "Уақытты таңдау")}</small>
              </div>
            </Link>
            <Link to="/scan" className="quick-action">
              <QrCode size={22} />
              <div>
                <b>{copy("Я уже в клинике", "Клиникадамын")}</b>
                <small>{copy("Вход по QR-коду", "QR арқылы кіру")}</small>
              </div>
            </Link>
            <Link to="/map" className="quick-action">
              <MapPin size={22} />
              <div>
                <b>{copy("Найти центр", "Орталықты табу")}</b>
                <small>{copy("На карте Актау", "Ақтау картасында")}</small>
              </div>
            </Link>
          </div>
          <div className="care-strip">
            {[
              {
                icon: BellRing,
                title: copy("Напомним", "Еске саламыз"),
                body: copy("Заранее и накануне", "Алдын ала және бір күн қалғанда"),
              },
              {
                icon: RefreshCcw,
                title: copy("Перенесём", "Уақытты ауыстырамыз"),
                body: copy("Без звонка в регистратуру", "Тіркеу бөліміне қоңыраусыз"),
              },
              {
                icon: HeartPulse,
                title: copy("Сопроводим", "Сүйемелдейміз"),
                body: copy("До завершения обследования", "Тексеру аяқталғанға дейін"),
              },
            ].map(({ icon: Icon, title, body }) => (
              <div className="care-item" key={title}>
                <span><Icon size={19} /></span>
                <div><b>{title}</b><small>{body}</small></div>
              </div>
            ))}
          </div>
          <div className="section-heading">
            <h2>{copy("Медицинские центры", "Медициналық орталықтар")}</h2>
            <Link to="/centers" className="flex items-center gap-1">
              {copy("Все центры", "Барлық орталықтар")}
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="clinic-grid">
            {centers
              .filter((c) => c.id.startsWith("polyclinic"))
              .map((c) => (
                <Link to="/center/$id" params={{ id: c.id }} key={c.id}>
                  <Card className="clinic-card h-full">
                    <div className="flex items-center justify-between">
                      <span className="clinic-symbol">
                        <Building2 size={20} />
                      </span>
                      <LoadBadge level={centerLoad(c)} />
                    </div>
                    <h3>{c.name[state.lang]}</h3>
                    <p>{c.address[state.lang]}</p>
                    <div className="clinic-footer">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 size={13} />
                        {copy("Ожидание", "Күту")} ~{centerWaitMin(c)} {copy("мин", "мин")}
                      </span>
                      <ArrowRight size={15} className="text-primary" />
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
          <p className="welcome-note mt-3">
            {copy(
              "Показатели загрузки и расписание — демонстрационные.",
              "Жүктеме көрсеткіштері мен кесте — демонстрациялық.",
            )}
          </p>
        </div>
        <aside className="dashboard-aside">
          <section>
            <div className="section-heading !mt-0">
              <h2>{copy("Ближайшее посещение", "Алдағы қабылдау")}</h2>
              <CalendarDays size={17} className="text-muted-foreground" />
            </div>
            <Card className="p-5">
              {upcoming ? (
                <>
                  <div className="text-xs text-primary font-medium">
                    {new Date(appointmentTime(upcoming.date, upcoming.time)).toLocaleDateString(
                      state.lang === "kk" ? "kk-KZ" : "ru-RU",
                      { timeZone: "Asia/Qyzylorda", day: "numeric", month: "long" },
                    )}{" "}
                    · {upcoming.time}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{service?.[state.lang]}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {upcomingCenter?.name[state.lang]}
                  </p>
                  <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                    {copy("Кабинет", "Кабинет")} {service?.room}
                  </div>
                  <Link to="/appointments" className="muted-link mt-5">
                    {copy("Открыть запись", "Жазылуды ашу")}
                    <ArrowRight size={14} />
                  </Link>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-secondary w-11 h-11 grid place-items-center text-muted-foreground">
                    <CalendarDays size={21} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">
                    {copy("Здесь будет ваш визит", "Қабылдауыңыз осы жерде болады")}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {copy(
                      "Запишитесь на удобное время — дата, кабинет и статус всегда будут под рукой.",
                      "Қолайлы уақытқа жазылыңыз — күн, кабинет пен мәртебе әрдайым қолжетімді болады.",
                    )}
                  </p>
                  <Link to="/book" className="muted-link mt-4">
                    {copy("Выбрать время", "Уақытты таңдау")}
                    <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </Card>
          </section>
          <section className="mt-6">
            <div className="section-heading">
              <h2>{copy("Ваш маршрут к приёму", "Қабылдауға дейінгі жол")}</h2>
            </div>
            <Card className="p-5">
              <div className="journey">
                {[
                  {
                    icon: CalendarDays,
                    title: copy("Запишитесь", "Жазылыңыз"),
                    body: copy(
                      "Выберите центр и свободное время",
                      "Орталық пен бос уақытты таңдаңыз",
                    ),
                  },
                  {
                    icon: QrCode,
                    title: copy("Подтвердите прибытие", "Келгеніңізді растаңыз"),
                    body: copy(
                      "Откройте посещение или QR-сканер",
                      "Қабылдауды немесе QR сканерін ашыңыз",
                    ),
                  },
                  {
                    icon: Check,
                    title: copy("Приходите к своему кабинету", "Өз кабинетіңізге келіңіз"),
                    body: copy(
                      "Следите за номером и статусом талона",
                      "Талон нөмірі мен мәртебесін бақылаңыз",
                    ),
                  },
                ].map(({ icon: Icon, title, body }, i) => (
                  <div className={`journey-item ${i === 0 ? "active" : ""}`} key={title}>
                    <span className="journey-icon">
                      <Icon size={15} />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
          <div className="flex gap-2 items-start mt-5 px-1 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck size={17} className="shrink-0 text-primary" />
            {copy(
              "Для знакомства с приложением не нужны ИИН и номер телефона.",
              "Қолданбамен танысу үшін ЖСН мен телефон нөмірі қажет емес.",
            )}
          </div>
        </aside>
      </div>
    </Screen>
  );
}
