import { Link, useRouterState } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { BottomNav } from "./BottomNav";
import { BrandMark, SmartIcon } from "./SmartIcons";
export function AppChrome({ children }: { children: ReactNode }) {
  const { copy, state, setLang, unreadCount, storageError } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [offline, setOffline] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const content = contentRef.current;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!content?.animate || motionPreference.matches) return;
    // Animate route changes without remounting the outlet or resetting forms.
    const entrance = content.animate(
      [
        { opacity: 0.65, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 180, easing: "cubic-bezier(0.2, 0.65, 0.3, 1)" },
    );
    const stopForReducedMotion = () => {
      if (motionPreference.matches) entrance.cancel();
    };
    motionPreference.addEventListener("change", stopForReducedMotion);
    return () => {
      entrance.cancel();
      motionPreference.removeEventListener("change", stopForReducedMotion);
    };
  }, [pathname]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    void navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((value) => {
            const url = new URL(value, location.origin);
            return (
              url.origin === location.origin && /\.(js|css|woff2?|png|svg)(\?|$)/.test(url.pathname)
            );
          });
        reg.active?.postMessage({ type: "CACHE_UI", urls: [...urls, location.href] });
      })
      .catch(() => {});
  }, []);
  const items = [
    { to: "/", icon: "home", label: copy("Главная", "Басты") },
    {
      to: "/appointments",
      icon: "visits",
      label: copy("Мои посещения", "Менің қабылдауларым"),
    },
    { to: "/queue", icon: "queue", label: copy("Моя очередь", "Менің кезегім") },
    {
      to: "/centers",
      icon: "clinic",
      label: copy("Медицинские центры", "Медициналық орталықтар"),
    },
    { to: "/map", icon: "map", label: copy("Карта центров", "Орталықтар картасы") },
    { to: "/forecast", icon: "forecast", label: copy("Нагрузка и ожидание", "Жүктеме мен күту") },
    { to: "/profile", icon: "profile", label: copy("Мой профиль", "Менің профилім") },
  ] as const;
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {copy("К содержимому", "Мазмұнға өту")}
      </a>
      <aside className="app-sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <BrandMark size={36} />
          </span>
          <span>
            Smart<span className="text-primary">Q</span>
            <small>HEALTH · AKTAU</small>
          </span>
        </Link>
        <div className="sidebar-label">{copy("МОЁ ПРОСТРАНСТВО", "МЕНІҢ КЕҢІСТІГІМ")}</div>
        <nav aria-label={copy("Основная навигация", "Негізгі навигация")} className="side-links">
          {items.map(({ to, icon, label }) => (
            <Link key={to} to={to} className={`side-link ${pathname === to ? "is-active" : ""}`}>
              <SmartIcon name={icon} size={24} />
              <span>{label}</span>
              {to === "/queue" && state.ticket && <i />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-label mt-8">{copy("ДЛЯ КЛИНИКИ", "КЛИНИКАҒА")}</div>
        <nav className="side-links">
          <Link to="/staff" className={`side-link ${pathname === "/staff" ? "is-active" : ""}`}>
            <SmartIcon name="staff" size={24} />
            {copy("Рабочее место", "Жұмыс орны")}
            <span className="tiny-badge">DEMO</span>
          </Link>
          <Link
            to="/analytics"
            className={`side-link ${pathname === "/analytics" ? "is-active" : ""}`}
          >
            <SmartIcon name="forecast" size={24} />
            {copy("Аналитика", "Аналитика")}
          </Link>
        </nav>
        <div className="sidebar-label mt-6">{copy("ПРОЕКТ SMARTQ", "SMARTQ ЖОБАСЫ")}</div>
        <nav className="side-links" aria-label={copy("О проекте", "Жоба туралы")}>
          <Link
            to="/methodology"
            className={`side-link ${pathname === "/methodology" ? "is-active" : ""}`}
          >
            <SmartIcon name="science" size={24} />
            {copy("Научное обоснование", "Ғылыми негіздеме")}
          </Link>
          <Link to="/project" className={`side-link ${pathname === "/project" ? "is-active" : ""}`}>
            <SmartIcon name="shield" size={24} />
            {copy("О проекте", "Жоба туралы")}
          </Link>
          <Link
            to="/economics"
            className={`side-link ${pathname === "/economics" ? "is-active" : ""}`}
          >
            <SmartIcon name="economics" size={24} />
            {copy("Экономический эффект", "Экономикалық әсер")}
          </Link>
        </nav>
        <div className="sidebar-note">
          <span className="live-dot" />
          {copy("Демонстрационная версия", "Демонстрациялық нұсқа")}
          <p>
            {copy(
              "Записи и очередь сохраняются в этом браузере.",
              "Жазылулар мен кезек осы браузерде сақталады.",
            )}
          </p>
          <Link to="/project">
            {copy("Паспорт проекта", "Жоба паспорты")}
            <SmartIcon name="arrow" size={18} />
          </Link>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="topbar">
          <Link
            to="/profile"
            className="avatar topbar-avatar"
            aria-label={copy("Профиль", "Профиль")}
          >
            {state.displayName?.[0]?.toUpperCase() ?? <SmartIcon name="profile" size={24} />}
          </Link>
          <Link to="/" className="mobile-brand">
            <BrandMark size={28} />
            <span>
              Smart<span className="mobile-brand-q">Q</span>
            </span>
          </Link>
          <span className="location-label">
            <SmartIcon name="map" size={22} />
            {copy("Актау", "Ақтау")}
            <span className="location-caption">{copy("Медицина ближе", "Медицина жақын")}</span>
          </span>
          <div className="topbar-actions">
            <div className="language-control" aria-label={copy("Язык", "Тіл")}>
              <button onClick={() => setLang("ru")} aria-pressed={state.lang === "ru"}>
                RU
              </button>
              <button onClick={() => setLang("kk")} aria-pressed={state.lang === "kk"}>
                ҚАЗ
              </button>
            </div>
            <Link
              to="/notifications"
              className="icon-button"
              aria-label={copy(
                `Уведомления: ${unreadCount} непрочитанных`,
                `Хабарламалар: ${unreadCount} оқылмаған`,
              )}
            >
              <SmartIcon name="bell" size={27} />
              {unreadCount > 0 && <span className="notification-dot" />}
            </Link>
          </div>
        </header>
        {offline && (
          <div className="status-banner" role="status">
            <WifiOff size={16} />
            {copy(
              "Нет интернета. Сохранённые данные доступны; карта и внешние сервисы могут не работать.",
              "Интернет жоқ. Сақталған деректер қолжетімді; карта мен сыртқы сервистер жұмыс істемеуі мүмкін.",
            )}
          </div>
        )}
        {storageError && (
          <div className="status-banner" role="alert">
            {copy(
              "Браузер не разрешает сохранение. После закрытия данные могут потеряться.",
              "Браузер сақтауға рұқсат бермейді. Жапқаннан кейін деректер жоғалуы мүмкін.",
            )}
          </div>
        )}
        <div id="main-content" ref={contentRef} className="route-content" tabIndex={-1}>
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
