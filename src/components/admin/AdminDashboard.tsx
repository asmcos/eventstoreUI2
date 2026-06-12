"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Eye,
  LayoutDashboard,
  Lock,
  LogOut,
  Pencil,
  Shield,
  Trash2,
  Undo2,
  Users,
  X,
} from "lucide-react";
// @ts-expect-error eventstore-tools common has no types
import { PERMISSIONS } from "eventstore-tools/src/common";
import {
  add_permission,
  delete_event,
  delete_user,
  event_counts,
  get_events,
  get_permissions,
  get_users,
  restore_event,
  user_counts,
} from "@/lib/esclient/esclient";
import { clearKey, getKey } from "@/lib/auth/keys";
import { useNotify } from "@/lib/notify";
import { subscribeCollect } from "@/lib/esclient/promise";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import {
  type AdminEvent,
  type AdminPermission,
  type AdminUser,
  type EventListTab,
  calcMaxPage,
  eventDataPreview,
  eventForJsonExport,
  filterEventsByTab,
  getAvatarColor,
  getPermissionLabel,
  getUserInitials,
  isEventHidden,
  truncatePubkey,
} from "@/lib/admin/helpers";

const PAGE_SIZE = 10;

type Section = "users" | "events";

function collectUsers(offset: number, limit: number): Promise<AdminUser[]> {
  return subscribeCollect<AdminUser>((cb) => {
    void get_users(offset, limit, cb);
  });
}

function collectPermissions(pubkeys: string[]): Promise<AdminPermission[]> {
  return subscribeCollect<AdminPermission>((cb) => {
    void get_permissions(pubkeys, cb);
  });
}

function collectEvents(
  pubkey: string,
  privkey: Uint8Array,
  offset: number,
  limit: number
): Promise<AdminEvent[]> {
  return subscribeCollect<AdminEvent>((cb) => {
    void get_events(pubkey, privkey, offset, limit, cb);
  });
}

function fetchCount(fn: (cb: (msg: unknown) => void) => void): Promise<number> {
  return new Promise((resolve) => {
    let resolved = false;
    void fn((msg) => {
      if (msg === "EOSE") {
        if (!resolved) resolve(0);
        return;
      }
      if (msg && typeof msg === "object" && "counts" in msg) {
        resolved = true;
        resolve((msg as { counts: number }).counts);
      }
    });
  });
}

function PaginationBar({
  total,
  currentPage,
  startPage,
  onPrev,
  onNext,
  onGo,
}: {
  total: number;
  currentPage: number;
  startPage: number;
  onPrev: () => void;
  onNext: () => void;
  onGo: (page: number) => void;
}) {
  const maxPage = calcMaxPage(total, PAGE_SIZE);
  const pages = [startPage, startPage + 1, startPage + 2].filter((p) => p <= maxPage);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row">
      <p className="text-sm text-gray-700">
        共 <span className="font-medium">{total}</span> 条，第{" "}
        <span className="font-medium">{currentPage}</span> / {maxPage} 页
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={onPrev}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          上一页
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onGo(p)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
              currentPage === p ? "bg-[#165DFF] text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={currentPage >= maxPage}
          onClick={onNext}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const notify = useNotify();
  const [authed, setAuthed] = useState(false);
  const [keypub, setKeypub] = useState<string | null>(null);
  const [keypriv, setKeypriv] = useState<Uint8Array | null>(null);
  const [section, setSection] = useState<Section>("users");
  const [menuOpen, setMenuOpen] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userStartPage, setUserStartPage] = useState(1);

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventTotal, setEventTotal] = useState(0);
  const [eventPage, setEventPage] = useState(1);
  const [eventStartPage, setEventStartPage] = useState(1);
  const [eventTab, setEventTab] = useState<EventListTab>("all");

  const [rawModal, setRawModal] = useState<{ label: string; json: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredEvents = useMemo(
    () => filterEventsByTab(events, eventTab),
    [events, eventTab]
  );

  const syncKeys = useCallback(() => {
    const { Keypub, Keypriv } = getKey();
    setKeypub(Keypub);
    setKeypriv(Keypriv);
    setAuthed(!!Keypriv);
    return { Keypub, Keypriv };
  }, []);

  const loadUsers = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const list = await collectUsers(offset, PAGE_SIZE);
      setUsers(list);
      const perms =
        list.length > 0
          ? await collectPermissions(list.map((u) => u.pubkey))
          : [];
      setPermissions(perms);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvents = useCallback(
    async (page: number, pub: string, priv: Uint8Array) => {
      setLoading(true);
      try {
        const offset = (page - 1) * PAGE_SIZE;
        const list = await collectEvents(pub, priv, offset, PAGE_SIZE);
        setEvents(list);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadTotals = useCallback(async () => {
    const [uTotal, eTotal] = await Promise.all([
      fetchCount(user_counts),
      fetchCount(event_counts),
    ]);
    setUserTotal(uTotal);
    setEventTotal(eTotal);
  }, []);

  const refreshAll = useCallback(async () => {
    const { Keypub, Keypriv } = syncKeys();
    if (!Keypub || !Keypriv) return;
    setAuthed(true);
    await loadTotals();
    await Promise.all([
      loadUsers(userPage),
      loadEvents(eventPage, Keypub, Keypriv),
    ]);
  }, [syncKeys, loadTotals, loadUsers, loadEvents, userPage, eventPage]);

  useEffect(() => {
    const { Keypub, Keypriv } = syncKeys();
    if (!Keypub || !Keypriv) return;
    setAuthed(true);
    void loadTotals();
    void loadUsers(1);
    void loadEvents(1, Keypub, Keypriv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goUserPage = (page: number) => {
    const max = calcMaxPage(userTotal, PAGE_SIZE);
    const next = Math.min(Math.max(1, page), max);
    setUserPage(next);
    void loadUsers(next);
  };

  const goEventPage = (page: number) => {
    if (!keypub || !keypriv) return;
    const max = calcMaxPage(eventTotal, PAGE_SIZE);
    const next = Math.min(Math.max(1, page), max);
    setEventPage(next);
    void loadEvents(next, keypub, keypriv);
  };

  const handleDeleteUser = (pubkey: string) => {
    if (!keypub || !keypriv) return;
    delete_user(pubkey, keypub, keypriv, (message: { code?: number; message?: string }) => {
      notify(message.message ?? "操作完成", message.code === 200 ? "success" : "error");
      if (message.code === 200) void refreshAll();
    });
  };

  const handleAddPermission = (pubkey: string) => {
    if (!keypub || !keypriv) return;
    const data = {
      userId: pubkey,
      permissionValue: PERMISSIONS.CREATE_EVENTS | PERMISSIONS.UPLOAD_FILES,
    };
    add_permission(data, keypub, keypriv, (message: { code?: number; message?: string }) => {
      notify(message.message ?? "操作完成", message.code === 200 ? "success" : "error");
      if (message.code === 200) void refreshAll();
    });
  };

  const handleDeleteEvent = (event: AdminEvent) => {
    if (!keypub || !keypriv) return;
    delete_event(event.id, keypub, keypriv, (message: { code?: number; message?: string }) => {
      notify(message.message ?? "操作完成", message.code === 200 ? "success" : "error");
      if (message.code === 200) {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: 1 } : e))
        );
      }
    });
  };

  const handleRestoreEvent = (event: AdminEvent) => {
    if (!keypub || !keypriv) return;
    restore_event(event, keypub, keypriv, (message: { code?: number; message?: string }) => {
      notify(message.message ?? "操作完成", message.code === 200 ? "success" : "error");
      if (message.code === 200) {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: 0 } : e))
        );
      }
    });
  };

  const openEventRaw = (event: AdminEvent) => {
    setRawModal({
      label: event.id ? `Event ${event.id}` : "Event",
      json: JSON.stringify(eventForJsonExport(event), null, 2),
    });
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("已复制到剪贴板", "success");
    } catch {
      notify("复制失败", "error");
    }
  };

  const handleLogout = () => {
    clearKey();
    syncKeys();
    setUsers([]);
    setEvents([]);
  };

  const sidebarLink = (id: Section, label: string, icon: React.ReactNode, badge?: number) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      className={`flex w-full items-center rounded-lg px-4 py-3 transition-colors ${
        section === id
          ? "border-l-4 border-[#165DFF] bg-[#165DFF]/10 text-[#165DFF]"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
      {badge !== undefined && (
        <span className="ml-auto rounded-full bg-[#165DFF]/10 px-2 py-0.5 text-xs font-medium text-[#165DFF]">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-[#165DFF] to-[#0e42b8] shadow-lg">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <h1 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
            <Shield className="h-5 w-5" />
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <button type="button" className="relative rounded-full p-2 text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#165DFF]" />
            </button>
            {authed && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-full px-2 py-1 text-white hover:bg-white/10"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="hidden text-sm md:inline">Admin</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg bg-white py-1 shadow-xl">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {authed && (
          <aside className="fixed left-0 top-16 hidden h-[calc(100vh-4rem)] w-64 border-r border-gray-100 bg-white shadow-sm lg:block">
            <nav className="space-y-1 p-4">
              {sidebarLink("users", "Users", <Users className="h-5 w-5" />, userTotal)}
              {sidebarLink("events", "Events", <Calendar className="h-5 w-5" />, eventTotal)}
              <div className="pointer-events-none flex items-center rounded-lg px-4 py-3 text-gray-400">
                <Lock className="mr-3 h-5 w-5" />
                Permissions
              </div>
              <div className="pointer-events-none flex items-center rounded-lg px-4 py-3 text-gray-400">
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Analytics
              </div>
            </nav>
          </aside>
        )}

        <main className={`min-h-[calc(100vh-4rem)] flex-1 p-4 sm:p-6 ${authed ? "lg:ml-64" : ""}`}>
          {!authed ? (
            <AdminLoginForm onSuccess={() => void refreshAll()} />
          ) : (
            <>
              <div className="mb-4 flex gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => setSection("users")}
                  className={`rounded-lg px-4 py-2 text-sm ${section === "users" ? "bg-[#165DFF] text-white" : "bg-white"}`}
                >
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => setSection("events")}
                  className={`rounded-lg px-4 py-2 text-sm ${section === "events" ? "bg-[#165DFF] text-white" : "bg-white"}`}
                >
                  Events
                </button>
              </div>

              {loading && (
                <p className="mb-4 text-sm text-gray-500">加载中…</p>
              )}

              {section === "users" && (
                <div>
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                      <p className="mt-1 text-gray-600">管理系统用户与权限</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
                      <div className="text-xs text-gray-500">Total Users</div>
                      <div className="text-xl font-bold text-[#165DFF]">{userTotal}</div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Public Key
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Role
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {users.map((user, index) => (
                            <tr key={user.pubkey} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div
                                    className={`mr-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(index)}`}
                                  >
                                    {getUserInitials(user.email)}
                                  </div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                {truncatePubkey(user.pubkey)}
                              </td>
                              <td className="px-6 py-4">
                                <span className="rounded-md bg-[#165DFF]/10 px-2 py-1 text-xs font-medium text-[#165DFF]">
                                  {getPermissionLabel(permissions, user.pubkey)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    title="分配权限"
                                    onClick={() => handleAddPermission(user.pubkey)}
                                    className="rounded-lg p-2 text-[#165DFF] hover:bg-[#165DFF]/10"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    title="删除用户"
                                    onClick={() => handleDeleteUser(user.pubkey)}
                                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                                暂无用户
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      total={userTotal}
                      currentPage={userPage}
                      startPage={userStartPage}
                      onPrev={() => {
                        if (userPage > 1) {
                          if (userPage <= userStartPage && userStartPage > 1) {
                            setUserStartPage((s) => s - 1);
                          }
                          goUserPage(userPage - 1);
                        }
                      }}
                      onNext={() => {
                        const max = calcMaxPage(userTotal, PAGE_SIZE);
                        if (userPage < max) {
                          if (userPage - userStartPage >= 2) {
                            setUserStartPage((s) => s + 1);
                          }
                          goUserPage(userPage + 1);
                        }
                      }}
                      onGo={goUserPage}
                    />
                  </div>
                </div>
              )}

              {section === "events" && (
                <div>
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Events Management</h2>
                      <p className="mt-1 text-gray-600">管理用户上传的事件</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
                      <div className="text-xs text-gray-500">Total Events</div>
                      <div className="text-xl font-bold text-[#165DFF]">{eventTotal}</div>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
                    {(
                      [
                        ["all", "All"],
                        ["pending", "Pending"],
                        ["published", "Published"],
                        ["rejected", "Rejected"],
                        ["hidden", "Hidden"],
                      ] as const
                    ).map(([tab, label]) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setEventTab(tab)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          eventTab === tab
                            ? "border-b-2 border-[#165DFF] text-[#165DFF]"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {label}
                        {tab === "hidden" && events.filter(isEventHidden).length > 0 && (
                          <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                            {events.filter(isEventHidden).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                    <div className="overflow-x-auto p-2">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Event
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Code
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              User
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredEvents.map((event) => (
                            <tr
                              key={event.id}
                              className={isEventHidden(event) ? "bg-amber-50/60" : "hover:bg-gray-50"}
                            >
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => openEventRaw(event)}
                                  className="flex w-full items-center gap-3 rounded-lg p-1 text-left hover:bg-gray-100"
                                >
                                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 font-mono text-xs font-semibold">
                                    {event.code ?? "—"}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-gray-900">
                                      {eventDataPreview(event)}
                                    </div>
                                    <div className="text-xs text-[#165DFF]">点击查看 JSON</div>
                                  </div>
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm">{event.code ?? "—"}</td>
                              <td className="px-4 py-3 font-mono text-sm text-gray-500">
                                {truncatePubkey(event.user)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {event.servertimestamp?.split("T")[0] ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {isEventHidden(event) ? "hidded" : "open"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  {isEventHidden(event) ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRestoreEvent(event)}
                                      className="flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200"
                                    >
                                      <Undo2 className="h-3.5 w-3.5" />
                                      恢复
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openEventRaw(event)}
                                        className="rounded-lg p-2 text-[#165DFF] hover:bg-[#165DFF]/10"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          copyText(
                                            JSON.stringify(eventForJsonExport(event), null, 2)
                                          )
                                        }
                                        className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteEvent(event)}
                                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredEvents.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                当前标签下没有事件
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      total={eventTotal}
                      currentPage={eventPage}
                      startPage={eventStartPage}
                      onPrev={() => {
                        if (eventPage > 1) {
                          if (eventPage <= eventStartPage && eventStartPage > 1) {
                            setEventStartPage((s) => s - 1);
                          }
                          goEventPage(eventPage - 1);
                        }
                      }}
                      onNext={() => {
                        const max = calcMaxPage(eventTotal, PAGE_SIZE);
                        if (eventPage < max) {
                          if (eventPage - eventStartPage >= 2) {
                            setEventStartPage((s) => s + 1);
                          }
                          goEventPage(eventPage + 1);
                        }
                      }}
                      onGo={goEventPage}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {rawModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRawModal(null)}
        >
          <div
            className="flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col rounded-xl border border-gray-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="font-semibold text-gray-900">{rawModal.label}</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyText(rawModal.json)}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4" />
                  复制
                </button>
                <button
                  type="button"
                  onClick={() => setRawModal(null)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-5 font-mono text-xs leading-relaxed text-gray-800">
              {rawModal.json}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
