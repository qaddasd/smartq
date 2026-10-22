import { estimateTicketWait } from "./queue-model.ts";
export type QueueStatus = "waiting" | "soon" | "next" | "now" | "done";
export interface QueueTicket {
  number: number;
  centerId: string;
  room: number;
  ahead: number;
  waitMin: number;
  status: QueueStatus;
  issuedAt: number;
  demoStep: number;
  updatedAt?: number;
  initialAhead?: number;
  delayMin?: number;
  visitId?: string;
}
/** Advancing is explicit: the patient is called only after everybody ahead has left. */
export function advanceTicket(ticket: QueueTicket, mu: number, now = Date.now()): QueueTicket {
  if (ticket.status === "now" || ticket.status === "done") return ticket;
  const ahead = Math.max(0, ticket.ahead - 1);
  const status: QueueStatus =
    ticket.ahead === 0 ? "now" : ahead === 0 ? "next" : ahead <= 1 ? "soon" : "waiting";
  return {
    ...ticket,
    ahead,
    status,
    waitMin: status === "now" ? 0 : estimateTicketWait(ahead, mu) + (ticket.delayMin ?? 0),
    updatedAt: now,
    demoStep: ticket.demoStep + 1,
  };
}
export function delayTicket(ticket: QueueTicket, minutes = 5, now = Date.now()): QueueTicket {
  if (
    ticket.status === "now" ||
    ticket.status === "done" ||
    minutes <= 0 ||
    !Number.isFinite(minutes)
  )
    return ticket;
  return {
    ...ticket,
    delayMin: (ticket.delayMin ?? 0) + minutes,
    waitMin: ticket.waitMin + minutes,
    updatedAt: now,
  };
}
