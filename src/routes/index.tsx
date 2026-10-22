import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, LoadBadge, DemoTag } from "@/components/ui-kit";
import {
  SmartIcon,
  PromoArtwork,
  ScreeningArtwork,
  type SmartIconName,
} from "@/components/SmartIcons";
import { TicketCard } from "@/components/TicketCard";
import { useStore } from "@/lib/store";
import { centers, centerLoad, centerWaitMin } from "@/lib/centers";
import { appointmentTime, services } from "@/lib/visits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartQ — здоровье без лишнего ожидания" },
      {
        name: "description",
        content:
          "Запись на онкоскрининг, электронная очередь и карта медицинских центров Актау и Мангистауской области.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { state, copy, hydrated } = useStore();
  const upcoming = hydrated
    ? state.visits
        .filter(
          (v) => v.status === "booked" && appointmentTime(v.date, v.time) > Date.now() - 60 * 60000,
        )
        .sort((a, b) => appointmentTime(a.date, a.time) - appointmentTime(b.date, b.time))[0]
    : undefined;
  const upcomingCenter = upcoming ? centers.find((c) => c.id === upcoming.centerId) : null;
  const service = services.find((s) => s.id === upcoming?.serviceId);
  const tiles = [
    {
      to: "/centers",
      icon: "clinic",
      title: copy("Моя поликлиника", "Менің емханам"),
      subtitle: copy("Найти свой центр", "Өз орталығымды табу"),
    },
    {
      to: "/book",
      icon: "booking",
      title: copy("Запись на приём", "Қабылдауға жазылу"),
      subtitle: copy("Выбрать удобное время", "Қолайлы уақытты таңдау"),
    },
    {
      to: "/appointments",
      icon: "visits",
      title: copy("Мои посещения", "Менің қабылдауларым"),
      subtitle: copy("Записи и напоминания", "Жазылу мен еске салу"),
    },
    {
      to: "/queue",
      icon: "queue",
      title: copy("Моя очередь", "Менің кезегім"),
      subtitle: copy("Ваш талон и ожидание", "Талон мен күту уақыты"),
    },
    {
      to: "/scan",
      icon: "scan",
      title: copy("Я уже в клинике", "Клиникаға келдім"),
      subtitle: copy("Отметиться по QR", "QR арқылы белгілеу"),
    },
    {
      to: "/map",
      icon: "map",
      title: copy("Карта центров", "Орталықтар картасы"),
      subtitle: copy("Где меньше очередь", "Кезек қайда аз"),
    },
  ] as const;
  return (
    <div className="health-home">
      <Screen
        title={
          state.displayName
            ? copy(`Здравствуйте, ${state.displayName}`, `Сәлеметсіз бе, ${state.displayName}`)
            : copy("Здоровье ближе, чем кажется", "Денсаулық сіз ойлағаннан жақын")
        }
        subtitle={copy(
          "Ваш помощник в записи на скрининг и управлении очередью.",
          "Скринингке жазылу мен кезекті басқарудағы көмекшіңіз.",
        )}
        right={<DemoTag />}
      >
        <section
          className="health-promo-deck"
          aria-label={copy("Полезное для вас", "Сізге пайдалы")}
        >
          <Link to="/book" className="health-promo health-promo-blue">
            <span>{copy("Обследование\nв удобное время", "Тексеру\nқолайлы уақытта")}</span>
            <small>
              {copy("Записаться", "Жазылу")} <SmartIcon name="arrow" size={16} />
            </small>
            <PromoArtwork variant="calendar" />
          </Link>
          <Link to="/profile" className="health-promo health-promo-light">
            <span>{copy("Всё важное —\nв вашем профиле", "Маңыздының бәрі —\nпрофиліңізде")}</span>
            <small>
              {copy("Открыть профиль", "Профильді ашу")} <SmartIcon name="arrow" size={16} />
            </small>
            <PromoArtwork variant="profile" />
          </Link>
          <Link to="/map" className="health-promo health-promo-teal">
            <span>{copy("Найдите центр\nрядом с вами", "Жақын орталықты\nтабыңыз")}</span>
            <small>
              {copy("Смотреть карту", "Картаны көру")} <SmartIcon name="arrow" size={16} />
            </small>
            <PromoArtwork variant="map" />
          </Link>
        </section>

        {hydrated && state.ticket && (
          <div className="home-active-ticket">
            <TicketCard ticket={state.ticket} />
          </div>
        )}

        <div className="health-main-grid">
          <section
            className="health-service-grid"
            aria-label={copy("Сервисы SmartQ", "SmartQ сервистері")}
          >
            {tiles.map((tile) => (
              <Link key={tile.to} to={tile.to} className="health-service-tile">
                <SmartIcon name={tile.icon as SmartIconName} size={46} />
                <b>{tile.title}</b>
                <span>{tile.subtitle}</span>
                {tile.to === "/queue" && hydrated && state.ticket && (
                  <i className="tile-active-dot" />
                )}
              </Link>
            ))}
          </section>
          <section className="screening-feature">
            <div className="screening-feature-copy">
              <span className="health-eyebrow">{copy("ЗАБОТА О СЕБЕ", "ӨЗІҢІЗГЕ ҚАМҚОРЛЫҚ")}</span>
              <h2>{copy("Онкоскрининг", "Онкоскрининг")}</h2>
              <p>
                {copy(
                  "Важное обследование.\nБез лишнего ожидания.",
                  "Маңызды тексеру.\nАртық күтусіз.",
                )}
              </p>
              <Link to="/book">
                {copy("Выбрать время", "Уақыт таңдау")}
                <SmartIcon name="arrow" size={20} />
              </Link>
            </div>
            <ScreeningArtwork />
          </section>
        </div>
        <Link to="/more" className="health-all-services">
          <SmartIcon name="more" size={25} />
          <span>{copy("Все разделы", "Барлық бөлімдер")}</span>
          <SmartIcon name="arrow" size={22} />
        </Link>

        {upcoming && (
          <section className="health-next-visit">
            <span className="health-visit-icon">
              <SmartIcon name="visits" size={32} />
            </span>
            <div>
              <small>{copy("БЛИЖАЙШЕЕ ПОСЕЩЕНИЕ", "АЛДАҒЫ ҚАБЫЛДАУ")}</small>
              <h2>{service?.[state.lang]}</h2>
              <p>
                {upcoming.date} · {upcoming.time} · {upcomingCenter?.name[state.lang]}
              </p>
            </div>
            <Link to="/appointments" aria-label={copy("Открыть посещение", "Қабылдауды ашу")}>
              <SmartIcon name="arrow" size={26} />
            </Link>
          </section>
        )}

        <div className="health-section-heading">
          <div>
            <span className="health-eyebrow">{copy("АКТАУ · МАНГИСТАУ", "АҚТАУ · МАҢҒЫСТАУ")}</span>
            <h2>{copy("Медицинские центры", "Медициналық орталықтар")}</h2>
          </div>
          <Link to="/centers">
            {copy("Все центры", "Барлық орталықтар")} <SmartIcon name="arrow" size={20} />
          </Link>
        </div>
        <div className="health-clinic-grid">
          {centers
            .filter((center) => center.id.startsWith("polyclinic") || center.id === "onco-center")
            .map((center) => (
              <Link
                to="/center/$id"
                params={{ id: center.id }}
                key={center.id}
                className="health-clinic-card"
              >
                <div className="health-clinic-card-top">
                  <span className="health-clinic-icon">
                    <SmartIcon name="clinic" size={30} />
                  </span>
                  <LoadBadge level={centerLoad(center)} />
                </div>
                <h3>{center.name[state.lang]}</h3>
                <p>{center.address[state.lang]}</p>
                <div className="health-clinic-card-bottom">
                  <span>
                    {copy("Ожидание по модели", "Модель бойынша күту")}
                    <b>
                      ~{centerWaitMin(center)} {copy("мин", "мин")}
                    </b>
                  </span>
                  <SmartIcon name="arrow" size={23} />
                </div>
              </Link>
            ))}
        </div>
        <p className="health-data-note">
          {copy(
            "Демонстрационная версия. Показатели центров — модельные; записи сохраняются в этом браузере.",
            "Демонстрациялық нұсқа. Орталық көрсеткіштері модельдік; жазылулар осы браузерде сақталады.",
          )}
        </p>
        <section className="health-project-footer">
          <div>
            <span className="health-brand-caption">SmartQ HEALTH</span>
            <p>{copy("Ваше время имеет значение.", "Сіздің уақытыңыз маңызды.")}</p>
          </div>
          <nav aria-label={copy("О SmartQ", "SmartQ туралы")}>
            <Link to="/project">{copy("О проекте", "Жоба туралы")}</Link>
            <Link to="/methodology">{copy("Научная основа", "Ғылыми негіз")}</Link>
            <Link to="/economics">{copy("Экономика", "Экономика")}</Link>
          </nav>
        </section>
      </Screen>
    </div>
  );
}
