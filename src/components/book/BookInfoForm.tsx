"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  CheckCircle,
  Loader2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { getKey } from "@/lib/auth/keys";
import { uploadpath } from "@/lib/config";
import { patchBook, saveBook } from "@/lib/esclient/wrap";
import { showNotification } from "@/lib/notify";
import { fileToUint8Array, uploadFile } from "@/lib/upload/clientUpload";
import { get_user_by_email, get_user_by_pubkeys } from "@/lib/esclient/esclient";
import { subscribeFirst } from "@/lib/esclient/promise";

export interface BookInfoState {
  title: string;
  author: string;
  coverImgurl: string;
  labels: string[];
}

interface CoAuthor {
  email: string;
  pubkey: string;
}

interface BookInfoFormProps {
  mode: "create" | "edit";
  bookId?: string | null;
  initial: BookInfoState;
  onSaved: (bookId: string) => void;
}

const TAG_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPubKey(pubKey: string): string | false {
  if (pubKey.startsWith("epub1")) return pubKey;
  if (/^[0-9a-fA-F]{64}$/.test(pubKey)) return pubKey;
  return false;
}

export default function BookInfoForm({
  mode,
  bookId = null,
  initial,
  onSaved,
}: BookInfoFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [author, setAuthor] = useState(initial.author);
  const [coverUrl, setCoverUrl] = useState(initial.coverImgurl);
  const [coverData, setCoverData] = useState<Uint8Array | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>(initial.labels);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  const [showCoAuthorInput, setShowCoAuthorInput] = useState(false);
  const [newCoAuthor, setNewCoAuthor] = useState("");
  const [coverHover, setCoverHover] = useState(false);
  const [saving, setSaving] = useState(false);
  const coverHoverRef = useRef(false);
  const coverFocusedRef = useRef(false);
  const coverPreviewRef = useRef<string | null>(null);

  const displayCover = coverPreview ?? (coverUrl ? `${uploadpath}${coverUrl}` : null);

  const applyCoverFile = async (file: File | Blob) => {
    if (coverPreviewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreviewRef.current);
    }
    const preview = URL.createObjectURL(file);
    coverPreviewRef.current = preview;
    setCoverData(await fileToUint8Array(file));
    setCoverUrl("");
    setCoverPreview(preview);
    showNotification("封面已准备好", "info");
  };

  const pasteCoverFromClipboard = async (clipboardData: DataTransfer | null) => {
    if (!clipboardData) return false;

    const items = clipboardData.items;
    if (items) {
      for (const item of items) {
        if (item.kind === "file" && item.type.includes("image")) {
          const blob = item.getAsFile();
          if (blob) {
            await applyCoverFile(blob);
            return true;
          }
        }
      }
    }

    const files = clipboardData.files;
    if (files?.length) {
      for (const file of files) {
        if (file.type.includes("image")) {
          await applyCoverFile(file);
          return true;
        }
      }
    }

    return false;
  };

  useEffect(() => {
    coverHoverRef.current = coverHover;
  }, [coverHover]);

  useEffect(() => {
    const onDocumentPaste = (e: ClipboardEvent) => {
      if (!coverHoverRef.current && !coverFocusedRef.current) return;
      void pasteCoverFromClipboard(e.clipboardData).then((pasted) => {
        if (pasted) {
          e.preventDefault();
          showNotification("已粘贴图片作为封面", "success");
        }
      });
    };

    document.addEventListener("paste", onDocumentPaste);
    return () => {
      document.removeEventListener("paste", onDocumentPaste);
      if (coverPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreviewRef.current);
      }
    };
  }, []);

  const addTag = () => {
    if (newTag.trim()) setLabels((prev) => [...prev, newTag.trim()]);
    setNewTag("");
    setShowTagInput(false);
  };

  const addCoAuthor = async () => {
    const input = newCoAuthor.trim();
    if (!input) return;

    try {
      let user: { email?: string; pubkey?: string } | null = null;

      if (isValidEmail(input)) {
        user = await subscribeFirst<{ email?: string; pubkey?: string }>((cb) =>
          get_user_by_email(input, cb)
        );
      } else {
        const pk = isValidPubKey(input);
        if (!pk) {
          showNotification("请输入有效的邮箱地址或 PubKey", "error");
          return;
        }
        user = await subscribeFirst<{ email?: string; pubkey?: string }>((cb) =>
          get_user_by_pubkeys([pk], cb)
        );
      }

      if (!user?.pubkey) {
        showNotification("没找到用户", "error");
        return;
      }

      if (coAuthors.some((a) => a.pubkey === user!.pubkey)) {
        showNotification("该联合作者已存在", "error");
        return;
      }

      setCoAuthors((prev) => [
        ...prev,
        { email: user!.email ?? input, pubkey: user!.pubkey! },
      ]);
      setNewCoAuthor("");
      setShowCoAuthorInput(false);
      showNotification("联合作者添加成功", "success");
    } catch {
      showNotification("添加联合作者失败", "error");
    }
  };

  const handleSave = async () => {
    const { Keypriv, Keypub } = getKey();
    if (!Keypriv || !Keypub) {
      showNotification("请先登录", "warning");
      return;
    }
    if (!title.trim() || !author.trim() || (!coverUrl && !coverData)) {
      showNotification("请填写完整的作者、标题和封面", "error");
      return;
    }

    setSaving(true);
    try {
      let finalCover = coverUrl;
      if (coverData) {
        showNotification("正在上传封面…", "info");
        const result = await uploadFile("coverimg.png", coverData, Keypub, Keypriv);
        finalCover = result.fileUrl ?? "";
      }

      const bookInfo: Record<string, unknown> = {
        title: title.trim(),
        author: author.trim(),
        coverImgurl: finalCover,
        labels,
        coAuthors: coAuthors.map((a) => a.pubkey),
      };

      if (mode === "edit" && bookId) {
        const result = await patchBook(bookInfo, bookId, Keypub, Keypriv);
        if (result.code === 200) {
          showNotification("书籍信息已更新", "success");
          onSaved(bookId);
        } else {
          showNotification(result.message ?? "更新失败", "error");
        }
      } else {
        const result = await saveBook(bookInfo, Keypub, Keypriv);
        if (result.code === 200 && result.id) {
          showNotification("书籍创建成功！确认后编辑大纲", "success");
          onSaved(result.id);
        } else {
          showNotification("创建失败", "error");
        }
      }
    } catch {
      showNotification("保存出错", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
          <BookOpen className="mr-2 h-5 w-5 text-indigo-600" />
          书籍封面
        </h2>
        <div className="flex flex-col items-center">
          <div
            className="relative mb-4 h-80 w-80 outline-none"
            onMouseEnter={() => setCoverHover(true)}
            onMouseLeave={() => setCoverHover(false)}
            onFocus={() => {
              coverFocusedRef.current = true;
            }}
            onBlur={() => {
              coverFocusedRef.current = false;
            }}
            onClick={(e) => e.currentTarget.focus()}
            tabIndex={0}
            role="button"
            aria-label="书籍封面，可上传或粘贴图片"
          >
            {displayCover ? (
              <div className="editbook-book-cover relative h-full w-full overflow-hidden rounded-xl cursor-pointer">
                <Image
                  src={displayCover}
                  alt="书籍封面"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="editbook-book-cover flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-center text-white shadow-xl">
                <h3 className="mb-2 text-xl font-bold">点击上传封面</h3>
                <p className="text-md opacity-90">或者粘贴截图</p>
              </div>
            )}
            {coverHover && (
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white">
                {displayCover ? "Ctrl+V 粘贴替换封面" : "Ctrl+V 粘贴截图"}
              </div>
            )}
          </div>

          <div className="w-80">
            <label className="editbook-btn-hover flex w-full cursor-pointer items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm transition hover:bg-gray-200">
              <Upload className="mr-2 h-4 w-4" />
              选择图片文件
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await applyCoverFile(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            书籍标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入书籍标题"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            作者 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="作者姓名"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">联合作者</label>
          <div className="space-y-2">
            {coAuthors.map((coAuthor, index) => (
              <div
                key={coAuthor.pubkey}
                className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 transition hover:bg-slate-50"
              >
                <span className="flex-1 text-sm font-medium">{coAuthor.email}</span>
                <button
                  type="button"
                  onClick={() => setCoAuthors((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded p-1 text-red-500 transition hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {!showCoAuthorInput ? (
              <button
                type="button"
                onClick={() => setShowCoAuthorInput(true)}
                className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition hover:border-indigo-500 hover:text-indigo-600"
              >
                <UserPlus className="mr-2 h-4 w-4" /> 添加联合作者
              </button>
            ) : (
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <UserPlus className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newCoAuthor}
                    onChange={(e) => setNewCoAuthor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void addCoAuthor();
                      if (e.key === "Escape") setShowCoAuthorInput(false);
                    }}
                    placeholder="输入联合作者邮箱或 pubkey"
                    className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-8 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void addCoAuthor()}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCoAuthorInput(false);
                    setNewCoAuthor("");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">书籍标签</label>
          <div className="flex flex-wrap gap-2">
            {labels.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className={`flex items-center rounded-full px-3 py-2 text-sm font-medium ${TAG_COLORS[index % TAG_COLORS.length]}`}
              >
                {tag}
                <button
                  type="button"
                  className="ml-2 opacity-70 hover:scale-110 hover:opacity-100"
                  onClick={() => setLabels((prev) => prev.filter((_, i) => i !== index))}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {!showTagInput ? (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="rounded-full border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-indigo-500 hover:text-indigo-600"
              >
                + 添加标签
              </button>
            ) : (
              <div className="flex w-full items-center gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTag();
                    if (e.key === "Escape") setShowTagInput(false);
                  }}
                  placeholder="输入标签..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
                >
                  确认
                </button>
                <button
                  type="button"
                  onClick={() => setShowTagInput(false)}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="editbook-btn-hover flex w-full items-center justify-center rounded-lg bg-violet-500 px-4 py-3 text-sm font-medium text-white shadow-md transition hover:bg-violet-600 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          {mode === "create" ? "创建书籍" : "保存书籍信息"}
        </button>

        {mode === "create" && (
          <button
            type="button"
            onClick={() => router.push("/creator")}
            className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            取消，返回创作中心
          </button>
        )}
      </div>
    </div>
  );
}
