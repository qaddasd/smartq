import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type Lang, type TKey, translate, plural } from "./i18n";
import { getCenter } from "./centers";
import { estimateTicketWait } from "./queue-model";
import { canBook, canCheckIn, services, reminderDue, reminderKey, type Visit } from "./visits";

import { advanceTicket, delayTicket, type QueueTicket, type QueueStatus } from "./queue-state";
export type Ticket = QueueTicket;
export type TicketStatus = QueueStatus;
export interface AppNotification {
  id: string;
  titleKey: TKey;
  bodyKey: TKey;
  params?: Record<string, string | number> | undefined;
  title?: Record<Lang, string>;
  body?: Record<Lang, string>;
  time: number;
  read: boolean;
}
export interface Settings {
  push: boolean;
  sound: boolean;
  vibration: boolean;
  queueEvents: boolean;
  reminders: boolean;
  remindBefore: 5 | 10 | 15;
  shareLocation: boolean;
  analytics: boolean;
}
export interface AppState {
  lang: Lang;
  ticket: Ticket | null;
  notifications: AppNotification[];
  selectedCenterId: string | null;
  demoRunning: boolean;
  settings: Settings;
  visits: Visit[];
  nextTicket: number;
  displayName: string;
}
export const STORAGE_KEY = "smartq-state-v2";
const initialState: AppState = {
  lang: "ru",
  ticket: null,
  notifications: [],
  selectedCenterId: null,
  demoRunning: false,
  visits: [],
  nextTicket: 126,
  displayName: "",
  settings: {
    push: false,
    sound: true,
    vibration: false,
    queueEvents: true,
    reminders: true,
    remindBefore: 10,
    shareLocation: false,
    analytics: false,
  },
};
const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function notify(
  state: AppState,
  title: Record<Lang, string>,
  body: Record<Lang, string>,
  id: string = makeId(),
): AppState {
  if (state.notifications.some((n) => n.id === id)) return state;
  return {
    ...state,
    notifications: [
      {
        id,
        titleKey: "notif_reminder" as const,
        bodyKey: "notif_reminder" as const,
        title,
        body,
        time: Date.now(),
        read: false,
      },
      ...state.notifications,
    ].slice(0, 80),
  };
}
function restore(raw: string | null): AppState | null {
  try {
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return null;
    const s = {
      ...initialState,
      ...p,
      lang: p.lang === "kk" ? "kk" : "ru",
      demoRunning: false,
      settings: { ...initialState.settings, ...p.settings },
      visits: Array.isArray(p.visits)
        ? p.visits.filter(
            (v: Visit) =>
              v &&
              typeof v.id === "string" &&
              getCenter(v.centerId) &&
              services.some((s) => s.id === v.serviceId) &&
              ["booked", "arrived", "completed", "cancelled"].includes(v.status) &&
              /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
              /^\d{2}:\d{2}$/.test(v.time),
          )
        : [],
      notifications: Array.isArray(p.notifications)
        ? p.notifications.filter(
            (n: AppNotification) =>
              n &&
              typeof n.id === "string" &&
              typeof n.titleKey === "string" &&
              typeof n.time === "number",
          )
        : [],
      nextTicket: Number.isInteger(p.nextTicket) && p.nextTicket > 0 ? p.nextTicket : 126,
      displayName: typeof p.displayName === "string" ? p.displayName.slice(0, 40) : "",
    } as AppState;
    const tk = p.ticket;
    s.ticket =
      tk &&
      getCenter(tk.centerId) &&
      Number.isFinite(tk.ahead) &&
      Number.isFinite(tk.waitMin) &&
      Number.isFinite(tk.issuedAt) &&
      Number.isFinite(tk.number) &&
      Number.isFinite(tk.room) &&
      ["waiting", "soon", "next", "now"].includes(tk.status)
        ? {
            ...tk,
            ahead: Math.max(0, tk.ahead),
            waitMin: Math.max(0, tk.waitMin),
            initialAhead: tk.initialAhead ?? Math.max(3, tk.ahead),
          }
        : null;
    return s;
  } catch {
    return null;
  }
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const ref = useRef(state);
  const commit = useCallback((change: (p: AppState) => AppState) => {
    const next = change(ref.current);
    ref.current = next;
    setState(next);
  }, []);
  useEffect(() => {
    try {
      const loaded = restore(
        localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("smartq-state-v1"),
      );
      if (loaded) {
        ref.current = loaded;
        setState(loaded);
      }
    } catch {
      setStorageError(true);
    }
    setHydrated(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = restore(event.newValue);
      if (next) {
        ref.current = next;
        setState(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = state.lang;
    try {
      const raw = JSON.stringify({ ...state, demoRunning: false });
      if (localStorage.getItem(STORAGE_KEY) !== raw) localStorage.setItem(STORAGE_KEY, raw);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state, hydrated]);
  const advanceQueue = useCallback(
    () =>
      commit((p) => {
        const ticket = p.ticket;
        if (!ticket || ticket.status === "now") return { ...p, demoRunning: false };
        const advanced = advanceTicket(ticket, getCenter(ticket.centerId)?.demo.mu ?? 12);
        const status = advanced.status;
        const next = { ...p, ticket: advanced, demoRunning: p.demoRunning && status !== "now" };
        if (!p.settings.queueEvents || status === ticket.status) return next;
        return notify(
          next,
          {
            ru: status === "now" ? "Вас приглашают на приём" : "Ваша очередь приближается",
            kk: status === "now" ? "Сізді қабылдауға шақырады" : "Кезегіңіз жақындап қалды",
          },
          {
            ru: `Талон №${ticket.number} · кабинет ${ticket.room}`,
            kk: `№${ticket.number} талон · ${ticket.room} кабинет`,
          },
        );
      }),
    [commit],
  );
  useEffect(() => {
    if (!state.demoRunning) return;
    const timer = window.setInterval(advanceQueue, 3200);
    return () => window.clearInterval(timer);
  }, [state.demoRunning, advanceQueue]);
  // Device alerts are sent after state commits, never from a React state updater.
  const seen = useRef(new Set<string>());
  const alertsReady = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (!alertsReady.current) {
      state.notifications.forEach((n) => seen.current.add(n.id));
      alertsReady.current = true;
      return;
    }
    for (const n of state.notifications) {
      if (seen.current.has(n.id)) continue;
      seen.current.add(n.id);
      if (
        !state.settings.push ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      )
        continue;
      const title = n.title?.[state.lang] ?? translate(state.lang, n.titleKey, n.params);
      const body = n.body?.[state.lang] ?? translate(state.lang, n.bodyKey, n.params);
      const options = {
        body,
        icon: "/icons/icon-192.png",
        tag: n.id,
        silent: !state.settings.sound,
      };
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker
          .getRegistration()
          .then(async (reg) => {
            if (reg) await reg.showNotification(title, options);
            else new Notification(title, options);
          })
          .catch(() => {});
      } else {
        try {
          new Notification(title, options);
        } catch {}
      }
    }
  }, [state.notifications, state.settings, state.lang, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      commit((p) => {
        if (!p.settings.reminders) return p;
        const now = Date.now();
        const due = p.visits.filter((v) => reminderDue(v, p.settings.remindBefore, now));
        if (!due.length) return p;
        let next = {
          ...p,
          visits: p.visits.map((v) =>
            due.some((item) => item.id === v.id) ? { ...v, remindedFor: reminderKey(v) } : v,
          ),
        };
        for (const v of due) {
          const center = getCenter(v.centerId)!;
          next = notify(
            next,
            { ru: "Скоро ваш приём", kk: "Қабылдау уақыты жақындады" },
            {
              ru: `${v.time} · ${center.name.ru}. Откройте посещение, чтобы подтвердить прибытие.`,
              kk: `${v.time} · ${center.name.kk}. Келгеніңізді растау үшін қабылдауды ашыңыз.`,
            },
            `reminder:${v.id}:${reminderKey(v)}`,
          );
        }
        return next;
      });
    };
    check();
    const timer = window.setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [hydrated, commit, state.settings.reminders, state.settings.remindBefore]);
  const api = useMemo(
    () => ({
      state,
      hydrated,
      storageError,
      t: (key: TKey, params?: Record<string, string | number>) =>
        translate(state.lang, key, params),
      copy: (ru: string, kk: string) => (state.lang === "kk" ? kk : ru),
      plural: (n: number, one: TKey, few: TKey, many: TKey) =>
        plural(state.lang, n, one, few, many),
      unreadCount: state.notifications.filter((n) => !n.read).length,
      setLang: (lang: Lang) => commit((p) => ({ ...p, lang })),
      selectCenter: (id: string | null) => commit((p) => ({ ...p, selectedCenterId: id })),
      setDisplayName: (name: string) =>
        commit((p) => ({ ...p, displayName: name.trim().slice(0, 40) })),
      issueTicket: (centerId: string, visitId?: string): Ticket => {
        const p = ref.current;
        if (p.ticket) return p.ticket;
        const center = getCenter(centerId);
        if (!center) throw new Error("Unknown center");
        const visit = visitId ? p.visits.find((v) => v.id === visitId) : undefined;
        if (visitId && (!visit || visit.centerId !== centerId || !canCheckIn(visit)))
          throw new Error("Check-in unavailable");
        const room =
          services.find((s) => s.id === visit?.serviceId)?.room ??
          services.find((s) => (s.centers as readonly string[]).includes(centerId))!.room;
        const ticket: Ticket = {
          number: p.nextTicket,
          centerId,
          room,
          ahead: 3,
          initialAhead: 3,
          waitMin: estimateTicketWait(3, center.demo.mu),
          status: "waiting",
          issuedAt: Date.now(),
          updatedAt: Date.now(),
          demoStep: -1,
          ...(visitId ? { visitId } : {}),
        };
        commit((current) =>
          notify(
            {
              ...current,
              ticket,
              selectedCenterId: centerId,
              nextTicket: current.nextTicket + 1,
              visits: current.visits.map((v) =>
                v.id === visitId ? { ...v, status: "arrived" } : v,
              ),
            },
            { ru: `Талон №${ticket.number} получен`, kk: `№${ticket.number} талон алынды` },
            {
              ru: `${center.name.ru}. Кабинет ${room}.`,
              kk: `${center.name.kk}. ${room} кабинет.`,
            },
          ),
        );
        return ticket;
      },
      leaveQueue: () =>
        commit((p) => ({
          ...p,
          ticket: null,
          demoRunning: false,
          visits: p.visits.map((v) =>
            v.id === p.ticket?.visitId && v.status === "arrived" ? { ...v, status: "booked" } : v,
          ),
        })),
      finishVisit: () =>
        commit((p) => {
          if (!p.ticket || p.ticket.status !== "now") return p;
          const ticket = p.ticket;
          const existing = ticket.visitId;
          const visit: Visit = {
            id: makeId(),
            centerId: ticket.centerId,
            serviceId: services.find((s) =>
              (s.centers as readonly string[]).includes(ticket.centerId),
            )!.id,
            date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Qyzylorda" }).format(
              ticket.issuedAt,
            ),
            time: new Intl.DateTimeFormat("en-GB", {
              timeZone: "Asia/Qyzylorda",
              hour: "2-digit",
              minute: "2-digit",
            }).format(ticket.issuedAt),
            status: "completed",
            createdAt: ticket.issuedAt,
            completedAt: Date.now(),
          };
          return notify(
            {
              ...p,
              ticket: null,
              demoRunning: false,
              visits: existing
                ? p.visits.map((v) =>
                    v.id === existing ? { ...v, status: "completed", completedAt: Date.now() } : v,
                  )
                : [visit, ...p.visits],
            },
            { ru: "Посещение завершено", kk: "Қабылдау аяқталды" },
            {
              ru: "Запись сохранена в истории посещений.",
              kk: "Жазба қабылдау тарихында сақталды.",
            },
          );
        }),
      advanceQueue,
      addDelay: () =>
        commit((p) => {
          if (!p.ticket || p.ticket.status === "now") return p;
          const ticket = delayTicket(p.ticket);
          return notify(
            { ...p, ticket },
            { ru: "Приём задерживается на 5 минут", kk: "Қабылдау 5 минутқа кешігеді" },
            {
              ru: "Прогноз ожидания обновлён. Следите за очередью.",
              kk: "Күту болжамы жаңартылды. Кезекті бақылаңыз.",
            },
          );
        }),
      startDemo: () =>
        commit((p) => (p.ticket && p.ticket.status !== "now" ? { ...p, demoRunning: true } : p)),
      stopDemo: () => commit((p) => ({ ...p, demoRunning: false })),
      bookVisit: (
        centerId: string,
        serviceId: string,
        date: string,
        time: string,
        replaceId?: string,
      ): boolean => {
        const p = ref.current;
        if (replaceId && !p.visits.some((v) => v.id === replaceId && v.status === "booked"))
          return false;
        if (!canBook(p.visits, centerId, serviceId, date, time, Date.now(), replaceId))
          return false;
        const previous = p.visits.find((v) => v.id === replaceId);
        const visit: Visit = {
          id: replaceId ?? makeId(),
          centerId,
          serviceId,
          date,
          time,
          status: "booked",
          createdAt: previous?.createdAt ?? Date.now(),
          revision: previous ? (previous.revision ?? 0) + 1 : 0,
        };
        commit((current) =>
          notify(
            {
              ...current,
              visits: replaceId
                ? current.visits.map((v) => (v.id === replaceId ? visit : v))
                : [visit, ...current.visits],
            },
            {
              ru: replaceId ? "Запись перенесена" : "Запись создана",
              kk: replaceId ? "Жазылу уақыты өзгертілді" : "Қабылдауға жазылдыңыз",
            },
            {
              ru: `${getCenter(centerId)!.name.ru} · ${date}, ${time}`,
              kk: `${getCenter(centerId)!.name.kk} · ${date}, ${time}`,
            },
          ),
        );
        return true;
      },
      cancelVisit: (id: string) =>
        commit((p) => {
          if (!p.visits.some((v) => v.id === id && v.status === "booked")) return p;
          return notify(
            {
              ...p,
              visits: p.visits.map((v) => (v.id === id ? { ...v, status: "cancelled" } : v)),
            },
            { ru: "Запись отменена", kk: "Жазылу тоқтатылды" },
            {
              ru: "Вы можете выбрать другое удобное время.",
              kk: "Басқа қолайлы уақытты таңдауға болады.",
            },
          );
        }),
      confirmVisit: (id: string) =>
        commit((p) => {
          if (!p.visits.some((v) => v.id === id && v.status === "booked")) return p;
          return notify(
            {
              ...p,
              visits: p.visits.map((v) =>
                v.id === id ? { ...v, confirmedAt: Date.now() } : v,
              ),
            },
            { ru: "Визит подтверждён", kk: "Қабылдау расталды" },
            {
              ru: "Спасибо! Мы напомним о скрининге перед приёмом.",
              kk: "Рақмет! Скрининг алдында еске саламыз.",
            },
          );
        }),
      markAllRead: () =>
        commit((p) => ({
          ...p,
          notifications: p.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearNotifications: () => commit((p) => ({ ...p, notifications: [] })),
      updateSettings: (patch: Partial<Settings>) =>
        commit((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
      resetAll: () => {
        try {
          localStorage.removeItem("smartq-state-v1");
          localStorage.removeItem("smartq-logged-in");
        } catch {}
        commit((p) => ({ ...initialState, lang: p.lang }));
      },
    }),
    [state, hydrated, storageError, commit, advanceQueue],
  );
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}
interface StoreApi {
  state: AppState;
  hydrated: boolean;
  storageError: boolean;
  t: (key: TKey, params?: Record<string, string | number>) => string;
  copy: (ru: string, kk: string) => string;
  plural: (n: number, one: TKey, few: TKey, many: TKey) => string;
  unreadCount: number;
  setLang: (lang: Lang) => void;
  selectCenter: (id: string | null) => void;
  setDisplayName: (name: string) => void;
  issueTicket: (centerId: string, visitId?: string) => Ticket;
  leaveQueue: () => void;
  finishVisit: () => void;
  advanceQueue: () => void;
  addDelay: () => void;
  startDemo: () => void;
  stopDemo: () => void;
  bookVisit: (
    centerId: string,
    serviceId: string,
    date: string,
    time: string,
    replaceId?: string,
  ) => boolean;
  cancelVisit: (id: string) => void;
  confirmVisit: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
}
const StoreContext = createContext<StoreApi | null>(null);
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
export const DEMO_TOTAL_STEPS = 4;
