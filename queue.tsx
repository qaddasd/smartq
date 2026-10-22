import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  DoorOpen,
  MapPin,
  Pause,
  Play,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { z } from "zod";
import { Screen, Card, Button, DemoTag } from "@/components/ui-kit";
import { StatusPill } from "@/components/TicketCard";
import { useStore } from "@/lib/store";
import { getCenter } from "@/lib/centers";
import { waitRange } from "@/lib/visits";
export const Route = createFileRoute("/queue")({
  validateSearch: z.object({ new: z.coerce.number().optional() }),
  head: () => ({ meta: [{ title: "Моя очередь — SmartQ" }] }),
  component: Queue,
});
function Queue() {
  const { state, copy, hydrated, startDemo, stopDemo, leaveQueue } = useStore();
  const [confirm, setConfirm] = useState(false);
  const ticket = hydrated ? state.ticket : null;
  if (!ticket)
    return (
      <Screen
        title={copy("Моя очередь", "Менің кезегім")}
        subtitle={copy("Ваш талон и статус приёма.", "Сіздің талоныңыз және қабылдау мәртебесі.")}
        right={<DemoTag />}
      >
        <Card className="empty-state">
          <TicketIcon size={45} />
          <h2>{copy("Сейчас вы не в очереди", "Қазір сіз кезекте емессіз")}</h2>
          <p>
            {copy(
              "Если вы уже в клинике, выберите центр или отсканируйте QR-код. Для будущего визита можно записаться по времени.",
              "Клиникада болсаңыз, орталықты таңдаңыз немесе QR кодын сканерлеңіз. Келесі қабылдауға уақыт бойынша жазылуға болады.",
            )}
          </p>
          <Link to="/centers" className="hero-link !mt-0">
            {copy("Выбрать центр", "Орталықты таңдау")}
            <ArrowRight size={16} />
          </Link>
          <div className="mt-4">
            <Link to="/book" className="text-xs text-primary">
              {copy("Записаться заранее", "Алдын ала жазылу")}
            </Link>
          </div>
        </Card>
      </Screen>
    );
  const center = getCenter(ticket.centerId)!;
  const isNow = ticket.status === "now";
  const range = waitRange(ticket.waitMin);
  const progress = isNow
    ? 100
    : Math.max(
        0,
        Math.min(90, Math.round((1 - ticket.ahead / Math.max(1, ticket.initialAhead ?? 3)) * 90)),
      );
  return (
    <Screen
      title={copy("Моя очередь", "Менің кезегім")}
      subtitle={center.name[state.lang]}
      right={<DemoTag />}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        <div>
          <Card className="overflow-hidden">
            <div className="bg-[#123b3d] text-white p-6 sm:p-8">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">
                  {copy("Электронный талон", "Электрондық талон")}
                </span>
                <StatusPill status={ticket.status} />
              </div>
              <div className="mt-7 flex items-end justify-between">
                <div>
                  <span className="text-white/50 text-xl mr-2">№</span>
                  <span className="text-6xl font-semibold tracking-tighter tabular">
                    {ticket.number}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">{copy("Кабинет", "Кабинет")}</p>
                  <p className="mt-1 text-3xl font-medium">{ticket.room}</p>
                </div>
              </div>
              <div className="mt-7 border-t border-white/15 pt-4 text-xs text-white/65 flex gap-2">
                <MapPin size={15} />
                {center.address[state.lang]}
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x">
              <div className="p-6">
                <p className="flex gap-2 items-center text-xs text-muted-foreground">
                  <Users size={15} />
                  {copy("Перед вами", "Сіздің алдыңызда")}
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {ticket.ahead}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {copy("чел.", "адам")}
                  </span>
                </p>
              </div>
              <div className="p-6">
                <p className="flex gap-2 items-center text-xs text-muted-foreground">
                  <Clock3 size={15} />
                  {copy("Ожидание", "Күту")}
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {isNow ? "0" : `${range[0]}–${range[1]}`}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {copy("мин", "мин")}
                  </span>
                </p>
              </div>
            </div>
            <div className="border-t p-6">
              <div className="flex justify-between text-xs mb-3">
                <span>
                  {isNow
                    ? copy("Вас приглашают на приём", "Сізді қабылдауға шақырады")
                    : copy("Очередь продвигается", "Кезек жылжып жатыр")}
                </span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">
                {copy("Обновлено", "Жаңартылды")}:{" "}
                {new Date(ticket.updatedAt ?? ticket.issuedAt).toLocaleTimeString(
                  state.lang === "kk" ? "kk-KZ" : "ru-RU",
                  { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Qyzylorda" },
                )}{" "}
                · {copy("Модельный прогноз", "Модельдік болжам")}
              </p>
            </div>
          </Card>
          {isNow && (
            <div
              className="mt-4 p-5 rounded-xl bg-primary-soft text-primary flex gap-3 items-center"
              role="status"
            >
              <DoorOpen size={24} />
              <div>
                <p className="font-semibold">
                  {copy(`Пройдите в кабинет ${ticket.room}`, `${ticket.room} кабинетке өтіңіз`)}
                </p>
                <p className="mt-1 text-xs">
                  {copy("Ваш номер вызван.", "Сіздің нөміріңіз шақырылды.")}
                </p>
              </div>
            </div>
          )}
          {(ticket.delayMin ?? 0) > 0 && !isNow && (
            <p className="demo-note mt-4">
              {copy(
                `Приём задерживается на ${ticket.delayMin} мин. Прогноз обновлён.`,
                `Қабылдау ${ticket.delayMin} минутқа кешігеді. Болжам жаңартылды.`,
              )}
            </p>
          )}
        </div>
        <aside>
          <Card className="p-6">
            <h2 className="font-semibold text-sm mb-3">{copy("Что дальше", "Келесі қадам")}</h2>
            <div className="journey">
              {[
                {
                  icon: Check,
                  title: copy("Вы в очереди", "Сіз кезектесіз"),
                  body: copy("Талон закреплён за вами", "Талон сізге бекітілді"),
                  active: true,
                },
                {
                  icon: Clock3,
                  title: copy("Следите за вызовом", "Шақыруды бақылаңыз"),
                  body: copy("Оставайтесь поблизости от кабинета", "Кабинетке жақын жерде болыңыз"),
                  active: !isNow,
                },
                {
                  icon: DoorOpen,
                  title: copy("Приём специалиста", "Маманның қабылдауы"),
                  body: copy(`Кабинет ${ticket.room}`, `${ticket.room} кабинет`),
                  active: isNow,
                },
              ].map(({ icon: Icon, title, body, active }) => (
                <div className={`journey-item ${active ? "active" : ""}`} key={title}>
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
          <Card className="mt-5 p-5">
            <h2 className="text-sm font-semibold">
              {copy("Проверить сценарий", "Сценарийді тексеру")}
            </h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {copy(
                "Симуляция продвигает очередь каждые несколько секунд. Действия сотрудника доступны в рабочем месте.",
                "Симуляция кезекті бірнеше секунд сайын жылжытады. Қызметкер әрекеттері жұмыс орнында қолжетімді.",
              )}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              disabled={isNow}
              onClick={state.demoRunning ? stopDemo : startDemo}
            >
              {state.demoRunning ? <Pause size={16} /> : <Play size={16} />}{" "}
              {state.demoRunning
                ? copy("Остановить", "Тоқтату")
                : copy("Запустить симуляцию", "Симуляцияны іске қосу")}
            </Button>
            <Link to="/staff" className="muted-link mt-4">
              {copy("Рабочее место сотрудника", "Қызметкердің жұмыс орны")}
              <ArrowRight size={15} />
            </Link>
          </Card>
          {!isNow && (
            <div className="mt-4">
              {confirm ? (
                <Card className="p-4">
                  <p className="text-xs mb-3">
                    {copy(
                      "Выйти из очереди? Текущая позиция будет потеряна.",
                      "Кезектен шығасыз ба? Ағымдағы орын жоғалады.",
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" onClick={leaveQueue}>
                      {copy("Выйти", "Шығу")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirm(false)}>
                      {copy("Остаться", "Қалу")}
                    </Button>
                  </div>
                </Card>
              ) : (
                <button
                  className="text-xs text-muted-foreground p-2"
                  onClick={() => setConfirm(true)}
                >
                  {copy("Выйти из очереди", "Кезектен шығу")}
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </Screen>
  );
}
