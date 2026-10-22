import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Building2, Clock3, Search } from "lucide-react";
import { Screen, Card, LoadBadge, DemoTag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { centers, centerLoad, centerWaitMin } from "@/lib/centers";
export const Route = createFileRoute("/centers")({ component: Centers });
function Centers() {
  const { copy, state } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const filtered = centers
    .filter(
      (c) =>
        (category === "all" ||
          (category === "clinic"
            ? c.id.startsWith("polyclinic")
            : !c.id.startsWith("polyclinic"))) &&
        `${c.name[state.lang]} ${c.address[state.lang]} ${c.type[state.lang]}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "wait"
        ? centerWaitMin(a) - centerWaitMin(b)
        : a.name[state.lang].localeCompare(b.name[state.lang]),
    );
  return (
    <Screen
      title={copy("Медицинские центры", "Медициналық орталықтар")}
      subtitle={copy(
        "Найдите нужное учреждение и спланируйте визит.",
        "Қажетті мекемені тауып, қабылдауды жоспарлаңыз.",
      )}
      right={<DemoTag />}
    >
      <div className="flex flex-wrap gap-3 mb-5">
        <label className="relative flex-1 min-w-[180px]">
          <span className="sr-only">{copy("Поиск центра", "Орталықты іздеу")}</span>
          <Search size={17} className="absolute left-3 top-3.5 text-muted-foreground" />
          <input
            className="search-input !pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy("Название или адрес", "Атауы немесе мекенжайы")}
          />
        </label>
        <label className="field">
          <span className="sr-only">{copy("Тип центра", "Орталық түрі")}</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{copy("Все учреждения", "Барлық мекемелер")}</option>
            <option value="clinic">{copy("Поликлиники", "Емханалар")}</option>
            <option value="special">{copy("Специализированные", "Мамандандырылған")}</option>
          </select>
        </label>
        <label className="field">
          <span className="sr-only">{copy("Сортировка", "Сұрыптау")}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">{copy("По названию", "Атауы бойынша")}</option>
            <option value="wait">{copy("По ожиданию", "Күтуі бойынша")}</option>
          </select>
        </label>
      </div>
      <div className="clinic-grid">
        {filtered.map((c) => (
          <Card key={c.id} className="clinic-card">
            <div className="flex justify-between items-center">
              <span className="clinic-symbol">
                <Building2 size={21} />
              </span>
              <LoadBadge level={centerLoad(c)} />
            </div>
            <h3>{c.name[state.lang]}</h3>
            <p>{c.type[state.lang]}</p>
            <p>{c.address[state.lang]}</p>
            <div className="clinic-footer">
              <span className="text-xs text-muted-foreground flex gap-1 items-center">
                <Clock3 size={14} />~{centerWaitMin(c)} {copy("мин", "мин")} · {c.demo.inQueue}{" "}
                {copy("в очереди", "кезекте")}
              </span>
              <Link to="/center/$id" params={{ id: c.id }} className="muted-link">
                {copy("Открыть", "Ашу")}
                <ArrowRight size={15} />
              </Link>
            </div>
          </Card>
        ))}
      </div>
      {!filtered.length && (
        <Card className="empty-state">
          <Search size={35} />
          <h2>{copy("Ничего не найдено", "Ештеңе табылмады")}</h2>
          <p>
            {copy(
              "Измените название или фильтр учреждения.",
              "Атауын немесе мекеме сүзгісін өзгертіңіз.",
            )}
          </p>
          <button
            className="text-primary text-sm"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            {copy("Сбросить поиск", "Іздеуді тазарту")}
          </button>
        </Card>
      )}
      <p className="demo-note mt-5">
        {copy(
          "Сравнивайте учреждения с учётом необходимой услуги. Короткая очередь не означает, что центр подходит для вашего обращения. Данные загрузки демонстрационные.",
          "Мекемелерді қажетті қызметті ескере отырып салыстырыңыз. Қысқа кезек орталық сіздің өтінішіңізге сай келеді дегенді білдірмейді. Жүктеме деректері демонстрациялық.",
        )}
      </p>
    </Screen>
  );
}
