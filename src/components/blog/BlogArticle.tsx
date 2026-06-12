"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Eye, Heart, MessageCircle } from "lucide-react";
import MarkdownContent from "@/components/markdown/MarkdownContent";
import BlogDivider from "@/components/blog/BlogDivider";
import { extractHeadings } from "@/lib/markdown/toc";
import { uploadpath } from "@/lib/config";
import { recordBrowseView } from "@/lib/browselog";
import type { EventStoreItem, UserProfile } from "@/lib/types/events";

const TAG_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-green-100", text: "text-green-800" },
  { bg: "bg-yellow-100", text: "text-yellow-800" },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-orange-100", text: "text-orange-800" },
  { bg: "bg-pink-100", text: "text-pink-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
];

interface BlogArticleProps {
  blog: EventStoreItem;
  author?: UserProfile;
  viewCount?: number;
}

function TocNav({
  headings,
  activeId,
  className = "",
  onItemClick,
}: {
  headings: ReturnType<typeof extractHeadings>;
  activeId: string;
  className?: string;
  onItemClick?: () => void;
}) {
  return (
    <nav className={className}>
      <ul className="space-y-1.5">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 10}px` }}>
            <a
              href={`#${h.id}`}
              onClick={onItemClick}
              className={`block rounded-md px-2 py-1 text-sm leading-snug transition-colors ${
                activeId === h.id
                  ? "bg-indigo-50 font-medium text-indigo-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function BlogArticle({ blog, author, viewCount = 0 }: BlogArticleProps) {
  const content = typeof blog.data.content === "string" ? blog.data.content : "";
  const title = blog.data.title ?? "无标题";
  const coverUrl = blog.data.coverUrl ? `${uploadpath}${blog.data.coverUrl}` : null;
  const avatarUrl = author?.data.avatarUrl ? `${uploadpath}${author.data.avatarUrl}` : null;
  const date = blog.servertimestamp?.split("T")[0] ?? "";
  const [displayViewCount, setDisplayViewCount] = useState(viewCount);

  useEffect(() => {
    setDisplayViewCount(viewCount);
  }, [viewCount]);

  useEffect(() => {
    if (!blog.id) return;
    recordBrowseView(blog.id);
    setDisplayViewCount((n) => n + 1);
  }, [blog.id]);

  const headings = useMemo(() => extractHeadings(content), [content]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="blog-main-container container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="blog-content-container min-w-0 flex-1">
        {/* 面包屑 */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="transition-colors hover:text-indigo-600">
            首页
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link href="/blogs" className="transition-colors hover:text-indigo-600">
            博客
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1 text-gray-700">{title}</span>
        </nav>

        {/* 标题区 */}
        <div className="mb-6 flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
          <div className="shrink-0">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={title}
                width={112}
                height={112}
                className="h-24 w-24 rounded-xl object-cover shadow-md ring-1 ring-gray-100 sm:h-28 sm:w-28"
                unoptimized
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-sm text-gray-400 ring-1 ring-gray-100 sm:h-28 sm:w-28">
                无封面
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="blog-article-title mb-4">{title}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={author?.data.displayName ?? "作者"}
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {(author?.data.displayName ?? "U")[0]}
                  </div>
                )}
                <span className="ml-2 font-medium text-gray-700">
                  {author?.data.displayName ?? "未知作者"}
                </span>
              </div>
              {date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <time dateTime={blog.servertimestamp}>{date}</time>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-emerald-500" />
                {displayViewCount} 次阅读
              </span>
            </div>
          </div>
        </div>

        {blog.labels && blog.labels.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {blog.labels.slice(0, 5).map((label, index) => {
              const c = TAG_COLORS[index % TAG_COLORS.length];
              return (
                <span
                  key={label}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* 移动端目录 */}
        {headings.length > 0 && (
          <details className="group mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:hidden">
            <summary className="cursor-pointer list-none text-sm font-semibold text-gray-800 marker:content-none">
              <span className="flex items-center justify-between">
                文章目录
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </span>
            </summary>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <TocNav headings={headings} activeId={activeId} />
            </div>
          </details>
        )}

        {/* 正文 */}
        <div className="mb-8 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-gray-100">
          <div className="px-4 pt-5 md:px-6">
            <BlogDivider variant="top" />
          </div>
          <div className="px-4 py-3 md:px-8 md:py-4">
            {content ? (
              <MarkdownContent content={content} />
            ) : (
              <p className="py-10 text-center text-gray-500">暂无博客内容</p>
            )}
          </div>
          <div className="px-4 pb-5 md:px-6">
            <BlogDivider variant="bottom" />
          </div>
        </div>

        {/* 点赞 */}
        <div className="mb-8 flex items-center justify-center rounded-xl bg-white py-5 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
          <button
            type="button"
            disabled
            className="flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-8 py-2.5 text-slate-500"
            title="登录后可点赞"
          >
            <Heart className="h-5 w-5" />
            <span className="font-semibold">0</span>
            <span className="text-sm">点赞</span>
          </button>
        </div>

        {/* 评论 */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
          <h3 className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3 text-lg font-bold text-slate-800">
            评论区
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
              0
            </span>
          </h3>
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 py-8 text-center text-gray-600">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm">还没有评论，快来抢沙发吧~</p>
            <p className="mt-2 text-xs text-gray-400">
              <Link href="/login" className="font-medium text-indigo-600 hover:underline">
                登录
              </Link>
              {" "}后可发表评论
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <Link
            href="/blogs"
            className="inline-flex items-center text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            ← 返回博客列表
          </Link>
        </div>
      </div>

      {/* 桌面端右侧 TOC — sticky 随页面滚动保持可见 */}
      {headings.length > 0 && (
        <aside className="right-toc-container hidden w-56 lg:block xl:w-64">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-slate-800">
              文章目录
            </p>
            <TocNav headings={headings} activeId={activeId} />
          </div>
        </aside>
      )}
    </div>
  );
}
