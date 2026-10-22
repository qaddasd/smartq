import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, CalendarDays, CheckCheck, Clock3, Users } from "lucide-react";
import { Screen, Card, DemoTag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { centers, centerWaitMin, centerModel } from "@/lib/centers";
export const Route = createFileRoute("/analytics")({ component: Analytics });
function Analytics() {
  const { state, copy } = useStore();
  const total = centers.reduce((n, c) => n + c.demo.inQueue, 0);
  const avg = Math.round(centers.reduce((n, c) => n + centerWaitMin(c), 0) / centers.length);
  return (
    <Screen
      title={copy("Аналитика", "Аналитика")}
      subtitle={copy(
        "Демонстрационная загрузка центров и результаты вашей сессии.",
        "Орталықтардың демонстрациялық жүктемесі және сессияңыздың нәтижелері.",
      )}
      right={<DemoTag />}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: Users, value: total, label: copy("В очередях · модель", "Кезектерде · модель") },
          {
            icon: Clock3,
            value: `${avg} ${copy("мин", "мин")}`,
            label: copy("Среднее по центрам · модель", "Орталықтар бойынша орташа · модель"),
          },
          {
            icon: CalendarDays,
            value: state.visits.filter((v) => v.status === "booked").length,
            label: copy("Ваших активных записей", "Сіздің белсенді жазылуларыңыз"),
          },
          {
            icon: CheckCheck,
            value: state.visits.filter((v) => v.status === "completed").length,
            label: copy("Ваших завершённых посещений", "Сіздің аяқталған қабылдауларыңыз"),
          },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label} className="metric-card">
            <Icon size={20} className="text-primary" />
            <strong>{value}</strong>
            <span>{label}</span>
          </Card>
        ))}
      </div>
      <div className="section-heading">
        <h2>{copy("Обзор медицинских центров", "Медициналық орталықтарға шолу")}</h2>
        <Link to="/forecast">{copy("Открыть симулятор", "Симуляторды ашу")} ↗</Link>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-xs">
          <thead className="bg-secondary text-muted-foreground">
            <tr>
              {[
                copy("Медицинский центр", "Медициналық орталық"),
                copy("В очереди", "Кезекте"),
                copy("Ожидание", "Күту"),
                copy("Загрузка", "Жүктеме"),
              ].map((x) => (
                <th key={x} className="p-4 font-medium">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {centers.map((c) => (
              <tr key={c.id}>
                <td className="p-4 max-w-[300px]">
                  <Link
                    to="/center/$id"
                    params={{ id: c.id }}
                    className="font-medium hover:text-primary"
                  >
                    {c.name[state.lang]}
                  </Link>
                </td>
                <td className="p-4 tabular">{c.demo.inQueue}</td>
                <td className="p-4 whitespace-nowrap">
                  ~{centerWaitMin(c)} {copy("мин", "мин")}
                </td>
                <td className="p-4 min-w-[130px]">
                  <span className="tabular">{Math.round(centerModel(c).rho * 100)}%</span>
                  <div className="progress-track mt-2">
                    <span style={{ width: `${Math.min(100, centerModel(c).rho * 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="demo-note mt-5">
        {copy(
          "Очереди центров — исходные модельные данные. Ваши записи и завершённые посещения вычисляются из действий в этом браузере. Показатели не являются официальной статистикой.",
          "Орталықтардың кезектері — бастапқы модельдік деректер. Сіздің жазылуларыңыз бен аяқталған қабылдауларыңыз осы браузердегі әрекеттерден есептеледі. Көрсеткіштер ресми статистика емес.",
        )}
      </p>
    </Screen>
  );
}
