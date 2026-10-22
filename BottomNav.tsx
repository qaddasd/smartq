import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Home, ListOrdered, User } from "lucide-react";
import { useStore } from "@/lib/store";
export function BottomNav() {
  const { copy, state } = useStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/scan") return null;
  const items = [
    { to: "/", label: copy("Главная", "Басты"), icon: Home },
    { to: "/appointments", label: copy("Посещения", "Қабылдаулар"), icon: CalendarDays },
    { to: "/queue", label: copy("Очередь", "Кезек"), icon: ListOrdered },
    { to: "/profile", label: copy("Профиль", "Профиль"), icon: User },
  ] as const;
  return (
    <nav className="bottom-nav" aria-label={copy("Навигация", "Навигация")}>
      {items.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} className={path === to ? "active" : ""}>
          <span className="relative">
            <Icon size={21} />
            {to === "/queue" && state.ticket && <i className="notification-dot" />}
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
