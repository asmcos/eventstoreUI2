"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookMarked,
  BookPlus,
  FilePlus,
  Home,
  LogOut,
  PenLine,
  PenTool,
} from "lucide-react";
import { blog_counts, book_counts, get_user_profile } from "@/lib/esclient/esclient";
import { getKey, clearKey } from "@/lib/auth/keys";
import { uploadpath } from "@/lib/config";

interface UserProfileData {
  displayName?: string;
  title?: string;
  avatarUrl?: string;
}

const mainNav = [
  { href: "/", label: "主页", icon: Home, color: "hover:bg-sky-50 text-sky-500" },
  { href: "/creator", label: "创作中心", icon: PenTool, color: "hover:bg-indigo-50 text-indigo-500" },
  { href: "/editblog", label: "博客管理", icon: PenLine, color: "hover:bg-emerald-50 text-emerald-500", countKey: "blog" as const },
  { href: "/editbook", label: "书籍管理", icon: BookMarked, color: "hover:bg-amber-50 text-amber-500", countKey: "book" as const },
  { href: "#", label: "数据统计", icon: BarChart3, color: "hover:bg-rose-50 text-rose-500", disabled: true },
];

const toolNav = [
  { href: "/editblog", label: "新建博客", icon: FilePlus, color: "text-green-500" },
  { href: "/editbook/new", label: "新建书籍", icon: BookPlus, color: "text-blue-500" },
];

export default function CreatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [blogCount, setBlogCount] = useState(0);
  const [bookCount, setBookCount] = useState(0);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const { Keypub } = getKey();
    if (!Keypub) return;

    get_user_profile(Keypub, (msg: { code?: number; data?: string }) => {
      if (msg?.code === 200 && msg.data) {
        try {
          setProfile(typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data);
        } catch {
          /* ignore */
        }
      }
    });

    blog_counts(Keypub, (msg: { code?: number; counts?: number }) => {
      if (msg?.code === 200) setBlogCount(msg.counts ?? 0);
    });

    book_counts(Keypub, (msg: { code?: number; counts?: number }) => {
      if (msg?.code === 200) setBookCount(msg.counts ?? 0);
    });
  }, []);

  const handleLogout = () => {
    clearKey();
    router.push("/login");
  };

  const counts = { blog: blogCount, book: bookCount };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white shadow-lg">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-xl font-bold text-white">
              创
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-bold text-gray-800">我的创作空间</h2>
              <p className="truncate text-sm text-gray-500">
                {profile?.displayName ?? "暂未设置昵称"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <p className="mb-2 px-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            创作中心
          </p>
          <ul className="space-y-0.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/creator"
                  ? pathname === "/creator"
                  : item.href !== "#" && pathname.startsWith(item.href);
              const count = item.countKey ? counts[item.countKey] : null;
              return (
                <li key={item.label}>
                  <Link
                    href={item.disabled ? "#" : item.href}
                    className={`flex items-center px-4 py-3 text-gray-700 transition-colors ${
                      item.disabled ? "cursor-not-allowed opacity-50" : item.color
                    } ${active ? "bg-indigo-50 font-medium text-indigo-700" : ""}`}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <Icon className={`mr-3 h-5 w-5 shrink-0 ${item.color.split(" ")[1] ?? ""}`} />
                    <span>{item.label}</span>
                    {count !== null && count > 0 && (
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                          item.countKey === "blog"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-8 mb-2 px-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            创作工具
          </p>
          <ul className="space-y-0.5">
            {toolNav.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Icon className={`mr-3 h-5 w-5 ${item.color}`} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/creator/profile"
              className="flex min-w-0 flex-1 items-center rounded-lg p-1 transition-all hover:bg-purple-100"
            >
              {profile?.avatarUrl ? (
                <Image
                  src={`${uploadpath}${profile.avatarUrl}`}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full border border-blue-200 object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <PenLine className="h-5 w-5" />
                </div>
              )}
              <div className="ml-3 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {profile?.displayName ?? "未完善信息"}
                </p>
                <p className="truncate text-xs text-gray-500">{profile?.title ?? ""}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="ml-2 shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:text-indigo-600"
              aria-label="退出登录"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-indigo-600">提示</h3>
            <p className="mb-6 whitespace-pre-line text-gray-700">
              注销登录将会删除本地私钥，一旦删除将无法通过任何途径恢复，请确保已经保存后点击确认
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogout(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
