export interface AdminUser {
  email: string;
  pubkey: string;
}

export interface AdminPermission {
  pubkey: string;
  permissions?: number | string;
}

export interface AdminEvent {
  id: string;
  code?: number;
  user?: string;
  status?: number;
  data?: unknown;
  servertimestamp?: string;
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-purple-600",
  "bg-orange-500",
  "bg-green-600",
  "bg-cyan-600",
  "bg-red-500",
  "bg-pink-500",
  "bg-indigo-600",
  "bg-teal-600",
];

export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function getUserInitials(email: string): string {
  const name = email.split("@")[0] ?? "U";
  const parts = name.split(/[._-]/);
  if (parts.length > 1) {
    return parts.map((p) => p.charAt(0).toUpperCase()).join("").slice(0, 2);
  }
  return name.charAt(0).toUpperCase();
}

export function getPermissionLabel(
  permissions: AdminPermission[],
  pubkey: string
): string {
  const found = permissions.find((p) => p.pubkey === pubkey);
  if (!found?.permissions && found?.permissions !== 0) return "无";
  return String(found.permissions);
}

export function truncatePubkey(pubkey?: string): string {
  if (!pubkey || pubkey.length < 16) return pubkey ?? "—";
  return `${pubkey.slice(0, 10)}...${pubkey.slice(-8)}`;
}

export function isEventHidden(event: AdminEvent): boolean {
  return event?.status == 1;
}

export function eventWorkflowBucket(event: AdminEvent): string {
  if (event?.status == 1) return "serverhidden";
  try {
    const d =
      typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    const s =
      (d as Record<string, unknown>)?.approvalStatus ??
      (d as Record<string, unknown>)?.state ??
      (d as Record<string, unknown>)?.publishStatus;
    if (s === "pending" || s === "draft") return "pending";
    if (s === "rejected" || s === "failed") return "rejected";
    if (s === "published" || s === "approved" || s === true) return "published";
  } catch {
    /* ignore */
  }
  return "published";
}

export function filterEventsByTab(
  events: AdminEvent[],
  tab: EventListTab
): AdminEvent[] {
  if (tab === "all") return events;
  if (tab === "hidden") return events.filter(isEventHidden);
  if (tab === "pending")
    return events.filter((e) => eventWorkflowBucket(e) === "pending");
  if (tab === "published")
    return events.filter((e) => eventWorkflowBucket(e) === "published");
  if (tab === "rejected")
    return events.filter((e) => eventWorkflowBucket(e) === "rejected");
  return events;
}

export type EventListTab = "all" | "pending" | "published" | "rejected" | "hidden";

export function eventForJsonExport(event: AdminEvent): AdminEvent {
  return event;
}

export function eventDataPreview(event: AdminEvent): string {
  try {
    const text =
      typeof event.data === "string" ? event.data : JSON.stringify(event.data);
    return text.slice(0, 48);
  } catch {
    return "—";
  }
}

export function calcMaxPage(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize) || 1);
}
