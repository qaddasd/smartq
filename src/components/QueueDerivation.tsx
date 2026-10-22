import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { screeningMetrics } from "@/lib/queue-model";

export function QueueDerivation({
  lambda,
  mu,
  rooms,
  threshold = 5,
}: {
  lambda: number;
  mu: number;
  rooms: number;
  threshold?: number;
}) {
  const { copy, state } = useStore();
  const result = screeningMetrics(lambda, mu, rooms, threshold);
  const f = (value: number | null, digits = 2) =>
    value === null || !Number.isFinite(value)
      ? "—"
      : new Intl.NumberFormat(state.lang === "kk" ? "kk-KZ" : "ru-RU", {
          maximumFractionDigits: digits,
        }).format(value);
  return (
    <section className="queue-derivation">
      <div className="queue-derivation-heading">
        <div>
          <span className="project-kicker">
            {copy("ПРОВЕРЯЕМЫЙ РАСЧЁТ · M/M/c", "ТЕКСЕРІЛЕТІН ЕСЕП · M/M/c")}
          </span>
          <h2>{copy("Откуда берутся эти значения", "Бұл мәндер қалай есептеледі")}</h2>
        </div>
        <Link to="/methodology">{copy("Научное обоснование ↗", "Ғылыми негіздеме ↗")}</Link>
      </div>
      <p className="queue-input-summary">
        λ = {f(lambda)} {copy("пац./ч", "пац./сағ")}; μ = {f(mu)}{" "}
        {copy("пац./ч на ресурс", "пац./сағ бір ресурсқа")}; c = {rooms}; x = {threshold}.{" "}
        {copy(
          "Это сценарий, а не измерения клиники. Подстановки и результаты округлены; вычисления используют полную точность чисел.",
          "Бұл клиника өлшемдері емес, сценарий. Қою мәндері мен нәтижелер дөңгелектелген; есептеулер санның толық дәлдігін қолданады.",
        )}
      </p>
      <div className="queue-formula-grid">
        <article>
          <span className="queue-formula-number">01 / {copy("ЗАГРУЗКА", "ЖҮКТЕМЕ")}</span>
          <div className="queue-equation">ρ = λ / (c · μ)</div>
          <p className="queue-substitution">
            {f(lambda)} / ({rooms} · {f(mu)}) ≈ <b>{f(result.rho * 100, 1)}%</b>
          </p>
          <p>
            {copy(
              "При ρ < 1 возможен устойчивый режим. При ρ ≥ 1 спрос достигает мощности или превышает её. Это отношение спроса к мощности; выше 100% — перегрузка, а не физическая занятость.",
              "ρ < 1 кезінде тұрақты режим мүмкін. ρ ≥ 1 кезінде сұраныс қуатқа жетеді немесе одан асады. Бұл сұраныс пен қуат қатынасы; 100%-дан жоғары — нақты жұмыс үлесі емес, артық жүктеме.",
            )}
          </p>
        </article>
        <article>
          <span className="queue-formula-number">02 / {copy("ЗАКОН ЛИТТЛА", "ЛИТТЛ ЗАҢЫ")}</span>
          <div className="queue-equation">
            W<sub>q</sub> = L<sub>q</sub> / λ · 60
          </div>
          <p className="queue-substitution">
            {lambda > 0
              ? `${f(result.stable ? result.lq : null)} / ${f(lambda)} · 60 ≈ `
              : copy("При λ = 0: ", "λ = 0 кезінде: ")}
            <b>
              {f(result.waitMin)} {copy("мин", "мин")}
            </b>
          </p>
          <p>
            {copy(
              "Lq — среднее число ожидающих по Erlang C, не текущий снимок очереди. Полное время W = (Lq + λ/μ) / λ · 60 включает обследование. Для нулевого потока используем предельные значения без деления на ноль.",
              "Lq — кезектің ағымдағы көрінісі емес, Erlang C бойынша орташа күту саны. Толық уақыт W = (Lq + λ/μ) / λ · 60 тексеруді қамтиды. Нөлдік ағын үшін нөлге бөлмей шектік мәндер қолданылады.",
            )}
          </p>
        </article>
        <article>
          <span className="queue-formula-number">03 / {copy("ДЛИННАЯ ОЧЕРЕДЬ", "ҰЗЫН КЕЗЕК")}</span>
          <div className="queue-equation">
            P(Q &gt; x) = C · ρ<sup>x+1</sup>
          </div>
          <p className="queue-substitution">
            {f(result.stable ? result.pWait : null)} · {f(result.rho)}
            <sup>{threshold + 1}</sup> ≈{" "}
            <b>
              {f(result.overflowProbability === null ? null : result.overflowProbability * 100)}%
            </b>
          </p>
          <p>
            {copy(
              `Q — только ожидающие, без обследуемых; C — вероятность ожидания по Erlang C. Порог ${threshold} означает ${threshold + 1} и более ожидающих. Это вероятность в стационарный момент, не вероятность хотя бы одной толпы за день.`,
              `Q — тек күтушілер; тексерудегілер кірмейді. C — Erlang C бойынша күту ықтималдығы. ${threshold} шегі ${threshold + 1} және одан көп күтушіні білдіреді. Бұл күндегі кемінде бір шоғырлану емес, стационарлық мезет ықтималдығы.`,
            )}
          </p>
        </article>
      </div>
      <details className="queue-details">
        <summary>
          {copy("Промежуточные формулы и предположения", "Аралық формулалар мен жорамалдар")}
        </summary>
        <div className="queue-equation queue-equation-small">
          a = λ/μ; C = [a<sup>c</sup> / (c! · (1−ρ))] / [Σ<sub>k=0</sub>
          <sup>c−1</sup> a<sup>k</sup>/k! + a<sup>c</sup> / (c! · (1−ρ))]
        </div>
        <div className="queue-equation queue-equation-small">
          L<sub>q</sub> = C · ρ / (1−ρ); L = L<sub>q</sub> + a; W = W<sub>q</sub> + 60/μ
        </div>
        <p>
          {copy(
            "Предполагаем постоянный пуассоновский поток, независимое экспоненциальное обслуживание, одинаковые параллельные ресурсы, одну очередь по порядку прихода, отсутствие отказов и ухода из очереди. Число c — одновременно работающие комплекты «аппарат + кабинет + сотрудник» одной услуги. Измерения должны подтвердить применимость; запись по фиксированным интервалам и разная длительность процедур могут потребовать другой модели.",
            "Тұрақты пуассон ағыны, тәуелсіз экспоненциал қызмет, бірдей параллель ресурстар, келу ретімен бір кезек, бас тарту мен кетудің болмауы болжанады. c — бір қызметтің қатар жұмыс істейтін «аппарат + кабинет + қызметкер» жиынтықтары. Қолданылуын өлшемдермен тексеру қажет; тұрақты аралықтағы жазылу мен әртүрлі рәсім ұзақтығы басқа модельді қажет етуі мүмкін.",
          )}
        </p>
        <p>
          {copy(
            "Риск выводится из стационарного хвоста M/M/c: для n ≥ c вероятность N=n равна P(N=c)·ρ^(n−c). Суммирование от n=c+x+1 даёт C·ρ^(x+1). В статье Dean et al. используется другая, бесконечноресурсная модель; её пуассоновская формула отдельно разобрана в научном обосновании.",
            "Тәуекел M/M/c стационарлық құйрығынан шығады: n ≥ c үшін P(N=n)=P(N=c)·ρ^(n−c). n=c+x+1-ден қосқанда C·ρ^(x+1) шығады. Dean және т.б. мақаласында шексіз ресурстық модель бар; оның Пуассон формуласы ғылыми негіздемеде бөлек талданған.",
          )}
        </p>
      </details>
    </section>
  );
}
