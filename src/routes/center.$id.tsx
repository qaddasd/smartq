import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  MapPin,
  QrCode,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { z } from "zod";
import { Screen, Card, Button, LoadBadge, DemoTag, Stat } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { getCenter, centerLoad, centerWaitMin, centerModel, findAlternative } from "@/lib/centers";
import { QueueDerivation } from "@/components/QueueDerivation";

export const Route = createFileRoute("/center/$id")({
  validateSearch: z.object({ from: z.enum(["qr"]).optional() }),
  loader: ({ params }) => {
    const c = getCenter(params.id);
    if (!c) throw notFound();
    return { name: c.name.ru, type: c.type.ru };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Центр"} — SmartQ` },
      {
        name: "description",
        content: `${loaderData?.name ?? ""}: вход в электронную очередь, загрузка и время ожидания.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Центр"} — SmartQ` },
      { property: "og:description", content: loaderData?.type ?? "Медицинский центр Актау" },
    ],
  }),
  component: CenterPage,
});

function CenterPage() {
  const { id } = Route.useParams();
  const { from } = Route.useSearch();
  const { t, copy, state, hydrated, issueTicket, selectCenter, plural } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<"idle" | "confirm" | "issued">("idle");
  const center = getCenter(id)!;
  const load = centerLoad(center);
  const wait = centerWaitMin(center);
  const model = centerModel(center);
  const f = (value: number | null) =>
    value === null || !Number.isFinite(value)
      ? "—"
      : new Intl.NumberFormat(state.lang === "kk" ? "kk-KZ" : "ru-RU", {
          maximumFractionDigits: 1,
        }).format(value);
  const alt = findAlternative(center);
  const altWait = alt ? centerWaitMin(alt) : 0;
  const existing = hydrated ? state.ticket : null;

  function getTicket() {
    const tk = issueTicket(center.id);
    setStep("issued");
    void navigate({ to: "/queue", search: { new: tk.number } });
  }

  return (
    <Screen
      title={center.name[state.lang]}
      subtitle={center.type[state.lang]}
      back
      right={<DemoTag />}
    >
      {from === "qr" && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-[13px] text-success">
          <QrCode className="h-4 w-4" /> {t("scan_found")}
        </div>
      )}

      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <LoadBadge level={load} />
          <span className="text-[12px] text-muted-foreground">
            {t("center_hours")}: {center.hours}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat
            label={t("center_inQueue")}
            value={center.demo.inQueue}
            unit={plural(center.demo.inQueue, "people_1", "people_2", "people_5")}
          />
          <Stat
            label={copy("Ожидание · модель", "Күту · модель")}
            value={f(model.waitMin)}
            unit={t("minShort")}
          />
          <Stat
            label={copy("Спрос / мощность", "Сұраныс / қуат")}
            value={f(model.rho * 100)}
            unit="%"
          />
          <Stat
            label={copy("Параллельных ресурсов", "Параллель ресурстар")}
            value={center.demo.rooms}
          />
          <Stat
            label={copy("Ожидание + обследование", "Күту + тексеру")}
            value={f(model.totalMin)}
            unit={t("minShort")}
          />
          <Stat
            label={copy("Риск очереди > 5", "Кезек > 5 тәуекелі")}
            value={f(model.overflowProbability === null ? null : model.overflowProbability * 100)}
            unit="%"
          />
        </div>
        <p className="mt-3 text-[11.5px] leading-snug text-muted-foreground">
          {t("center_demoNote")}
        </p>
        <p className="econ-footnote">
          {copy(
            `Свободных ресурсов в среднем по модели: ${f(model.idleRooms)}. Это не текущая доступность кабинетов. Текущее число в очереди выше — отдельный демонстрационный снимок, а не среднее Lq.`,
            `Модель бойынша орташа бос ресурс: ${f(model.idleRooms)}. Бұл кабинеттердің ағымдағы қолжетімділігі емес. Жоғарыдағы кезек саны — орташа Lq емес, бөлек демонстрациялық көрініс.`,
          )}
        </p>
      </Card>

      <details className="queue-center-explanation">
        <summary>
          {copy(
            "Как рассчитаны ожидание, нагрузка и риск",
            "Күту, жүктеме мен тәуекел қалай есептелді",
          )}
        </summary>
        <QueueDerivation
          lambda={center.demo.lambda}
          mu={center.demo.mu}
          rooms={center.demo.rooms}
        />
      </details>

      {load === "high" && alt && (
        <Card className="mt-3 overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-danger-soft px-4 py-2.5 text-[14px] font-medium text-danger">
            <AlertTriangle className="h-4 w-4" /> {t("center_overloaded")}
            <span className="ml-auto text-[13px] font-normal tabular">
              {center.demo.inQueue} · ~{wait} {t("minShort")}
            </span>
          </div>
          <div className="px-4 py-3">
            <div className="text-[12px] font-medium text-primary">{t("center_altFound")}</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[14px]">{alt.name[state.lang]}</div>
                <div className="text-[12px] text-muted-foreground">{alt.address[state.lang]}</div>
              </div>
              <div className="shrink-0 text-right tabular">
                <div className="text-[14px] font-semibold text-success">
                  {alt.demo.inQueue} {plural(alt.demo.inQueue, "people_1", "people_2", "people_5")}
                </div>
                <div className="text-[12px] text-muted-foreground">
                  ~{altWait} {t("minShort")}
                </div>
              </div>
            </div>
            <Link to="/map" search={{ center: alt.id }} className="mt-3 block">
              <Button variant="secondary" size="md">
                {t("center_viewAlt")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <Card className="mt-3">
        <div className="flex items-start gap-3 border-b px-4 py-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted-foreground">{t("center_address")}</div>
            <div className="text-[14px]">{center.address[state.lang]}</div>
          </div>
          <Link
            to="/map"
            search={{ center: center.id }}
            className="shrink-0 text-[13px] font-medium text-primary"
          >
            {t("nav_map")}
          </Link>
        </div>
        <div className="flex items-start gap-3 px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted-foreground">{t("center_type")}</div>
            <div className="text-[14px]">{center.type[state.lang]}</div>
          </div>
        </div>
      </Card>

      <Link to="/book" search={{ center: center.id }} className="hero-link !mt-5 !mb-1">
        {copy("Записаться на конкретное время", "Белгілі бір уақытқа жазылу")}{" "}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="text-xs text-muted-foreground mt-3">
        {copy(
          "Уже в клинике? Получите демонстрационный талон ниже.",
          "Клиникадасыз ба? Төменнен демонстрациялық талон алыңыз.",
        )}
      </p>
      <div className="mt-4">
        {existing && existing.status !== "done" && step === "idle" ? (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-[14px]">
              <TicketIcon className="h-4 w-4 text-primary" />{" "}
              {t("center_alreadyTicket", { n: existing.number })}
            </div>
            <Link to="/queue" className="mt-3 block">
              <Button size="md">{t("center_openQueue")}</Button>
            </Link>
          </Card>
        ) : step === "idle" ? (
          <Button
            onClick={() => {
              selectCenter(center.id);
              setStep("confirm");
            }}
          >
            <Users className="h-5 w-5" /> {t("center_enter")}
          </Button>
        ) : step === "confirm" ? (
          <Card className="p-4">
            <div className="text-[15px] font-semibold">{t("center_confirmTitle")}</div>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("center_confirmText")}</p>
            <div className="mt-3 grid grid-cols-[1fr_2fr] gap-2">
              <Button variant="outline" size="md" onClick={() => setStep("idle")}>
                {t("cancel")}
              </Button>
              <Button size="md" onClick={getTicket}>
                <TicketIcon className="h-4 w-4" /> {t("center_getTicket")}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5 text-center">
            <div className="text-[12px] text-muted-foreground">{t("queue_ticketCreated")}</div>
            <div className="mt-1 text-[32px] font-semibold tabular">
              {t("ticketNo", { n: state.ticket?.number ?? 126 })}
            </div>
            <div className="mt-1 text-[13px] text-success">{t("status_waiting")}</div>
          </Card>
        )}
      </div>
    </Screen>
  );
}
