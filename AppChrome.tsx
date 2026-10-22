import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Home,
  ListOrdered,
  MapPin,
  QrCode,
  Stethoscope,
  User,
  WifiOff,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { BottomNav } from "./BottomNav";
export function AppChrome({ children }: { children: ReactNode }) {
  const { copy, state, setLang, unreadCount, storageError } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [offline, setOffline] = useState(false);
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
    { to: "/", icon: Home, label: copy("Обзор", "Шолу") },
    {
      to: "/appointments",
      icon: CalendarDays,
      label: copy("Мои посещения", "Менің қабылдауларым"),
    },
    { to: "/queue", icon: ListOrdered, label: copy("Моя очередь", "Менің кезегім") },
    {
      to: "/centers",
      icon: Building2,
      label: copy("Медицинские центры", "Медициналық орталықтар"),
    },
    { to: "/map", icon: MapPin, label: copy("Карта центров", "Орталықтар картасы") },
    { to: "/forecast", icon: Activity, label: copy("Прогноз нагрузки", "Жүктеме болжамы") },
    { to: "/profile", icon: User, label: copy("Мой профиль", "Менің профилім") },
  ] as const;
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {copy("К содержимому", "Мазмұнға өту")}
      </a>
      <aside className="app-sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            Q<span />
          </span>
          <span>
            Smart<span className="text-primary">Q</span>
            <small>HEALTH · AKTAU</small>
          </span>
        </Link>
        <div className="sidebar-label">{copy("МОЁ ПРОСТРАНСТВО", "МЕНІҢ КЕҢІСТІГІМ")}</div>
        <nav aria-label={copy("Основная навигация", "Негізгі навигация")} className="side-links">
          {items.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={`side-link ${pathname === to ? "is-active" : ""}`}>
              <Icon size={19} />
              <span>{label}</span>
              {to === "/queue" && state.ticket && <i />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-label mt-8">{copy("ДЛЯ КЛИНИКИ", "КЛИНИКАҒА")}</div>
        <nav className="side-links">
          <Link to="/staff" className={`side-link ${pathname === "/staff" ? "is-active" : ""}`}>
            <Stethoscope size={19} />
            {copy("Рабочее место", "Жұмыс орны")}
            <span className="tiny-badge">DEMO</span>
          </Link>
          <Link
            to="/analytics"
            className={`side-link ${pathname === "/analytics" ? "is-active" : ""}`}
          >
            <ChartNoAxesCombined size={19} />
            {copy("Аналитика", "Аналитика")}
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
          <Link to="/profile">
            {copy("О приложении", "Қолданба туралы")}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="topbar">
          <Link to="/" className="mobile-brand">
            Smart<span>Q</span>
          </Link>
          <span className="location-label">
            <MapPin size={16} />
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
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-dot" />}
            </Link>
            <Link to="/profile" className="avatar" aria-label={copy("Профиль", "Профиль")}>
              {state.displayName?.[0]?.toUpperCase() ?? <User size={19} />}
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
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
