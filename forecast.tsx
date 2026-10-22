import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Clock3, SlidersHorizontal } from "lucide-react";
import { Screen, Card, DemoTag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { centers } from "@/lib/centers";
import { erlangC, forecastSlots } from "@/lib/queue-model";
export const Route = createFileRoute("/forecast")({ component: Forecast });
function Forecast() {
  const { copy, state } = useStore();
  const [id, setId] = useState("polyclinic-2");
  const center = centers.find((c) => c.id === id)!;
  const [rooms, setRooms] = useState(3);
  const [flow, setFlow] = useState(26);
  const mu = center.demo.mu;
  const model = erlangC(flow, mu, rooms);
  const slots = center.demo.slots.map((lambda, i) => ({
    time: forecastSlots[i]!,
    result: erlangC(lambda, mu, rooms),
  }));
  const best = slots
    .filter((s) => s.result.stable)
    .sort((a, b) => a.result.wqMin - b.result.wqMin)[0];
  return (
    <Screen
      title={copy("Прогноз нагрузки", "Жүктеме болжамы")}
      subtitle={copy(
        "Посмотрите, как число кабинетов влияет на ожидание.",
        "Кабинеттер саны күтуге қалай әсер ететінін қараңыз.",
      )}
      right={<DemoTag />}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(250px,1fr)_minmax(0,1.6fr)]">
        <Card className="p-6">
          <h2 className="flex gap-2 text-sm font-semibold mb-5">
            <SlidersHorizontal size={18} className="text-primary" />
            {copy("Параметры сценария", "Сценарий параметрлері")}
          </h2>
          <label className="field">
            {copy("Медицинский центр", "Медициналық орталық")}
            <select
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                const c = centers.find((c) => c.id === e.target.value)!;
                setRooms(c.demo.rooms);
                setFlow(c.demo.lambda);
              }}
            >
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[state.lang]}
                </option>
              ))}
            </select>
          </label>
          <label className="field mt-7">
            {copy("Открыто кабинетов", "Ашық кабинеттер")}: {rooms}
            <input
              type="range"
              min={1}
              max={8}
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value))}
              className="accent-primary"
            />
            <span className="field-help">1 — 8</span>
          </label>
          <label className="field mt-6">
            {copy("Пациентов в час", "Сағатына пациент")}: {flow}
            <input
              type="range"
              min={0}
              max={80}
              value={flow}
              onChange={(e) => setFlow(Number(e.target.value))}
              className="accent-primary"
            />
            <span className="field-help">
              {copy("Модельная скорость одного кабинета", "Бір кабинеттің модельдік жылдамдығы")}:{" "}
              {mu}/{copy("час", "сағ")}
            </span>
          </label>
          <p className="demo-note mt-6">
            {copy(
              "Симулятор Erlang C (M/M/c). Допущения: случайный поток, одинаковые кабинеты и обслуживание в порядке очереди.",
              "Erlang C (M/M/c) симуляторы. Болжамдар: кездейсоқ ағын, бірдей кабинеттер және кезек тәртібімен қызмет көрсету.",
            )}
          </p>
        </Card>
        <div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="metric-card">
              <Clock3 size={21} className="text-primary" />
              <strong>
                {model.stable ? `${Math.round(model.wqMin)}` : "—"}
                <small className="ml-1 text-xs font-normal">{copy("мин", "мин")}</small>
              </strong>
              <span>{copy("Среднее ожидание по модели", "Модель бойынша орташа күту")}</span>
            </Card>
            <Card className="metric-card">
              <Activity size={21} className="text-primary" />
              <strong>{Math.round(model.rho * 100)}%</strong>
              <span>{copy("Загрузка кабинетов", "Кабинеттер жүктемесі")}</span>
            </Card>
          </div>
          {!model.stable && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-danger-soft p-4 text-danger text-xs leading-relaxed"
            >
              {copy(
                "Поток превышает или равен пропускной способности. У модели нет устойчивого среднего ожидания. Увеличьте число кабинетов.",
                "Ағын өткізу қабілетінен жоғары немесе оған тең. Модельде тұрақты орташа күту жоқ. Кабинеттер санын көбейтіңіз.",
              )}
            </p>
          )}
          <Card className="mt-5 p-6">
            <h2 className="text-sm font-semibold">
              {copy("Нагрузка в течение дня", "Күн ішіндегі жүктеме")}
            </h2>
            <p className="text-xs text-muted-foreground mt-2">
              {copy(
                "Почасовой сценарий центра при выбранном числе кабинетов",
                "Таңдалған кабинеттер саны бойынша орталықтың сағаттық сценарийі",
              )}
            </p>
            <div className="space-y-4 mt-6">
              {slots.map((s) => (
                <div key={s.time} className="grid grid-cols-[42px_1fr_60px] gap-3 items-center">
                  <span className="text-xs tabular">{s.time}</span>
                  <div className="progress-track !h-6 !rounded-md">
                    <span
                      className="!rounded-md"
                      style={{
                        width: `${s.result.stable ? Math.max(3, Math.min(100, (s.result.wqMin / 60) * 100)) : 100}%`,
                        background: s.result.stable ? "#7bbfa9" : "#dba386",
                      }}
                    />
                  </div>
                  <span className="text-xs tabular text-right text-muted-foreground">
                    {s.result.stable
                      ? `${Math.round(s.result.wqMin)} ${copy("мин", "мин")}`
                      : "ρ ≥ 1"}
                  </span>
                </div>
              ))}
            </div>
            {best && (
              <p className="text-xs text-primary mt-6 leading-relaxed">
                {copy(
                  `В этом сценарии наименьшая нагрузка — в ${best.time}.`,
                  `Бұл сценарийде ең төмен жүктеме — ${best.time}.`,
                )}
              </p>
            )}
          </Card>
          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
            {copy(
              "Это расчёт по демонстрационным параметрам, а не прогноз фактического времени вашего приёма.",
              "Бұл нақты қабылдау уақытының болжамы емес, демонстрациялық параметрлер бойынша есеп.",
            )}
          </p>
        </div>
      </div>
    </Screen>
  );
}
