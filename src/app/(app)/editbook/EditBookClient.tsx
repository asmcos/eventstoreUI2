"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FolderPlus,
  Loader2,
  Plus,
  Save,
  FileText,
} from "lucide-react";
import BookInfoForm, { type BookInfoState } from "@/components/book/BookInfoForm";
import EditableOutlineTree from "@/components/book/EditableOutlineTree";
import SimpleMDEEditor, { type SimpleMDERef } from "@/components/editor/SimpleMDEEditor";
import { normalizeOutlineItems, normalizeChapterId } from "@/lib/book/outline";
import {
  cloneOutline,
  DEFAULT_OUTLINE,
  findItemById,
  findItemParentAndIndex,
  nextOutlineId,
  reorderOutline,
  type DragPosition,
} from "@/lib/book/outline-edit";
import { getKey } from "@/lib/auth/keys";
import { uploadpath } from "@/lib/config";
import {
  fetchBookByIdClient,
  fetchChapterByAuthor,
  saveChapter,
} from "@/lib/esclient/wrap";
import { showNotification } from "@/lib/notify";
import { getTagValue } from "@/lib/utils/ids";
import { fileToUint8Array, uploadFile } from "@/lib/upload/clientUpload";
import type { OutlineItem } from "@/lib/types/book";
import "@/styles/editbook.css";

type ActiveMenu = "bookInfo" | "chapterEdit";

const EMPTY_BOOK: BookInfoState = { title: "", author: "", coverImgurl: "", labels: [] };

export default function EditBookClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookIdParam = searchParams.get("bookid");

  const editorRef = useRef<SimpleMDERef>(null);
  const skipEditorChangeRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [bookId, setBookId] = useState<string | null>(bookIdParam);
  const [rawBookId, setRawBookId] = useState<string | null>(null);
  const [authorPubkey, setAuthorPubkey] = useState<string>("");
  const [bookInfo, setBookInfo] = useState<BookInfoState>(EMPTY_BOOK);
  const [outline, setOutline] = useState<OutlineItem[]>(DEFAULT_OUTLINE);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>("bookInfo");
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const [savingOutline, setSavingOutline] = useState(false);
  const [draggedItem, setDraggedItem] = useState<OutlineItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<OutlineItem | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<DragPosition | null>(null);

  const uploadImage = useCallback(async (file: File | Blob) => {
    const { Keypriv, Keypub } = getKey();
    if (!Keypriv || !Keypub) return null;
    try {
      const data = await fileToUint8Array(file);
      const result = await uploadFile(
        file instanceof File ? file.name : "paste.png",
        data,
        Keypub,
        Keypriv
      );
      return `${uploadpath}${result.fileUrl}`;
    } catch {
      showNotification("图片上传失败", "error");
      return null;
    }
  }, []);

  const loadBook = useCallback(async (id: string) => {
    const { Keypub } = getKey();
    if (!Keypub) return;

    const msg = await fetchBookByIdClient(id);
    if (!msg || msg.code !== 200) {
      showNotification("书籍加载失败", "error");
      return;
    }
    if (msg.user !== Keypub) {
      showNotification("你不是这本书的作者，无法编辑", "warning");
      return;
    }

    const rawData = msg.data;
    const data =
      typeof rawData === "string"
        ? (JSON.parse(rawData) as BookInfoState & { coverImgurl?: string })
        : ((rawData ?? {}) as BookInfoState & { coverImgurl?: string });
    const dTag = getTagValue(msg.tags as [string, string][] | undefined, "d") ?? id;
    setRawBookId(dTag);
    setAuthorPubkey(msg.user ?? Keypub);
    setBookInfo({
      title: data.title ?? "",
      author: data.author ?? "",
      coverImgurl: data.coverImgurl ?? "",
      labels: data.labels ?? [],
    });

    const outlineRaw = await fetchChapterByAuthor(dTag, "outline.md", msg.user ?? Keypub);
    if (outlineRaw) {
      try {
        setOutline(normalizeOutlineItems(JSON.parse(outlineRaw) as OutlineItem[]));
      } catch {
        setOutline(DEFAULT_OUTLINE);
      }
    }
  }, []);

  useEffect(() => {
    if (!bookIdParam) {
      router.replace("/editbook/new");
      return;
    }

    void (async () => {
      setLoading(true);
      setBookId(bookIdParam);
      await loadBook(bookIdParam);
      setLoading(false);
    })();
  }, [bookIdParam, loadBook, router]);

  // 章节内容加载完成后写入唯一编辑器实例（不 remount）
  useEffect(() => {
    if (!activeChapterId || loadingChapter) return;

    const applyContent = () => {
      editorRef.current?.setValue(chapterContent);
      skipEditorChangeRef.current = true;
    };

    if (editorRef.current?.isReady()) {
      applyContent();
      return;
    }

    const timer = window.setInterval(() => {
      if (editorRef.current?.isReady()) {
        applyContent();
        window.clearInterval(timer);
      }
    }, 30);

    return () => window.clearInterval(timer);
  }, [activeChapterId, chapterContent, loadingChapter]);

  const handleBookSaved = (id: string) => {
    void loadBook(id);
  };

  const handleSaveOutline = async () => {
    if (!bookId || !rawBookId) {
      showNotification("请先完善并保存书籍信息", "warning");
      return;
    }
    const { Keypriv, Keypub } = getKey();
    if (!Keypriv || !Keypub) return;

    setSavingOutline(true);
    try {
      const result = await saveChapter(
        rawBookId,
        JSON.stringify(outline, null, 2),
        "outline.md",
        Keypub,
        Keypriv
      );
      if (result.code === 200) {
        showNotification("大纲保存成功", "success");
      } else {
        showNotification("大纲保存失败", "error");
      }
    } finally {
      setSavingOutline(false);
    }
  };

  const switchChapter = async (item: OutlineItem) => {
    if (item.type === "folder") return;

    if (isUnsaved) {
      const choice = window.confirm("当前章节有未保存的修改，是否继续切换？（确定=放弃修改）");
      if (!choice) return;
    }

    if (!rawBookId || !authorPubkey) {
      showNotification("请先保存书籍信息", "warning");
      return;
    }

    const chapterId = normalizeChapterId(item.id);
    if (chapterId === activeChapterId && !loadingChapter) return;

    setActiveMenu("chapterEdit");
    setActiveChapterId(chapterId);
    setChapterTitle(item.title);
    setIsUnsaved(false);
    setLoadingChapter(true);

    try {
      const content = await fetchChapterByAuthor(rawBookId, item.id, authorPubkey);
      setChapterContent(content ?? "");
      skipEditorChangeRef.current = true;
    } catch {
      setChapterContent("");
      showNotification("章节加载失败", "error");
    } finally {
      setLoadingChapter(false);
    }
  };

  const handleSaveChapter = async () => {
    if (!rawBookId || !activeChapterId) {
      showNotification("请先选择章节", "warning");
      return;
    }
    const { Keypriv, Keypub } = getKey();
    if (!Keypriv || !Keypub) return;

    const content = editorRef.current?.getValue() ?? "";
    setSavingChapter(true);
    try {
      const result = await saveChapter(rawBookId, content, activeChapterId, Keypub, Keypriv);
      if (result.code === 200) {
        setIsUnsaved(false);
        showNotification("章节保存成功", "success");
      } else {
        showNotification("章节保存失败", "error");
      }
    } finally {
      setSavingChapter(false);
    }
  };

  const addChapter = () => {
    const id = String(nextOutlineId(outline));
    setOutline((prev) => [...prev, { id, title: "新建章节", type: "chapter" }]);
  };

  const addFolder = () => {
    const id = String(nextOutlineId(outline));
    setOutline((prev) => [
      ...prev,
      { id, title: "新建文件夹", type: "folder", children: [] },
    ]);
  };

  const handleRename = (item: OutlineItem) => {
    const newTitle = window.prompt("请输入新名称", item.title);
    if (!newTitle?.trim()) return;
    const updated = cloneOutline(outline);
    const target = findItemById(updated, item.id);
    if (target) {
      target.title = newTitle.trim();
      setOutline(updated);
      if (normalizeChapterId(item.id) === activeChapterId) {
        setChapterTitle(newTitle.trim());
      }
    }
  };

  const handleDragEnd = (dragged: OutlineItem, target: OutlineItem, position: DragPosition) => {
    setOutline((prev) => reorderOutline(prev, dragged, target, position));
  };

  const handleDelete = (item: OutlineItem) => {
    if (!window.confirm(`确定要删除「${item.title}」吗？`)) return;
    const updated = cloneOutline(outline);
    const { parent, index } = findItemParentAndIndex(updated, item.id);
    if (parent && index !== -1) {
      parent.splice(index, 1);
      setOutline(updated);
      if (normalizeChapterId(item.id) === activeChapterId) {
        setActiveChapterId(null);
        setChapterTitle("");
        setChapterContent("");
        skipEditorChangeRef.current = true;
        editorRef.current?.setValue("");
      }
    }
  };

  if (!bookIdParam) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-indigo-600" />
        跳转新建页面…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-indigo-600" />
        加载书籍编辑器…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-1 py-2">
      <Link
        href="/creator"
        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> 返回创作中心
      </Link>

      <div className="editbook-seamless">
        {/* 左侧 — 菜单 + 大纲（原版 seamless 布局） */}
        <aside className="editbook-left">
          <div className="border-b border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">创作中心</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveMenu("bookInfo")}
                className={`editbook-left-menu-item w-full rounded-lg p-3 text-left ${
                  activeMenu === "bookInfo" ? "active" : ""
                }`}
              >
                <div className="flex items-center">
                  <BookOpen className="mr-3 h-5 w-5 shrink-0" />
                  <div>
                    <div className="font-medium">书籍信息</div>
                    <div className="mt-1 text-xs text-gray-500">设置书名、作者、封面等</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveMenu("chapterEdit")}
                className={`editbook-left-menu-item w-full rounded-lg p-3 text-left ${
                  activeMenu === "chapterEdit" ? "active" : ""
                }`}
              >
                <div className="flex items-center">
                  <FileText className="mr-3 h-5 w-5 shrink-0" />
                  <div>
                    <div className="font-medium">章节编辑</div>
                    <div className="mt-1 text-xs text-gray-500">编辑章节 Markdown 内容</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="editbook-outline-scroll flex flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">书籍大纲</h3>
              <button
                type="button"
                disabled={savingOutline}
                onClick={handleSaveOutline}
                className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
              >
                {savingOutline ? "保存中…" : "保存大纲"}
              </button>
            </div>

            <EditableOutlineTree
              items={outline}
              activeId={activeChapterId}
              onSelectChapter={switchChapter}
              onRename={handleRename}
              onDelete={handleDelete}
              onDragEnd={handleDragEnd}
              draggedItem={draggedItem}
              dragOverItem={dragOverItem}
              dragOverPosition={dragOverPosition}
              onSetDraggedItem={setDraggedItem}
              onSetDragOver={(item, position) => {
                setDragOverItem(item);
                setDragOverPosition(position);
              }}
            />

            <div className="outline-actions-extra mt-3 flex gap-2 border-t border-dashed border-gray-200 pt-3">
              <button
                type="button"
                onClick={addChapter}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                <Plus className="h-3 w-3" /> 章节
              </button>
              <button
                type="button"
                onClick={addFolder}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                <FolderPlus className="h-3 w-3" /> 文件夹
              </button>
            </div>
          </div>
        </aside>

        {/* 右侧 — 内容区 */}
        <div className="editbook-right">
          {activeMenu === "bookInfo" && (
            <div className="editbook-content-panel bg-white">
              <BookInfoForm
                mode="edit"
                bookId={bookId}
                initial={bookInfo}
                onSaved={handleBookSaved}
              />
            </div>
          )}

          {activeMenu === "chapterEdit" && (
            <>
              <div className="editbook-editor-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center text-xl font-semibold">
                      <FileText className="mr-2 h-5 w-5" /> 内容编辑
                    </h2>
                    <h3 className="mt-1 text-lg font-medium opacity-90">
                      {chapterTitle || "选择大纲项进行编辑"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={savingChapter || !activeChapterId}
                    onClick={handleSaveChapter}
                    className="rounded-lg p-2 transition hover:bg-white/20 disabled:opacity-50"
                    title="保存章节"
                  >
                    {savingChapter ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2 text-sm text-gray-600">
                  <span>{isUnsaved ? "尚未保存" : "无需保存"}</span>
                  {bookId && (
                    <Link
                      href={`/books/${bookId}`}
                      target="_blank"
                      className="text-indigo-600 hover:underline"
                    >
                      预览书籍
                    </Link>
                  )}
                </div>

                <div className="relative flex-1 overflow-y-auto p-4">
                  {!activeChapterId ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-gray-400">
                      <BookOpen className="mb-4 h-12 w-12 opacity-50" />
                      <p>请从左侧大纲选择章节开始编辑</p>
                    </div>
                  ) : (
                    <>
                      {loadingChapter && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                          <Loader2 className="mr-2 h-6 w-6 animate-spin text-indigo-600" />
                          <span className="text-gray-500">章节加载中…</span>
                        </div>
                      )}
                      <div className="simplemde-wrapper [&_.CodeMirror]:min-h-[calc(100vh-22rem)]">
                        <SimpleMDEEditor
                          ref={editorRef}
                          onPasteImage={uploadImage}
                          onChange={() => {
                            if (skipEditorChangeRef.current) {
                              skipEditorChangeRef.current = false;
                              return;
                            }
                            setIsUnsaved(true);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
