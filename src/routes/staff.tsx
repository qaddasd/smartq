import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCheck, Clock3, DoorOpen, Stethoscope, Users } from "lucide-react";
import { Screen, Card, Button, DemoTag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { getCenter } from "@/lib/centers";
import { services } from "@/lib/visits";
export const Route = createFileRoute("/staff")({ component: Staff });
function Staff() {
  const { state, copy, advanceQueue, finishVisit, addDelay, stopDemo } = useStore();
  const ticket = state.ticket;
  const center = ticket ? getCenter(ticket.centerId) : null;
  const completed = state.visits.filter((v) => v.status === "completed").length;
  return (
    <Screen
      title={copy("Рабочее место", "Жұмыс орны")}
      subtitle={copy(
        "Управление очередью · демонстрационная панель сотрудника",
        "Кезекті басқару · қызметкердің демонстрациялық панелі",
      )}
      right={<DemoTag />}
    >
      <p className="demo-note mb-6">
        {copy(
          "Действия здесь обновляют ваш талон в этом браузере, в том числе в другой вкладке. Это демонстрация; доступа к данным клиник нет.",
          "Мұндағы әрекеттер осы браузердегі, соның ішінде басқа қойындыдағы талоныңызды жаңартады. Бұл демонстрация; клиника деректеріне қолжетімділік жоқ.",
        )}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="metric-card">
          <Users size={19} className="text-primary" />
          <strong>{ticket ? ticket.ahead + 1 : 0}</strong>
          <span>{copy("В демонстрационной очереди", "Демонстрациялық кезекте")}</span>
        </Card>
        <Card className="metric-card">
          <Clock3 size={19} className="text-primary" />
          <strong>
            {ticket?.waitMin ?? 0}
            <small className="ml-1 text-xs font-normal">{copy("мин", "мин")}</small>
          </strong>
          <span>{copy("Ожидание вашего талона", "Талоныңыздың күту уақыты")}</span>
        </Card>
        <Card className="metric-card">
          <CheckCheck size={19} className="text-primary" />
          <strong>{completed}</strong>
          <span>{copy("Посещений завершено", "Аяқталған қабылдаулар")}</span>
        </Card>
      </div>
      {ticket ? (
        <Card className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{center?.name[state.lang]}</p>
              <h2 className="mt-2 text-xl font-semibold">
                {copy("Кабинет", "Кабинет")} {ticket.room}
              </h2>
            </div>
            <span className="clinic-symbol">
              <Stethoscope size={21} />
            </span>
          </div>
          <div className="mt-6 border-y py-5 flex flex-wrap gap-6 items-center">
            <div className="text-4xl font-semibold">№{ticket.number}</div>
            <div>
              <p className="font-medium text-sm">
                {copy("Ваш демонстрационный талон", "Сіздің демонстрациялық талоныңыз")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {ticket.status === "now"
                  ? copy("На приёме", "Қабылдауда")
                  : copy(
                      `Перед пациентом: ${ticket.ahead} чел.`,
                      `Пациент алдында: ${ticket.ahead} адам`,
                    )}
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <Button
              disabled={ticket.status === "now"}
              onClick={() => {
                stopDemo();
                advanceQueue();
              }}
            >
              <DoorOpen size={17} />
              {ticket.ahead > 0
                ? copy("Следующий пациент", "Келесі пациент")
                : copy("Вызвать талон", "Талонды шақыру")}
            </Button>
            <Button
              variant="outline"
              disabled={ticket.status === "now"}
              onClick={() => {
                stopDemo();
                addDelay();
              }}
            >
              <Clock3 size={16} />
              {copy("Задержка +5 мин", "Кешігу +5 мин")}
            </Button>
            <Button variant="secondary" disabled={ticket.status !== "now"} onClick={finishVisit}>
              <CheckCheck size={17} />
              {copy("Завершить приём", "Қабылдауды аяқтау")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            {copy(
              "«Следующий пациент» уменьшает число людей впереди. Когда оно станет нулём, вызовите талон и завершите приём — посещение появится в истории.",
              "«Келесі пациент» алдыңыздағы адамдар санын азайтады. Ол нөлге жеткенде, талонды шақырып, қабылдауды аяқтаңыз — ол тарихта пайда болады.",
            )}
          </p>
          <Link to="/queue" className="muted-link mt-5">
            {copy("Посмотреть экран пациента", "Пациент экранын көру")}
            <ArrowRight size={15} />
          </Link>
        </Card>
      ) : (
        <Card className="empty-state">
          <Stethoscope size={40} />
          <h2>{copy("Нет активного талона", "Белсенді талон жоқ")}</h2>
          <p>
            {copy(
              "Получите талон на странице медицинского центра, затем вернитесь сюда для управления очередью.",
              "Медициналық орталық бетінде талон алыңыз, содан кейін кезекті басқару үшін осында оралыңыз.",
            )}
          </p>
          <Link to="/centers" className="hero-link !mt-0">
            {copy("Открыть центры", "Орталықтарды ашу")}
            <ArrowRight size={15} />
          </Link>
        </Card>
      )}
      <div className="section-heading">
        <h2>{copy("Запланированные посещения", "Жоспарланған қабылдаулар")}</h2>
        <Link to="/analytics">{copy("Аналитика", "Аналитика")} ↗</Link>
      </div>
      <Card>
        {state.visits.filter((v) => v.status === "booked").length === 0 ? (
          <p className="p-5 text-xs text-muted-foreground">
            {copy("Новых записей пока нет.", "Жаңа жазылулар әлі жоқ.")}
          </p>
        ) : (
          <div className="divide-y">
            {state.visits
              .filter((v) => v.status === "booked")
              .map((v) => (
                <div key={v.id} className="flex justify-between gap-4 p-5 text-xs">
                  <div>
                    <b>{services.find((s) => s.id === v.serviceId)?.[state.lang]}</b>
                    <p className="mt-1 text-muted-foreground">
                      {getCenter(v.centerId)?.name[state.lang]}
                    </p>
                  </div>
                  <span className="shrink-0">
                    {v.date} · {v.time}
                  </span>
                </div>
              ))}
          </div>
        )}
      </Card>
    </Screen>
  );
}
