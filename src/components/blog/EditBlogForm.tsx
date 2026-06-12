"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Save, Send, X } from "lucide-react";
import SimpleMDEEditor, { type SimpleMDERef } from "@/components/editor/SimpleMDEEditor";
import { getKey } from "@/lib/auth/keys";
import { uploadpath } from "@/lib/config";
import { saveBlog } from "@/lib/esclient/wrap";
import { showNotification } from "@/lib/notify";
import { fileToUint8Array, uploadFile } from "@/lib/upload/clientUpload";

export interface BlogFormData {
  title: string;
  content: string;
  coverUrl: string;
  labels: string[];
  blogId?: string;
}

interface EditBlogFormProps {
  blogId?: string | null;
  initialData: BlogFormData;
  editorKey: string;
  onSaveSuccess: (blogId: string) => void;
}

const TAG_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
];

export default function EditBlogForm({
  blogId,
  initialData,
  editorKey,
  onSaveSuccess,
}: EditBlogFormProps) {
  const editorRef = useRef<SimpleMDERef>(null);
  const [title, setTitle] = useState(initialData.title);
  const [labels, setLabels] = useState<string[]>(initialData.labels ?? []);
  const [coverUrl, setCoverUrl] = useState(initialData.coverUrl ?? "");
  const [coverData, setCoverData] = useState<Uint8Array | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);

  const uploadImage = useCallback(async (file: File | Blob, filename?: string) => {
    const { Keypriv, Keypub } = getKey();
    if (!Keypriv || !Keypub) {
      showNotification("请先登录", "warning");
      return null;
    }
    try {
      const data = await fileToUint8Array(file);
      const result = await uploadFile(
        filename ?? (file instanceof File ? file.name : "paste.png"),
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

  const handleCoverFile = async (file: File) => {
    const data = await fileToUint8Array(file);
    setCoverData(data);
    setCoverUrl("");
    setCoverPreview(URL.createObjectURL(file));
    showNotification("封面已准备好", "info");
  };

  const handleCoverPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.includes("image")) {
        const blob = item.getAsFile();
        if (blob) {
          e.preventDefault();
          await handleCoverFile(blob as File);
          break;
        }
      }
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag) setLabels((prev) => [...prev, tag]);
    setNewTag("");
    setShowTagInput(false);
  };

  const handleSave = async (isPublish: boolean) => {
    const { Keypriv, Keypub } = getKey();
    if (!Keypriv || !Keypub) {
      showNotification("请先登录", "warning");
      return;
    }

    const content = editorRef.current?.getValue() ?? "";
    if (!title.trim()) {
      showNotification("请输入文章标题", "warning");
      return;
    }

    setSaving(true);
    try {
      let finalCoverUrl = coverUrl;
      if (coverData) {
        const result = await uploadFile(`cover-${Date.now()}.png`, coverData, Keypub, Keypriv);
        finalCoverUrl = result.fileUrl ?? "";
      }

      const payload: Record<string, unknown> = {
        title: title.trim(),
        content,
        coverUrl: finalCoverUrl,
        labels,
        isPublished: isPublish,
        updatedAt: new Date().toISOString(),
      };
      if (blogId) payload.blogId = blogId;

      const result = await saveBlog(payload, Keypub, Keypriv);
      if (result.code === 200) {
        showNotification(isPublish ? "文章发布成功" : "草稿保存成功", "success");
        onSaveSuccess(result.id ?? blogId ?? "");
      } else {
        showNotification("保存失败", "error");
      }
    } catch {
      showNotification("保存出错", "error");
    } finally {
      setSaving(false);
    }
  };

  const displayCover =
    coverPreview ?? (coverUrl ? `${uploadpath}${coverUrl}` : null);

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {blogId ? "编辑博客" : "创作新博客"}
        </h2>
        <p className="text-sm text-gray-500">撰写并发布 Markdown 博客文章</p>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">文章标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">文章标签</label>
          <div className="flex flex-wrap items-center gap-2">
            {labels.slice(0, 5).map((label, i) => (
              <span
                key={`${label}-${i}`}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {label}
                <button
                  type="button"
                  onClick={() => setLabels((prev) => prev.filter((_, idx) => idx !== i))}
                  className="opacity-70 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {labels.length > 5 && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                +{labels.length - 5}
              </span>
            )}
            {!showTagInput ? (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="text-xs text-indigo-600 hover:underline"
              >
                + 添加标签
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTag();
                    if (e.key === "Escape") setShowTagInput(false);
                  }}
                  placeholder="输入标签..."
                  className="w-28 rounded border border-gray-300 px-2 py-1 text-xs"
                  autoFocus
                />
                <button type="button" onClick={addTag} className="text-xs text-indigo-600">
                  确认
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">文章封面</label>
          <div className="flex items-center gap-4">
            <div
              className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-indigo-400"
              onMouseEnter={() => setPasteHint(true)}
              onMouseLeave={() => setPasteHint(false)}
              onPaste={handleCoverPaste}
              tabIndex={0}
            >
              {displayCover ? (
                <Image src={displayCover} alt="封面" fill className="object-cover" unoptimized />
              ) : (
                <ImagePlus className="h-6 w-6 text-gray-400" />
              )}
              {pasteHint && (
                <div className="absolute -top-8 left-0 rounded bg-gray-800 px-2 py-0.5 text-xs whitespace-nowrap text-white">
                  可粘贴截图
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">
              上传封面
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCoverFile(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        <div className="simplemde-wrapper [&_.CodeMirror]:min-h-[320px] [&_.CodeMirror]:rounded-lg [&_.CodeMirror]:border [&_.CodeMirror]:border-gray-200 [&_.editor-toolbar]:rounded-t-lg">
          <SimpleMDEEditor
            key={editorKey}
            ref={editorRef}
            initialValue={initialData.content}
            onPasteImage={uploadImage}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存草稿
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-500 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            发布文章
          </button>
        </div>
      </div>
    </div>
  );
}
