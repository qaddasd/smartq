import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Calculator, RotateCcw, Download, Info, SlidersHorizontal } from "lucide-react";
import { Screen } from "@/components/ui-kit";
import { ProjectNav } from "@/components/ProjectNav";
import { useStore } from "@/lib/store";
import { calculateEconomics, defaultEconomicInputs, type EconomicInputs } from "@/lib/economics";

export const Route = createFileRoute("/economics")({
  head: () => ({ meta: [{ title: "SmartQ — экономика проекта" }] }),
  component: EconomicsPage,
});

function EconomicsPage() {
  const { copy, state } = useStore();
  const [inputs, setInputs] = useState<Record<keyof EconomicInputs, string>>(
    () =>
      Object.fromEntries(
        Object.entries(defaultEconomicInputs).map(([key, value]) => [key, String(value)]),
      ) as Record<keyof EconomicInputs, string>,
  );
  const [scenario, setScenario] = useState("base");
  const values = Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [key, Number(value)]),
  ) as unknown as EconomicInputs;
  const valid =
    Object.values(inputs).every((value) => value.trim() !== "") &&
    Object.values(values).every((value) => Number.isFinite(value) && value >= 0) &&
    [values.centers, values.slotsPerDay, values.workingDays, values.messagesPerVisit].every(
      Number.isInteger,
    ) &&
    values.centers >= 1 &&
    values.workingDays >= 1 &&
    values.workingDays <= 31 &&
    values.noShowBefore <= 100 &&
    values.noShowAfter <= values.noShowBefore &&
    values.refillRate <= 100;
  const result = valid ? calculateEconomics(values) : null;
  const nf = (value: number, decimals = 0) =>
    new Intl.NumberFormat(state.lang === "kk" ? "kk-KZ" : "ru-RU", {
      maximumFractionDigits: decimals,
    }).format(value);
  const money = (value: number) => `${nf(value)} ₸`;
  function update(key: keyof EconomicInputs, value: string) {
    setScenario("custom");
    setInputs((previous) => ({ ...previous, [key]: value }));
  }
  function preset(id: string) {
    const after = id === "careful" ? 14 : id === "ambitious" ? 6 : 10;
    const refill = id === "careful" ? 40 : id === "ambitious" ? 85 : 65;
    setInputs((previous) => ({
      ...previous,
      noShowBefore: "18",
      noShowAfter: String(after),
      refillRate: String(refill),
    }));
    setScenario(id);
  }
  function field(
    key: keyof EconomicInputs,
    ru: string,
    kk: string,
    unit: string,
    max?: number,
    step = 1,
  ) {
    return (
      <label className="econ-field" key={key}>
        <span>{copy(ru, kk)}</span>
        <span className="econ-input-wrap">
          <input
            type="number"
            min={0}
            max={max}
            step={step}
            value={inputs[key]}
            onChange={(event) => update(key, event.target.value)}
          />
          <small>{unit}</small>
        </span>
      </label>
    );
  }
  function download() {
    if (!result) return;
    const report = {
      model: "SmartQ — illustrative monthly resource model / Демонстрационная модель",
      note: "Resource values are not cash savings or proven clinical outcomes. All inputs are assumptions.",
      units: "KZT, minutes, hours, visits; monthly unless specified",
      inputs: values,
      results: result,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "smartq-economic-scenario.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Screen
      title={copy("Экономика SmartQ", "SmartQ экономикасы")}
      subtitle={copy(
        "Сколько ресурсов может вернуть более точная запись на скрининг.",
        "Скринингке дәлірек жазылу қанша ресурсты қайтаруы мүмкін.",
      )}
      right={
        <span className="project-label">{copy("МОДЕЛЬ · НЕ ОТЧЁТ", "МОДЕЛЬ · ЕСЕП ЕМЕС")}</span>
      }
    >
      <ProjectNav />
      <p className="queue-economics-note">
        {copy(
          "Формулы очередей и источник исследования вынесены в научное обоснование. Денежные расчёты ниже — отдельная балансовая модель: её исходные цены, неявки и эффект напоминаний являются допущениями, не данными статьи.",
          "Кезек формулалары мен зерттеу дереккөзі ғылыми негіздемеде берілген. Төмендегі ақша есебі — бөлек баланс моделі: баға, келмеу мен еске салу әсері мақала деректері емес, жорамалдар.",
        )}
      </p>
      <section className="econ-intro">
        <div>
          <span className="project-kicker">
            <Calculator size={16} /> {copy("ОТ ОЧЕРЕДИ К ЭФФЕКТИВНОСТИ", "КЕЗЕКТЕН ТИІМДІЛІККЕ")}
          </span>
          <h2>
            {copy(
              "Меньше пустых слотов.\nБольше завершённых обследований.",
              "Бос уақыт азаяды.\nАяқталған тексерулер көбейеді.",
            )}
          </h2>
          <p>
            {copy(
              "Неявка оставляет кабинет и время специалиста незанятыми. Напоминание и своевременный перенос дают возможность принять другого пациента в тот же рабочий день.",
              "Келмей қалу кабинет пен маман уақытын бос қалдырады. Еске салу мен уақытылы ауыстыру сол жұмыс күні басқа пациентті қабылдауға мүмкіндік береді.",
            )}
          </p>
        </div>
        <div className="econ-intro-note">
          <Info size={23} />
          <b>{copy("Что именно считаем", "Нені есептейміз")}</b>
          <p>
            {copy(
              "Стоимость восстановленной мощности и времени регистратуры. Это оценка ресурсов: она не означает, что расходы клиники автоматически уменьшатся.",
              "Қалпына келген қуат пен тіркеу бөлімі уақытының құны. Бұл ресурс бағасы: клиника шығындары автоматты түрде азаяды дегенді білдірмейді.",
            )}
          </p>
        </div>
      </section>
      <div className="econ-section-head">
        <div>
          <span className="project-kicker">01 / {copy("РАСЧЁТ", "ЕСЕПТЕУ")}</span>
          <h2>{copy("Сценарий для вашей сети", "Сіздің желіңізге арналған сценарий")}</h2>
        </div>
        <button
          className="project-text-button"
          onClick={() => {
            setInputs(
              Object.fromEntries(
                Object.entries(defaultEconomicInputs).map(([key, value]) => [key, String(value)]),
              ) as Record<keyof EconomicInputs, string>,
            );
            setScenario("base");
          }}
        >
          <RotateCcw size={15} />
          {copy("Сбросить", "Қалпына келтіру")}
        </button>
      </div>
      <p className="econ-caption">
        {copy(
          "Все исходные значения — учебные допущения. Меняйте их, чтобы проверить чувствительность модели. Сценарии меняют только долю неявок и возврат слотов.",
          "Барлық бастапқы мәндер — оқу жорамалдары. Модель сезімталдығын тексеру үшін оларды өзгертіңіз. Сценарийлер тек келмеу үлесі мен уақытты толтыруды өзгертеді.",
        )}
      </p>
      <div className="econ-scenarios" aria-label={copy("Сценарий расчёта", "Есептеу сценарийі")}>
        {[
          ["careful", copy("Осторожный", "Сақ")],
          ["base", copy("Базовый", "Негізгі")],
          ["ambitious", copy("Целевой", "Мақсатты")],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={scenario === id} onClick={() => preset(id!)}>
            {label}
          </button>
        ))}
        {scenario === "custom" && <span>{copy("Ваши значения", "Сіздің мәндеріңіз")}</span>}
      </div>
      <div className="econ-calculator">
        <section
          className="econ-controls"
          aria-label={copy("Параметры расчёта", "Есептеу параметрлері")}
        >
          <h3>
            <SlidersHorizontal size={17} />
            {copy("Исходные данные", "Бастапқы деректер")}
          </h3>
          <div className="econ-fields">
            {field("centers", "Учреждений в сети", "Желідегі мекемелер", copy("шт.", "дана"))}
            {field(
              "slotsPerDay",
              "Записей в день / центр",
              "Күніне жазылу / орталық",
              copy("зап.", "жаз."),
            )}
            {field(
              "workingDays",
              "Рабочих дней в месяц",
              "Айдағы жұмыс күндері",
              copy("дн.", "күн"),
              31,
            )}
            {field("noShowBefore", "Неявки до SmartQ", "SmartQ дейін келмеу", "%", 100)}
            {field(
              "noShowAfter",
              "Неявки после напоминаний",
              "Еске салудан кейін келмеу",
              "%",
              100,
            )}
            {field(
              "refillRate",
              "Вернутся в реальные визиты¹",
              "Нақты қабылдауға айналады¹",
              "%",
              100,
            )}
          </div>
          <p className="econ-footnote">
            {copy(
              "¹ Доля предотвращённых неявок, которая действительно превратится в завершённые визиты; остальные слоты считаем потерянными.",
              "¹ Алдын алынған келмеулердің аяқталған қабылдауға айналған үлесі; қалған уақыт жоғалған болып есептеледі.",
            )}
          </p>
          <details className="econ-details">
            <summary>{copy("Стоимость, время и бюджет", "Құн, уақыт және бюджет")}</summary>
            <div className="econ-fields">
              {field("slotMinutes", "Длительность приёма", "Қабылдау ұзақтығы", copy("мин", "мин"))}
              {field("slotValue", "Ресурсная стоимость слота²", "Уақыттың ресурстық құны²", "₸")}
              {field(
                "adminMinutes",
                "Экономия регистратуры / запись²",
                "Тіркеу уақыты / жазылу²",
                copy("мин", "мин"),
                undefined,
                0.1,
              )}
              {field(
                "staffHourlyCost",
                "Стоимость часа регистратуры",
                "Тіркеу сағатының құны",
                "₸",
              )}
              {field("subscription", "Подписка / центр / месяц", "Жазылым / орталық / ай", "₸")}
              {field(
                "messagesPerVisit",
                "Сообщений на запись",
                "Бір жазылуға хабарлама",
                copy("шт.", "дана"),
              )}
              {field(
                "messageCost",
                "Цена одного сообщения",
                "Бір хабарлама бағасы",
                "₸",
                undefined,
                0.1,
              )}
              {field("monthlySupport", "Прочие расходы / месяц", "Өзге шығын / ай", "₸")}
              {field("setupCost", "Разовое внедрение", "Бір реттік енгізу", "₸")}
            </div>
            <p className="econ-footnote">
              {copy(
                "² Стоимость слота включает только клинические ресурсы, без регистратуры. Её время оценивается отдельно, чтобы не учитывать один ресурс дважды. Подписка и цены — примеры, не коммерческое предложение.",
                "² Уақыт құны тек клиникалық ресурстарды қамтиды, тіркеу бөлімі кірмейді. Қосарлап есептемеу үшін оның уақыты бөлек бағаланады. Бағалар — мысал, коммерциялық ұсыныс емес.",
              )}
            </p>
          </details>
        </section>
        <section
          className="econ-results"
          aria-label={copy("Результаты расчёта", "Есептеу нәтижелері")}
        >
          {!result ? (
            <div className="econ-validation" role="alert">
              {copy(
                "Заполните поля неотрицательными числами. Учреждений — от 1, рабочих дней — от 1 до 31. Количество записей и сообщений — целое число. Проценты — от 0 до 100; неявки после не могут превышать исходный уровень.",
                "Өрістерді теріс емес сандармен толтырыңыз. Мекемелер — 1-ден, жұмыс күндері — 1–31. Жазылулар мен хабарламалар — бүтін сан. Пайыз — 0–100; кейінгі келмеу бастапқыдан аспауы тиіс.",
              )}
            </div>
          ) : (
            <>
              <div className="econ-result-top">
                <span>{copy("ПОТЕНЦИАЛ ЗА МЕСЯЦ", "АЙЛЫҚ ӘЛЕУЕТ")}</span>
                <span>{copy("По вашим допущениям", "Сіздің жорамалдарыңыз бойынша")}</span>
              </div>
              <div className="econ-big-result">
                <strong>+{nf(result.recoveredVisits)}</strong>
                <h3>{copy("дополнительных обследований", "қосымша тексеру")}</h3>
                <p>
                  {nf(result.bookings)}{" "}
                  {copy("записей в месяц в выбранной сети", "таңдалған желідегі айлық жазылу")}
                </p>
              </div>
              <div className="econ-mini-metrics">
                <div>
                  <strong>
                    {nf(result.clinicalHours, 1)} {copy("ч", "сағ")}
                  </strong>
                  <span>{copy("времени кабинетов возвращено", "кабинет уақыты қайтарылды")}</span>
                </div>
                <div>
                  <strong>
                    {nf(result.adminHours, 1)} {copy("ч", "сағ")}
                  </strong>
                  <span>
                    {copy("времени регистратуры сохранено", "тіркеу бөлімі уақыты үнемделді")}
                  </span>
                </div>
              </div>
              <div className="econ-money-lines">
                <div>
                  <span>{copy("Ресурсная ценность визитов", "Қабылдаулардың ресурс құны")}</span>
                  <b>{money(result.capacityValue)}</b>
                </div>
                <div>
                  <span>{copy("Оценка времени регистратуры", "Тіркеу уақытының бағасы")}</span>
                  <b>{money(result.adminValue)}</b>
                </div>
                <div>
                  <span>{copy("Расходы на систему / месяц", "Жүйе шығыны / ай")}</span>
                  <b>−{money(result.monthlyCost)}</b>
                </div>
                <div className="econ-total">
                  <span>{copy("Баланс ресурсной модели", "Ресурс моделінің балансы")}</span>
                  <b>{money(result.resourceBalance)}</b>
                </div>
              </div>
              <p className="econ-footnote">
                {copy(
                  "Положительный баланс означает, что оценка ресурсов превышает расходы. Для денежной окупаемости нужны подтверждённые доходы или реально сокращённые затраты. Дробные визиты — математическое ожидание; на экране округлены.",
                  "Оң баланс ресурстар бағасы шығыннан жоғары екенін білдіреді. Ақшалай өтелу үшін расталған кіріс немесе нақты қысқарған шығын керек. Бөлшек қабылдау — математикалық күту; экранда дөңгелектелген.",
                )}
              </p>
              <button className="project-outline-button" onClick={download}>
                <Download size={16} />
                {copy("Скачать расчёт и допущения", "Есеп пен жорамалдарды жүктеу")}
              </button>
            </>
          )}
        </section>
      </div>
      {result && (
        <>
          <div className="econ-section-head">
            <div>
              <span className="project-kicker">02 / {copy("ДО И ПОСЛЕ", "ДЕЙІН ЖӘНЕ КЕЙІН")}</span>
              <h2>
                {copy("Как меняется использование слотов", "Уақытты пайдалану қалай өзгереді")}
              </h2>
            </div>
          </div>
          <section className="econ-comparison">
            {[
              {
                title: copy("Без SmartQ", "SmartQ жоқ"),
                attended: result.attendedBefore,
                missed: result.missedBefore,
              },
              {
                title: copy("Со SmartQ · сценарий", "SmartQ бар · сценарий"),
                attended: result.attendedAfter,
                missed: result.unfilledAfter,
              },
            ].map((row) => (
              <div key={row.title}>
                <div className="econ-bar-label">
                  <b>{row.title}</b>
                  <span>
                    {nf(row.attended)} / {nf(result.bookings)}
                  </span>
                </div>
                <div
                  className="econ-stacked-bar"
                  role="img"
                  aria-label={`${row.title}: ${nf(row.attended)} ${copy("визитов", "қабылдау")}, ${nf(row.missed)} ${copy("пустых слотов", "бос уақыт")}`}
                >
                  <span
                    style={{
                      width: `${result.bookings ? (row.attended / result.bookings) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p>
                  {nf(row.missed)} {copy("незаполненных слотов", "толтырылмаған уақыт")}
                </p>
              </div>
            ))}
            <div className="econ-chart-legend">
              <span>
                <i />
                {copy("Завершённые визиты", "Аяқталған қабылдаулар")}
              </span>
              <span>
                <i />
                {copy("Потерянная мощность", "Жоғалған қуат")}
              </span>
            </div>
          </section>
          <div className="econ-section-head">
            <div>
              <span className="project-kicker">03 / {copy("БЮДЖЕТ", "БЮДЖЕТ")}</span>
              <h2>{copy("Что оплачивает учреждение", "Мекеме не үшін төлейді")}</h2>
            </div>
          </div>
          <section className="econ-budget-grid">
            <div className="project-surface">
              <h3>{copy("Ежемесячные расходы", "Ай сайынғы шығындар")}</h3>
              <dl className="econ-budget-list">
                <div>
                  <dt>{copy("Подписка для сети", "Желі жазылымы")}</dt>
                  <dd>{money(result.subscriptionCost)}</dd>
                </div>
                <div>
                  <dt>{copy("Отправка напоминаний", "Еске салу жіберу")}</dt>
                  <dd>{money(result.messagingCost)}</dd>
                </div>
                <div>
                  <dt>{copy("Прочие расходы", "Өзге шығындар")}</dt>
                  <dd>{money(values.monthlySupport)}</dd>
                </div>
                <div>
                  <dt>{copy("Всего в месяц", "Айлық жиыны")}</dt>
                  <dd>{money(result.monthlyCost)}</dd>
                </div>
              </dl>
            </div>
            <div className="project-surface">
              <h3>{copy("Стоимость пилота и масштаба", "Пилот пен кеңейту құны")}</h3>
              <dl className="econ-budget-list">
                <div>
                  <dt>{copy("Разовое внедрение", "Бір реттік енгізу")}</dt>
                  <dd>{money(values.setupCost)}</dd>
                </div>
                <div>
                  <dt>{copy("Первый год с внедрением", "Енгізумен бірге бірінші жыл")}</dt>
                  <dd>{money(result.firstYearCost)}</dd>
                </div>
                <div>
                  <dt>{copy("Расходы / дополнительный визит³", "Шығын / қосымша қабылдау³")}</dt>
                  <dd>
                    {result.costPerRecoveredVisit === null
                      ? "—"
                      : money(result.costPerRecoveredVisit)}
                  </dd>
                </div>
              </dl>
              <p className="econ-footnote">
                {copy(
                  "³ Только текущие расходы системы; внедрение не включено. Это не себестоимость медицинской услуги.",
                  "³ Тек жүйенің ағымдағы шығыны; енгізу кірмейді. Бұл медициналық қызметтің өзіндік құны емес.",
                )}
              </p>
            </div>
          </section>
        </>
      )}
      <details className="econ-methodology">
        <summary>
          {copy("Открыть формулы и границы модели", "Формулалар мен модель шекарасын ашу")}
        </summary>
        <ol>
          <li>
            {copy(
              "Записи = центры × записи в день × рабочие дни.",
              "Жазылулар = орталықтар × күндік жазылулар × жұмыс күндері.",
            )}
          </li>
          <li>
            {copy(
              "Возвращённые визиты = записи × (неявки до − неявки после) / 100 × доля возврата / 100.",
              "Қайтарылған қабылдаулар = жазылулар × (дейінгі − кейінгі келмеу) / 100 × қайтару үлесі / 100.",
            )}
          </li>
          <li>
            {copy(
              "Ресурсный эффект = возвращённые визиты × стоимость слота + записи × сэкономленные минуты регистратуры / 60 × стоимость её часа.",
              "Ресурстық әсер = қайтарылған қабылдау × уақыт құны + жазылулар × үнемделген тіркеу минуты / 60 × сағат құны.",
            )}
          </li>
          <li>
            {copy(
              "Расходы = центры × подписка + записи × сообщения на запись × цена сообщения + прочие расходы. Баланс = ресурсный эффект − расходы.",
              "Шығын = орталықтар × жазылым + жазылулар × хабарлама саны × хабарлама бағасы + өзге шығын. Баланс = ресурстық әсер − шығын.",
            )}
          </li>
        </ol>
        <p>
          {copy(
            "Модель не оценивает диагнозы, выживаемость, предотвращённые случаи рака, доход по тарифам или экономию лечения. Не учитывает сезонность, налоги и дисконтирование. Фактические расходы на интеграцию, защиту данных, обучение и связь нужно уточнить с учреждением и провайдерами. Перед пилотом заменить все допущения замерами и сметой.",
            "Модель диагнозды, өмір сүруді, алдын алынған қатерлі ісікті, тарифтік кірісті немесе емдеу үнемін бағаламайды. Маусымдылық, салық пен дисконттау ескерілмейді. Интеграция, дерек қорғау, оқыту мен байланыс шығынын мекеме және провайдерлермен нақтылау қажет. Пилот алдында жорамалдарды өлшемдер мен сметаға ауыстыру керек.",
          )}
        </p>
      </details>
      <section className="econ-bottom-link">
        <div>
          <b>
            {copy("Как доказать эффект на практике?", "Әсерді іс жүзінде қалай дәлелдеуге болады?")}
          </b>
          <p>
            {copy(
              "План пилота, метрики и модель финансирования — в паспорте проекта.",
              "Пилот жоспары, өлшемдер мен қаржыландыру моделі — жоба паспортында.",
            )}
          </p>
        </div>
        <Link to="/project">
          {copy("О проекте", "Жоба туралы")}
          <ArrowRight size={17} />
        </Link>
      </section>
    </Screen>
  );
}
