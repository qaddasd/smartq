import { ArrowUpRight, FileText } from "lucide-react";
import { economicSources, lateDiagnosisEvidence } from "@/lib/economics";
import { useStore } from "@/lib/store";

export function RegionalProblem() {
  const { copy, state } = useStore();
  return (
    <section
      className="regional-problem"
      id="regional-problem"
      aria-labelledby="regional-problem-title"
    >
      <div className="regional-problem-copy">
        <span className="regional-eyebrow">
          <FileText size={16} />
          {copy("РЕГИОНАЛЬНЫЙ ИСТОЧНИК", "ӨҢІРЛІК ДЕРЕККӨЗ")}
        </span>
        <h2 id="regional-problem-title">
          {copy("Позднее выявление в Мангистау", "Маңғыстауда кеш анықтау")}
        </h2>
        <a href={economicSources.lateDiagnosis} target="_blank" rel="noreferrer">
          Lada.kz · <time dateTime={lateDiagnosisEvidence.publicationDate}>10.06.2026</time>
          <ArrowUpRight size={16} />
        </a>
        <small>
          {copy("Брифинг онкоцентра: Айгерим Агилаева.", "Онкоорталық брифингі: Айгерім Агилаева.")}
        </small>
      </div>
      <div className="regional-problem-data">
        <span>
          {lateDiagnosisEvidence.period[state.lang]} ·{" "}
          {copy("Мангистауская область", "Маңғыстау облысы")}
        </span>
        <div className="regional-problem-metrics">
          <div>
            <strong>{String(lateDiagnosisEvidence.stageIVSharePercent).replace(".", ",")}%</strong>
            <p>
              {copy(
                "Доля новых случаев, выявленных на IV стадии",
                "IV сатыда анықталған жаңа жағдайлар үлесі",
              )}
            </p>
          </div>
          <div>
            <strong>+{lateDiagnosisEvidence.relativeShareGrowthPercent}%</strong>
            <p>
              {copy(
                "Относительный рост доли к прошлому году",
                "Үлестің өткен жылға қатысты салыстырмалы өсімі",
              )}
            </p>
          </div>
        </div>
        <p className="regional-problem-note">
          {copy(
            "Обоснование актуальности. Влияние SmartQ требует проверки пилотом.",
            "Өзектілікті негіздеу. SmartQ әсері пилотта тексерілуі тиіс.",
          )}
        </p>
      </div>
    </section>
  );
}
