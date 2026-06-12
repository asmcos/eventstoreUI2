"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Eye, FileText, Plus } from "lucide-react";
import { uploadpath } from "@/lib/config";

interface BlogListItem {
  id: string;
  title: string;
  coverUrl?: string;
}

interface BlogListSidebarProps {
  blogs: BlogListItem[];
  activeId?: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onSelect: (blogId: string) => void;
  onNew: () => void;
}

const BORDER_COLORS = ["#60a5fa", "#a78bfa", "#22d3ee", "#86efac", "#fda4af"];

export default function BlogListSidebar({
  blogs,
  activeId,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onSelect,
  onNew,
}: BlogListSidebarProps) {
  return (
    <div className="sticky top-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">我的博客</h3>
        <span className="text-xs text-gray-500">共 {totalCount} 篇</span>
      </div>

      <button
        type="button"
        onClick={onNew}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
      >
        <Plus className="h-4 w-4" /> 新建博客
      </button>

      <div className="space-y-2">
        {blogs.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">暂无博客，点击上方新建</p>
        ) : (
          blogs.map((blog, i) => (
            <button
              key={blog.id}
              type="button"
              onClick={() => onSelect(blog.id)}
              className={`w-full rounded-xl border-l-4 bg-white p-3 text-left shadow-sm transition hover:shadow-md ${
                activeId === blog.id ? "ring-2 ring-indigo-200" : ""
              }`}
              style={{ borderLeftColor: BORDER_COLORS[i % BORDER_COLORS.length] }}
            >
              <div className="flex gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {blog.coverUrl ? (
                    <Image
                      src={`${uploadpath}${blog.coverUrl}`}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <FileText className="absolute inset-0 m-auto h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-gray-800">
                    {blog.title || "未命名"}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex items-center gap-1 text-gray-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> 上一页
          </button>
          <span className="text-gray-500">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex items-center gap-1 text-gray-600 disabled:opacity-40"
          >
            下一页 <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {activeId && (
        <Link
          href={`/blogs/${activeId}`}
          target="_blank"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" /> 预览当前文章
        </Link>
      )}
    </div>
  );
}
