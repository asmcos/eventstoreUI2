"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ListTree } from "lucide-react";
import BookInfoForm from "@/components/book/BookInfoForm";
import "@/styles/editbook.css";

const EMPTY_BOOK = { title: "", author: "", coverImgurl: "", labels: [] as string[] };

export default function NewBookClient() {
  const router = useRouter();

  const handleCreated = (bookId: string) => {
    router.push(`/editbook?bookid=${encodeURIComponent(bookId)}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-1 py-2">
      <Link
        href="/creator"
        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> 返回创作中心
      </Link>

      <div className="editbook-seamless">
        {/* 左侧 — 创作中心导航（原版布局） */}
        <aside className="editbook-left">
          <div className="border-b border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">创作中心</h2>
            <div className="space-y-2">
              <div className="editbook-left-menu-item active rounded-lg p-3">
                <div className="flex items-center">
                  <BookOpen className="mr-3 h-5 w-5 shrink-0" />
                  <div>
                    <div className="font-medium">书籍信息</div>
                    <div className="mt-1 text-xs text-gray-500">设置书名、作者、封面等</div>
                  </div>
                </div>
              </div>
              <div className="editbook-left-menu-item rounded-lg p-3 opacity-50">
                <div className="flex items-center">
                  <ListTree className="mr-3 h-5 w-5 shrink-0" />
                  <div>
                    <div className="font-medium">目录大纲</div>
                    <div className="mt-1 text-xs text-gray-500">创建书籍后可编辑章节</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 text-sm text-gray-500">
            <p className="leading-relaxed">
              填写右侧书籍信息后点击「创建书籍」，系统将跳转到编辑器，您可继续编辑目录与章节内容。
            </p>
          </div>
        </aside>

        {/* 右侧 — 书籍信息表单 */}
        <div className="editbook-right">
          <div className="editbook-content-panel rounded-lg bg-white shadow-sm">
            <BookInfoForm mode="create" initial={EMPTY_BOOK} onSaved={handleCreated} />
          </div>
        </div>
      </div>
    </div>
  );
}
