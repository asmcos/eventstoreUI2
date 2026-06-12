"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  BookOpen,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { blog_counts, book_counts, get_blogs, get_books } from "@/lib/esclient/esclient";
import { getKey } from "@/lib/auth/keys";
import { getTagValue } from "@/lib/utils/ids";
import { uploadpath } from "@/lib/config";

interface BlogItem {
  id: string;
  data: { title?: string; coverUrl?: string };
  labels?: string[];
  servertimestamp?: string;
}

interface BookItem {
  id: string;
  data: { title?: string; coverImgurl?: string };
  labels?: string[];
  servertimestamp?: string;
}

function parseBlogMessage(message: unknown): BlogItem | null {
  if (!message || message === "EOSE") return null;
  const m = message as BlogItem & { data: string | BlogItem["data"]; tags?: [string, string][] };
  try {
    const data = typeof m.data === "string" ? JSON.parse(m.data) : m.data;
    const id = getTagValue(m.tags, "d") ?? m.id;
    return { ...m, id, data };
  } catch {
    return null;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  subValue,
  iconBg,
  barColor,
  barWidth,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subLabel: string;
  subValue?: string;
  iconBg: string;
  barColor: string;
  barWidth: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
      <div className="flex items-center">
        <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm text-gray-500">{label}</h3>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-sm text-gray-600">
          <span>{subLabel}</span>
          {subValue && <span>{subValue}</span>}
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div className={`h-2 rounded-full ${barColor}`} style={{ width: barWidth }} />
        </div>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [blogTotal, setBlogTotal] = useState(0);
  const [bookTotal, setBookTotal] = useState(0);

  useEffect(() => {
    const { Keypub } = getKey();
    if (!Keypub) return;

    const blogList: BlogItem[] = [];
    const bookList: BookItem[] = [];
    let pending = 4;

    const done = () => {
      pending -= 1;
      if (pending <= 0) setLoading(false);
    };

    get_blogs(Keypub, 0, 0, 4, (msg: unknown) => {
      const item = parseBlogMessage(msg);
      if (item) blogList.push(item);
      if (msg === "EOSE") {
        setBlogs(blogList);
        done();
      }
    });

    get_books(Keypub, 0, 10, (msg: unknown) => {
      if (msg && msg !== "EOSE") {
        const m = msg as BookItem & { tags?: [string, string][] };
        const id = getTagValue(m.tags, "d") ?? m.id;
        bookList.push({ ...m, id });
      }
      if (msg === "EOSE") {
        setBooks(bookList);
        done();
      }
    });

    blog_counts(Keypub, (msg: { code?: number; counts?: number }) => {
      if (msg?.code === 200) setBlogTotal(msg.counts ?? 0);
      done();
    });

    book_counts(Keypub, (msg: { code?: number; counts?: number }) => {
      if (msg?.code === 200) setBookTotal(msg.counts ?? 0);
      done();
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-indigo-600" />
        加载创作数据…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">创作中心</h1>
        <p className="mt-1 text-gray-600">管理你的博客、书籍与社区内容</p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          icon={FileText}
          label="博客文章"
          value={`${blogTotal} 篇`}
          subLabel="已发布"
          iconBg="bg-blue-100 text-blue-500"
          barColor="bg-blue-500"
          barWidth="66%"
        />
        <StatCard
          icon={BookOpen}
          label="书籍作品"
          value={`${bookTotal} 本`}
          subLabel="已完成"
          subValue={bookTotal > 0 ? String(bookTotal) : undefined}
          iconBg="bg-green-100 text-green-500"
          barColor="bg-green-500"
          barWidth={bookTotal > 0 ? "100%" : "20%"}
        />
        <StatCard
          icon={Eye}
          label="今日阅读"
          value="—"
          subLabel="总阅读量"
          subValue="统计即将上线"
          iconBg="bg-purple-100 text-purple-500"
          barColor="bg-purple-500"
          barWidth="45%"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 快速创作 */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-800">快速创作</h2>
            <p className="text-sm text-gray-600">开始新的博客或书籍项目</p>
          </div>
          <div className="space-y-4 p-6">
            <Link
              href="/editblog"
              className="content-card flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">写博客</h3>
                <p className="text-sm text-gray-500">发布技术文章与实践经验</p>
              </div>
            </Link>
            <Link
              href="/editbook/new"
              className="content-card flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">写书籍</h3>
                <p className="text-sm text-gray-500">创建结构化章节与目录</p>
              </div>
            </Link>
            <Link
              href="/edittopic"
              className="content-card flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">发话题</h3>
                <p className="text-sm text-gray-500">在社区发起技术讨论</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 右侧：近期博客 + 书籍 */}
        <div className="space-y-8">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">近期博客</h2>
              <Link href="/editblog" className="text-sm text-indigo-600 hover:underline">
                查看全部
              </Link>
            </div>
            <div className="space-y-4 p-6">
              {blogs.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">暂无博客，点击左侧开始创作</p>
              ) : (
                blogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="content-card rounded-lg border border-gray-200 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {blog.data.coverUrl ? (
                          <Image
                            src={`${uploadpath}${blog.data.coverUrl}`}
                            alt=""
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <FileText className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold text-gray-800">{blog.data.title ?? "未命名"}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {blog.labels?.[0] ?? "技术"} · {blog.servertimestamp?.split("T")[0] ?? ""}
                        </p>
                      </div>
                      <span className="shrink-0 self-start rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                        已发布
                      </span>
                    </div>
                    <div className="mt-3 flex gap-4">
                      <Link
                        href={`/editblog?blogid=${blog.id}`}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
                      >
                        <Edit3 className="mr-1 h-3.5 w-3.5" /> 编辑
                      </Link>
                      <button type="button" disabled className="inline-flex items-center text-sm text-gray-400">
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> 删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">我的书籍</h2>
              <Link href="/editbook/new" className="text-sm text-indigo-600 hover:underline">
                新建书籍
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/editbook?bookid=${book.id}`}
                  className="content-card rounded-lg border border-gray-200 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex gap-3">
                    <div className="book-cover h-20 w-16 shrink-0 overflow-hidden rounded shadow-sm">
                      {book.data.coverImgurl ? (
                        <Image
                          src={`${uploadpath}${book.data.coverImgurl}`}
                          alt=""
                          width={64}
                          height={80}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-bold text-gray-800">{book.data.title ?? "未命名"}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {book.labels?.[0] ?? "未分类"} · {book.servertimestamp?.split("T")[0] ?? ""}
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div className="h-1.5 w-full rounded-full bg-green-500" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              <Link
                href="/editbook/new"
                className="content-card flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-gray-300 p-4 text-gray-400 transition-all hover:border-indigo-400 hover:text-indigo-600"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-current">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-sm">新建书籍</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
