"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Heart, Link2, Loader2, Menu, MessageCircle, Send, X } from "lucide-react";
import MarkdownContent from "@/components/markdown/MarkdownContent";
import BookOutlineTree from "@/components/book/BookOutlineTree";
import { extractHeadings, countChapters } from "@/lib/markdown/toc";
import { BOOK_CHAPTER_QUERY, bookChapterHref, normalizeChapterId } from "@/lib/book/outline";
import type { OutlineItem } from "@/lib/types/book";

interface BookReaderProps {
  shortBookId: string;
  title: string;
  authorName: string;
  outline: OutlineItem[];
  initialChapterId: string | null;
  initialContent: string;
}

export default function BookReader({
  shortBookId,
  title,
  authorName,
  outline,
  initialChapterId,
  initialContent,
}: BookReaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chapterFromUrl = searchParams.get(BOOK_CHAPTER_QUERY);

  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    initialChapterId ? normalizeChapterId(initialChapterId) : null
  );
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [copied, setCopied] = useState(false);

  const chapterCount = useMemo(() => countChapters(outline), [outline]);
  const headings = useMemo(() => extractHeadings(content), [content]);

  const updateChapterUrl = useCallback(
    (chapterId: string | number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(BOOK_CHAPTER_QUERY, normalizeChapterId(chapterId));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const loadChapter = useCallback(
    async (chapterId: string | number, options?: { syncUrl?: boolean }) => {
      const normalizedId = normalizeChapterId(chapterId);
      const shouldSyncUrl = options?.syncUrl !== false;

      if (normalizedId === activeChapterId && content) {
        if (shouldSyncUrl && chapterFromUrl !== normalizedId) {
          updateChapterUrl(normalizedId);
        }
        return;
      }

      setLoading(true);
      setActiveChapterId(normalizedId);

      if (shouldSyncUrl) {
        updateChapterUrl(normalizedId);
      }

      try {
        const res = await fetch(
          `/api/books/${shortBookId}/chapters/${encodeURIComponent(normalizedId)}`
        );
        if (!res.ok) throw new Error("加载失败");
        const data = (await res.json()) as { content: string };
        setContent(data.content ?? "");
      } catch {
        setContent("章节加载失败，请稍后重试。");
      } finally {
        setLoading(false);
        setMobileOpen(false);
      }
    },
    [shortBookId, activeChapterId, content, chapterFromUrl, updateChapterUrl]
  );

  // URL 带 chapter 时：SSR 已匹配则直接用；否则客户端补拉（兼容旧链接 / 数字 id）
  useEffect(() => {
    if (!chapterFromUrl) return;
    const urlId = normalizeChapterId(chapterFromUrl);
    if (urlId === activeChapterId && content) return;
    loadChapter(urlId, { syncUrl: false });
  }, [chapterFromUrl, activeChapterId, content, loadChapter]);

  const shareUrl =
    typeof window !== "undefined" && activeChapterId
      ? `${window.location.origin}${bookChapterHref(shortBookId, activeChapterId)}`
      : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const sidebar = (
    <>
      <div className="book-meta mb-6 rounded-2xl border border-white/90 bg-white/95 p-4 shadow-lg backdrop-blur-md">
        <h1 className="book-title mb-2 flex items-start gap-1 text-xl font-bold leading-snug text-slate-800">
          <span className="text-lg text-purple-600">《</span>
          <span className="line-clamp-3">{title}</span>
          <span className="text-lg text-purple-600">》</span>
        </h1>
        <p className="book-author flex items-center gap-2 text-sm text-slate-600">
          <span className="author-dot" />
          <span className="text-slate-500">作者:</span>
          <span className="font-medium text-slate-700">{authorName || "未知"}</span>
        </p>
        <div className="mt-4 h-px bg-gradient-to-r from-purple-300 via-blue-200 to-transparent" />
        {chapterCount > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            共 <span className="font-medium text-purple-600">{chapterCount}</span> 个章节
          </p>
        )}
      </div>

      <div className="book-outline">
        <h2 className="mb-4 flex items-center gap-2 border-b-2 border-indigo-500/15 pb-2 text-lg font-semibold text-slate-800">
          目录
        </h2>
        {outline.length > 0 ? (
          <BookOutlineTree
            items={outline}
            activeId={activeChapterId}
            onSelect={(item) => loadChapter(item.id)}
          />
        ) : (
          <p className="empty-outline rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400">
            本书暂无目录
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="book-view-container flex min-h-screen w-full bg-white">
      <button
        type="button"
        className="fixed top-4 left-4 z-[100] flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="打开目录"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`book-sidebar fixed top-0 left-0 z-[1000] h-full w-[85%] max-w-sm overflow-y-auto bg-white p-6 shadow-xl transition-transform md:static md:z-auto md:flex md:w-[340px] md:shrink-0 md:translate-x-0 md:flex-col md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/books"
            className="back-home-btn inline-flex items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Link>
          <button type="button" className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {sidebar}
      </aside>

      <main className="book-content relative flex-1 overflow-y-auto px-4 pt-16 pb-32 md:px-12 md:pt-8 md:pb-24">
        {activeChapterId && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
              title="复制本章链接"
            >
              <Link2 className="h-3.5 w-3.5" />
              {copied ? "已复制链接" : "分享本章"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-slate-500">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-600" />
            <p>章节内容加载中...</p>
          </div>
        ) : content ? (
          <MarkdownContent content={content} />
        ) : outline.length > 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
            <p>请从左侧目录选择章节开始阅读</p>
          </div>
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
            <p>本书暂无内容</p>
          </div>
        )}

        <div className="content-divider my-10 flex items-center gap-4 px-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
          <span className="rounded-xl bg-slate-50 px-3 py-1 text-sm text-slate-400">评论区</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
          <MessageCircle className="mx-auto mb-2 h-8 w-8" />
          <p>暂无评论，快来抢沙发~</p>
        </div>

        <div className="interactive-wrapper sticky bottom-5 z-20 mt-8 flex justify-end">
          <div className="interactive-controls flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md">
            <button
              type="button"
              disabled
              className="interact-item flex items-center gap-1 text-slate-500"
              title="登录后可点赞"
            >
              <Heart className="h-5 w-5" />
              <span className="text-sm font-semibold">0</span>
            </button>
            <button
              type="button"
              onClick={() => setShowComment(!showComment)}
              className="interact-item flex items-center gap-1 text-slate-500 hover:text-blue-500"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">0</span>
            </button>
            {showComment && (
              <div className="flex items-center gap-2 pl-2">
                <input
                  type="text"
                  placeholder="写下评论..."
                  disabled
                  className="w-48 rounded-lg border border-violet-200 px-3 py-1.5 text-sm outline-none focus:border-violet-400"
                />
                <button
                  type="button"
                  disabled
                  className="rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 p-2 text-white opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {headings.length > 0 && (
        <aside className="right-toc-container hidden w-[280px] shrink-0 overflow-y-auto border-l border-slate-100 bg-white/95 py-6 pl-4 backdrop-blur-md xl:block">
          <p className="mb-4 border-b-2 border-indigo-500/15 pb-3 text-lg font-semibold text-slate-800">
            章节导航
          </p>
          <nav className="space-y-1">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                style={{ paddingLeft: `${(h.level - 1) * 12 + 12}px` }}
                className="block border-r-[3px] border-transparent py-1.5 text-sm text-slate-500 transition-all hover:bg-indigo-50/50 hover:text-indigo-600"
              >
                {h.text}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
}
