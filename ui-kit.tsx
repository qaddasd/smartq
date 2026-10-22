import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LoadLevel } from "@/lib/centers";
import { useStore } from "@/lib/store";

/* ---------- Page scaffolding ---------- */

export function Screen({
  title,
  subtitle,
  back,
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="page-screen">
      <header className="page-heading">
        <div className="flex min-w-0 items-start gap-2">
          {back && <BackButton />}
          <div className="min-w-0">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      <main className={cn("page-body", className)}>{children}</main>
    </div>
  );
}

export function BackButton() {
  const { t } = useStore();
  return (
    <button
      type="button"
      onClick={() =>
        window.history.length > 1 ? window.history.back() : (window.location.href = "/")
      }
      aria-label={t("back")}
      className="-ml-2 grid h-9 w-9 place-items-center rounded-md text-primary active:bg-secondary"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-5 first:mt-0", className)}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between px-0.5">
          {title && (
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("sq-card rounded-2xl border bg-card shadow-card", className)}>
      {children}
    </div>
  );
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export function Button({
  variant = "primary",
  size = "lg",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "lg" | "md" | "sm" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl font-medium transition-colors hover:brightness-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-ring",
        size === "lg" && "h-12 px-4 text-[15px]",
        size === "md" && "h-10 px-3 text-[14px]",
        size === "sm" && "h-8 px-3 text-[13px] w-auto",
        variant === "primary" && "bg-primary text-primary-foreground active:bg-primary/90",
        variant === "secondary" && "bg-primary-soft text-primary active:bg-primary-soft/70",
        variant === "outline" && "border bg-card text-foreground active:bg-secondary",
        variant === "ghost" && "text-primary active:bg-secondary",
        variant === "danger" && "bg-danger-soft text-danger active:bg-danger-soft/70",
        className,
      )}
      {...props}
    />
  );
}

/* ---------- List rows ---------- */

export function ListRow({
  icon,
  label,
  hint,
  value,
  to,
  onClick,
  chevron = true,
  right,
}: {
  icon?: ReactNode;
  label: string;
  hint?: string;
  value?: string;
  to?: string;
  onClick?: () => void;
  chevron?: boolean;
  right?: ReactNode;
}) {
  const inner = (
    <>
      {icon && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px]">{label}</span>
        {hint && <span className="block truncate text-[12px] text-muted-foreground">{hint}</span>}
      </span>
      {value && <span className="shrink-0 text-[14px] text-muted-foreground">{value}</span>}
      {right}
      {chevron && (to || onClick) && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </>
  );
  const cls =
    "flex w-full items-center gap-3 px-4 py-3 text-left active:bg-secondary border-b last:border-b-0";
  if (to) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link to={to as any} className={cls}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

/* ---------- Toggle ---------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-success" : "bg-input",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0.5 h-6 w-6 rounded-full bg-card shadow-sm transition-transform",
          checked ? "translate-x-5.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/* ---------- Badges ---------- */

export function LoadBadge({ level, compact }: { level: LoadLevel; compact?: boolean }) {
  const { t } = useStore();
  const label = level === "low" ? t("load_low") : level === "mid" ? t("load_mid") : t("load_high");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-[12px] font-medium",
        compact ? "px-0" : "px-2 py-0.5",
        !compact && level === "low" && "bg-success-soft text-success",
        !compact && level === "mid" && "bg-warning-soft text-warning",
        !compact && level === "high" && "bg-danger-soft text-danger",
        compact && "text-muted-foreground",
      )}
    >
      <LoadDot level={level} />
      {label}
    </span>
  );
}

export function LoadDot({ level, className }: { level: LoadLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        level === "low" && "bg-success",
        level === "mid" && "bg-warning",
        level === "high" && "bg-danger",
        className,
      )}
    />
  );
}

export function DemoTag({ className }: { className?: string }) {
  const { t } = useStore();
  return (
    <span
      className={cn(
        "inline-flex rounded border border-warning/40 bg-warning-soft px-1.5 py-px text-[10px] font-semibold tracking-wide text-warning",
        className,
      )}
    >
      {t("demoData")}
    </span>
  );
}

export function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1 tabular">
        <span className="text-[20px] font-semibold leading-none">{value}</span>
        {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
