import { Link, useRouterState } from "@tanstack/react-router";
import { SmartIcon } from "./SmartIcons";
import { useStore } from "@/lib/store";
export function BottomNav() {
  const { copy, state } = useStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/scan") return null;
  const items = [
    { to: "/", label: copy("Главная", "Басты"), icon: "home" },
    { to: "/book", label: copy("Запись", "Жазылу"), icon: "booking" },
    { to: "/queue", label: copy("Очередь", "Кезек"), icon: "queue" },
    { to: "/profile", label: copy("Профиль", "Профиль"), icon: "profile" },
    { to: "/more", label: copy("Ещё", "Тағы"), icon: "more" },
  ] as const;
  return (
    <nav className="bottom-nav" aria-label={copy("Навигация", "Навигация")}>
      {items.map(({ to, label, icon }) => (
        <Link key={to} to={to} className={path === to ? "active" : ""}>
          <span className="relative">
            <SmartIcon name={icon} size={29} />
            {to === "/queue" && state.ticket && <i className="notification-dot" />}
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
