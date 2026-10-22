import { Link } from "@tanstack/react-router";
import { getCenter } from "@/lib/centers";
import { useStore, type Ticket } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, Button } from "./ui-kit";

export function statusKey(status: Ticket["status"]) {
  return (
    {
      waiting: "status_waiting",
      soon: "status_soon",
      next: "status_next",
      now: "status_now",
      done: "status_done",
    } as const
  )[status];
}

export function StatusPill({ status }: { status: Ticket["status"] }) {
  const { t } = useStore();
  const tone =
    status === "now" ? "bg-success text-primary-foreground" :
    status === "next" || status === "soon" ? "bg-warning-soft text-warning" :
    status === "done" ? "bg-secondary text-muted-foreground" :
    "bg-primary-soft text-primary";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium", tone)}>
      {(status === "waiting" || status === "soon") && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {t(statusKey(status))}
    </span>
  );
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const { t, plural, state } = useStore();
  const center = getCenter(ticket.centerId);
  const ahead = ticket.ahead;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <div className="text-[12px] text-muted-foreground">{t("home_currentQueue")}</div>
          <div className="mt-0.5 truncate text-[13px] text-foreground">{center?.name[state.lang]}</div>
        </div>
        <StatusPill status={ticket.status} />
      </div>
      <div className="px-4 pt-3">
        <div className="text-[34px] font-semibold leading-none tabular">{t("ticketNo", { n: ticket.number })}</div>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x border-t">
        <div className="px-4 py-3">
          <div className="text-[11px] text-muted-foreground">{t("ahead")}</div>
          <div className="mt-0.5 text-[16px] font-semibold tabular">
            {ahead} <span className="text-[12px] font-normal text-muted-foreground">{plural(ahead, "people_1", "people_2", "people_5")}</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-muted-foreground">{t("waiting")}</div>
          <div className="mt-0.5 text-[16px] font-semibold tabular">
            ~{ticket.waitMin} <span className="text-[12px] font-normal text-muted-foreground">{t("minShort")}</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-muted-foreground">{t("room")}</div>
          <div className="mt-0.5 text-[16px] font-semibold tabular">№{ticket.room}</div>
        </div>
      </div>
      <div className="border-t p-3">
        <Link to="/queue">
          <Button size="md">{t("home_openQueue")}</Button>
        </Link>
      </div>
    </Card>
  );
}
