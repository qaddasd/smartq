import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Screen, Card, Button, DemoTag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
export const Route = createFileRoute("/notifications")({ component: Notifications });
function Notifications() {
  const { state, copy, t, markAllRead, clearNotifications, unreadCount } = useStore();
  return (
    <Screen
      title={copy("Уведомления", "Хабарламалар")}
      subtitle={copy(
        "Записи, изменения очереди и приглашения на приём.",
        "Жазылулар, кезек өзгерістері және қабылдауға шақырулар.",
      )}
      right={<DemoTag />}
    >
      {!state.notifications.length ? (
        <Card className="empty-state">
          <Bell size={42} />
          <h2>{copy("Пока тихо", "Әзірге хабарлама жоқ")}</h2>
          <p>
            {copy(
              "Когда вы запишетесь на приём или получите талон, события появятся здесь.",
              "Қабылдауға жазылғанда немесе талон алғанда, оқиғалар осында пайда болады.",
            )}
          </p>
          <Link to="/book" className="text-primary text-sm">
            {copy("Записаться на приём", "Қабылдауға жазылу")}
          </Link>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap justify-between gap-2 mb-5">
            <Button size="sm" variant="secondary" disabled={!unreadCount} onClick={markAllRead}>
              <CheckCheck size={16} />
              {copy("Отметить прочитанными", "Оқылған деп белгілеу")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (
                  window.confirm(
                    copy("Очистить все уведомления?", "Барлық хабарламаларды өшіру керек пе?"),
                  )
                )
                  clearNotifications();
              }}
            >
              <Trash2 size={15} />
              {copy("Очистить", "Тазалау")}
            </Button>
          </div>
          <Card className="divide-y">
            {state.notifications.map((n) => (
              <article
                key={n.id}
                className={`flex gap-4 p-5 ${n.read ? "" : "bg-primary-soft/20"}`}
              >
                <span className="clinic-symbol shrink-0">
                  <Bell size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">
                    {n.title?.[state.lang] ?? t(n.titleKey, n.params)}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    {n.body?.[state.lang] ?? t(n.bodyKey, n.params)}
                  </p>
                  <time
                    className="block text-[10px] text-muted-foreground mt-3"
                    dateTime={new Date(n.time).toISOString()}
                  >
                    {new Date(n.time).toLocaleString(state.lang === "kk" ? "kk-KZ" : "ru-RU", {
                      timeZone: "Asia/Qyzylorda",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                {!n.read && (
                  <span
                    className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0"
                    aria-label={copy("Не прочитано", "Оқылмаған")}
                  />
                )}
              </article>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
