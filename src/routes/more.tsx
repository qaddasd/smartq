import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/ui-kit";
import { SmartIcon } from "@/components/SmartIcons";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/more")({
  head: () => ({ meta: [{ title: "SmartQ — все разделы" }] }),
  component: More,
});
function More() {
  const { copy } = useStore();
  const groups = [
    {
      title: copy("Для вашего здоровья", "Сіздің денсаулығыңыз үшін"),
      items: [
        { to: "/book", icon: "booking", label: copy("Запись на приём", "Қабылдауға жазылу") },
        {
          to: "/appointments",
          icon: "visits",
          label: copy("Мои посещения", "Менің қабылдауларым"),
        },
        { to: "/queue", icon: "queue", label: copy("Моя очередь", "Менің кезегім") },
        { to: "/scan", icon: "scan", label: copy("QR-регистрация", "QR тіркеу") },
        {
          to: "/centers",
          icon: "clinic",
          label: copy("Медицинские центры", "Медициналық орталықтар"),
        },
        { to: "/map", icon: "map", label: copy("Карта центров", "Орталықтар картасы") },
        { to: "/notifications", icon: "bell", label: copy("Уведомления", "Хабарламалар") },
        { to: "/profile", icon: "profile", label: copy("Мой профиль", "Менің профилім") },
      ],
    },
    {
      title: copy("О системе SmartQ", "SmartQ жүйесі туралы"),
      items: [
        {
          to: "/forecast",
          icon: "forecast",
          label: copy("Нагрузка и ожидание", "Жүктеме мен күту"),
        },
        {
          to: "/methodology",
          icon: "science",
          label: copy("Научное обоснование", "Ғылыми негіздеме"),
        },
        { to: "/project", icon: "shield", label: copy("О проекте", "Жоба туралы") },
        {
          to: "/economics",
          icon: "economics",
          label: copy("Экономический эффект", "Экономикалық әсер"),
        },
        {
          to: "/analytics",
          icon: "forecast",
          label: copy("Аналитика центров", "Орталықтар аналитикасы"),
        },
        {
          to: "/staff",
          icon: "staff",
          label: copy("Рабочее место сотрудника", "Қызметкердің жұмыс орны"),
        },
      ],
    },
  ] as const;
  return (
    <Screen
      title={copy("Все разделы", "Барлық бөлімдер")}
      subtitle={copy(
        "Всё, что нужно для вашего визита, в одном месте.",
        "Қабылдауға қажет нәрсенің бәрі бір жерде.",
      )}
    >
      {groups.map((group) => (
        <section key={group.title} className="health-more-section">
          <h2>{group.title}</h2>
          <div className="health-more-grid">
            {group.items.map((item) => (
              <Link to={item.to} key={item.to}>
                <SmartIcon name={item.icon} size={34} />
                <span>{item.label}</span>
                <SmartIcon name="arrow" size={21} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Screen>
  );
}
