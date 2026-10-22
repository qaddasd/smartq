import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, Card, DemoTag } from "@/components/ui-kit";
import { QueueDerivation } from "@/components/QueueDerivation";
import { useStore } from "@/lib/store";
import { centers } from "@/lib/centers";
import { screeningMetrics, recommendRooms, forecastSlots } from "@/lib/queue-model";

export const Route = createFileRoute("/forecast")({
  head: () => ({ meta: [{ title: "SmartQ — нагрузка и ожидание" }] }),
  component: Forecast,
});
function Forecast() {
  const { copy, state } = useStore();
  const [id, setId] = useState("polyclinic-2");
  const center = centers.find((c) => c.id === id)!;
  const [rooms, setRooms] = useState(center.demo.rooms);
  const [flow, setFlow] = useState(center.demo.lambda);
  const [duration, setDuration] = useState(60 / center.demo.mu);
  const [threshold, setThreshold] = useState(5);
  const [targetWait, setTargetWait] = useState(10);
  const [targetRisk, setTargetRisk] = useState(10);
  const mu = 60 / duration;
  const model = screeningMetrics(flow, mu, rooms, threshold);
  const recommended = recommendRooms(flow, mu, threshold, targetWait, targetRisk / 100);
  const slots = center.demo.slots.map((lambda, i) => ({
    time: forecastSlots[i]!,
    lambda,
    result: screeningMetrics(lambda, mu, rooms, threshold),
  }));
  const best = slots
    .filter((s) => s.result.waitMin !== null)
    .sort((a, b) => a.result.waitMin! - b.result.waitMin!)[0];
  const f = (value: number | null, digits = 1) =>
    value === null || !Number.isFinite(value)
      ? "—"
      : new Intl.NumberFormat(state.lang === "kk" ? "kk-KZ" : "ru-RU", {
          maximumFractionDigits: digits,
        }).format(value);
  const slider = (
    label: string,
    value: number,
    set: (value: number) => void,
    min: number,
    max: number,
    unit: string,
  ) => (
    <label className="queue-slider">
      <span>
        {label}
        <b>
          {value} {unit}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => set(Number(event.target.value))}
      />
      <small>
        {min}–{max} {unit}
      </small>
    </label>
  );
  return (
    <Screen
      title={copy("Нагрузка и ожидание", "Жүктеме мен күту")}
      subtitle={copy(
        "Измените поток, время обследования и число ресурсов — показатели пересчитаются по формулам.",
        "Ағын, тексеру уақыты мен ресурс санын өзгертіңіз — көрсеткіштер формуламен қайта есептеледі.",
      )}
      right={<DemoTag />}
    >
      <div className="queue-model-banner">
        <div>
          <b>{copy("Расчётная модель клиники · M/M/c", "Клиниканың есептік моделі · M/M/c")}</b>
          <p>
            {copy(
              "Научный источник и границы применения каждой из трёх формул раскрыты отдельно.",
              "Үш формуланың ғылыми дереккөзі мен қолдану шекарасы бөлек берілген.",
            )}
          </p>
        </div>
        <Link to="/methodology">
          {copy("Почему именно эти формулы ↗", "Неліктен осы формулалар ↗")}
        </Link>
      </div>
      <div className="queue-lab-grid">
        <Card className="queue-parameters">
          <h2>{copy("Параметры одной услуги", "Бір қызмет параметрлері")}</h2>
          <label className="field">
            {copy("Центр · исходный сценарий", "Орталық · бастапқы сценарий")}
            <select
              value={id}
              onChange={(event) => {
                const selected = centers.find((c) => c.id === event.target.value)!;
                setId(selected.id);
                setRooms(selected.demo.rooms);
                setFlow(selected.demo.lambda);
                setDuration(60 / selected.demo.mu);
              }}
            >
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[state.lang]}
                </option>
              ))}
            </select>
          </label>
          {slider(copy("Поток λ", "Ағын λ"), flow, setFlow, 0, 80, copy("пац./ч", "пац./сағ"))}
          {slider(
            copy("Средняя длительность s", "Орташа ұзақтық s"),
            duration,
            setDuration,
            1,
            60,
            copy("мин", "мин"),
          )}
          <p className="econ-footnote">
            μ = 60/s = {f(mu, 2)} {copy("пац./ч на один ресурс", "пац./сағ бір ресурсқа")}
          </p>
          {slider(
            copy("Параллельных ресурсов c", "Параллель ресурстар c"),
            rooms,
            setRooms,
            1,
            8,
            copy("шт.", "дана"),
          )}
          {slider(
            copy("Порог очереди x", "Кезек шегі x"),
            threshold,
            setThreshold,
            0,
            30,
            copy("чел.", "адам"),
          )}
          <p className="econ-footnote">
            {copy(
              "Ресурс — доступные одновременно аппарат, кабинет и сотрудник одной услуги. Количество аппаратов в здании само по себе не равно c.",
              "Ресурс — бір қызметтің бір мезетте қолжетімді аппараты, кабинеті мен қызметкері. Ғимараттағы аппарат саны өздігінен c емес.",
            )}
          </p>
        </Card>
        <div>
          <div className="queue-results-grid">
            {[
              [copy("Спрос / мощность", "Сұраныс / қуат"), `${f(model.rho * 100)}%`, "ρ = λ/(cμ)"],
              [
                copy("Ожидание до обследования", "Тексеруге дейін күту"),
                `${f(model.waitMin)} ${copy("мин", "мин")}`,
                "Wq = Lq/λ · 60",
              ],
              [
                copy("Весь визит в этой очереди", "Осы кезектегі толық қабылдау"),
                `${f(model.totalMin)} ${copy("мин", "мин")}`,
                `W = Wq + ${f(model.serviceMin)}`,
              ],
              [
                copy(`Риск: больше ${threshold} ожидающих`, `Тәуекел: ${threshold}-тен көп күтуші`),
                `${f(model.overflowProbability === null ? null : model.overflowProbability * 100)}%`,
                "P(Q>x) = C·ρ^(x+1)",
              ],
            ].map(([label, value, formula]) => (
              <Card key={label} className="queue-result-card">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{formula}</small>
              </Card>
            ))}
          </div>
          {!model.stable && (
            <p role="status" className="queue-overload">
              {copy(
                "ρ ≥ 1: устойчивого режима нет. Стационарные среднее ожидание и риск не определены. Это не означает риск 100% в конкретную минуту. Добавьте ресурсы или уменьшите поток.",
                "ρ ≥ 1: тұрақты режим жоқ. Стационарлық орташа күту мен тәуекел анықталмайды. Бұл нақты минутта тәуекел 100% дегенді білдірмейді. Ресурс қосыңыз немесе ағынды азайтыңыз.",
              )}
            </p>
          )}
          <div className="queue-secondary-stats">
            <span>
              Lq = <b>{f(model.stable ? model.lq : null)}</b>{" "}
              {copy("ожидающих в среднем", "орташа күтуші")}
            </span>
            <span>
              {copy("Свободных ресурсов в среднем", "Орташа бос ресурс")}:{" "}
              <b>{f(model.idleRooms)}</b>
            </span>
          </div>
          <p className="econ-footnote">
            {copy(
              "Средняя доля/число свободных ресурсов — модель, не текущий статус кабинетов. Дробные значения допустимы для средних. Это одна очередь одной услуги; весь маршрут обследования может быть длиннее.",
              "Бос ресурстардың орташа саны — кабинет күйі емес, модель. Орташа мән бөлшек болуы мүмкін. Бұл бір қызметтің бір кезегі; толық тексеру жолы ұзағырақ болуы мүмкін.",
            )}
          </p>
          <section className="queue-capacity-plan">
            <h2>{copy("Сколько ресурсов нужно в сценарии", "Сценарийге қанша ресурс керек")}</h2>
            <p>
              {copy(
                "Выберите цели. Это настройки планирования, не нормативы из статьи.",
                "Мақсатты таңдаңыз. Бұл мақала нормативтері емес, жоспарлау баптаулары.",
              )}
            </p>
            {slider(
              copy("Ожидание не более", "Күту ең көбі"),
              targetWait,
              setTargetWait,
              1,
              60,
              copy("мин", "мин"),
            )}
            {slider(
              copy("Риск очереди выше x не более", "x-тен ұзын кезек тәуекелі ең көбі"),
              targetRisk,
              setTargetRisk,
              1,
              50,
              "%",
            )}
            <div className="queue-capacity-answer">
              {recommended === null
                ? copy(
                    "В пределах 32 ресурсов решение не найдено.",
                    "32 ресурс шегінде шешім табылмады.",
                  )
                : copy(
                    `Минимум ${recommended} параллельных ресурсов при этих допущениях.`,
                    `Осы жорамалдар бойынша кемінде ${recommended} параллель ресурс.`,
                  )}
            </div>
          </section>
        </div>
      </div>
      <QueueDerivation lambda={flow} mu={mu} rooms={rooms} threshold={threshold} />
      <section className="project-surface mt-6">
        <h2 className="text-lg font-medium">
          {copy("Сценарий потока по времени", "Уақыт бойынша ағын сценарийі")}
        </h2>
        <p className="econ-footnote">
          {copy(
            "Каждая строка — отдельный стационарный расчёт для заданного потока. Это не динамическая модель: накопленная очередь между строками не переносится.",
            "Әр жол — берілген ағынға жеке стационарлық есеп. Бұл динамикалық модель емес: жиналған кезек жолдар арасында тасымалданбайды.",
          )}
        </p>
        <div className="queue-day-table">
          {slots.map((slot) => (
            <div key={slot.time}>
              <b>{slot.time}</b>
              <span>λ = {slot.lambda}</span>
              <span>
                {f(slot.result.waitMin)} {copy("мин ожидания", "мин күту")}
              </span>
              <span>{f(slot.result.rho * 100)}%</span>
            </div>
          ))}
        </div>
        {best && (
          <p className="econ-footnote">
            {copy(
              `Минимальное расчётное ожидание среди этих строк: ${best.time}. Это пример, а не свободный слот для записи сегодня.`,
              `Осы жолдардағы ең аз есептік күту: ${best.time}. Бұл бүгін жазылуға бос уақыт емес, мысал.`,
            )}
          </p>
        )}
      </section>
    </Screen>
  );
}
