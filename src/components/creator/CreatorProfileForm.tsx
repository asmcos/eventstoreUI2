"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Upload,
} from "lucide-react";
import {
  esecEncode,
  epubEncode,
} from "eventstore-tools/src/key";
import {
  get_user_by_pubkeys,
  get_user_profile,
  save_user_profile,
} from "@/lib/esclient/esclient";
import { getKey } from "@/lib/auth/keys";
import { uploadpath } from "@/lib/config";
import { showNotification } from "@/lib/notify";
import { fileToUint8Array, uploadFile } from "@/lib/upload/clientUpload";
import { subscribeFirst } from "@/lib/esclient/promise";

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='30' r='20' fill='%23cce5ff'/%3E%3Cpath d='M10 90C10 65 30 55 50 55C70 55 90 65 90 90' fill='%23b8daff'/%3E%3C/svg%3E";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.replace(/^0x/i, "");
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export default function CreatorProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<Uint8Array | null>(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const avatarHoverRef = useRef(false);
  const avatarPreviewRef = useRef<string | null>(null);

  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showKeyHint, setShowKeyHint] = useState(true);
  const keySectionRef = useRef<HTMLDivElement>(null);

  const [keyprivBin, setKeyprivBin] = useState("");
  const [keyprivBech32, setKeyprivBech32] = useState("");
  const [keypubBin, setKeypubBin] = useState("");
  const [keypubBech32, setKeypubBech32] = useState("");

  useEffect(() => {
    avatarHoverRef.current = avatarHover;
  }, [avatarHover]);

  const applyAvatarFile = useCallback(async (file: File | Blob) => {
    if (avatarPreviewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewRef.current);
    }
    const preview = URL.createObjectURL(file);
    avatarPreviewRef.current = preview;
    setAvatarData(await fileToUint8Array(file));
    setAvatarPreview(preview);
  }, []);

  const pasteAvatarFromClipboard = useCallback(
    async (clipboardData: DataTransfer | null) => {
      if (!clipboardData) return false;
      for (const item of clipboardData.items) {
        if (item.kind === "file" && item.type.includes("image")) {
          const blob = item.getAsFile();
          if (blob) {
            await applyAvatarFile(blob);
            return true;
          }
        }
      }
      return false;
    },
    [applyAvatarFile]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!avatarHoverRef.current) return;
      void pasteAvatarFromClipboard(e.clipboardData).then((pasted) => {
        if (pasted) {
          e.preventDefault();
          showNotification("头像已准备好", "info");
        }
      });
    };
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("paste", onPaste);
      if (avatarPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
    };
  }, [pasteAvatarFromClipboard]);

  useEffect(() => {
    const { Keypriv, Keypub } = getKey();
    if (!Keypriv || !Keypub) {
      setLoading(false);
      return;
    }

    setKeyprivBin(bytesToHex(Keypriv));
    setKeyprivBech32(esecEncode(Keypriv));
    setKeypubBin(Keypub);
    try {
      setKeypubBech32(epubEncode(hexToBytes(Keypub)));
    } catch {
      setKeypubBech32("");
    }

    void (async () => {
      const profileMsg = await subscribeFirst<{ code?: number; data?: string }>((cb) =>
        get_user_profile(Keypub, cb)
      );
      if (profileMsg?.code === 200 && profileMsg.data) {
        try {
          const data =
            typeof profileMsg.data === "string"
              ? JSON.parse(profileMsg.data)
              : profileMsg.data;
          setDisplayName(data.displayName ?? "");
          setTitle(data.title ?? "");
          setBio(data.bio ?? "");
          setAvatarUrl(data.avatarUrl ?? null);
        } catch {
          /* ignore */
        }
      }

      const userMsg = await subscribeFirst<{ email?: string } | "EOSE">((cb) =>
        get_user_by_pubkeys([Keypub], cb)
      );
      if (userMsg && userMsg !== "EOSE" && userMsg.email) {
        setEmail(userMsg.email);
      }

      setLoading(false);
    })();
  }, []);

  const displayAvatar =
    avatarPreview ?? (avatarUrl ? `${uploadpath}${avatarUrl}` : DEFAULT_AVATAR);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(`${label}已复制到剪贴板`, "success");
    } catch {
      showNotification("复制失败，请手动复制", "error");
    }
  };

  const handleSave = async () => {
    const { Keypriv, Keypub } = getKey();
    if (!Keypriv || !Keypub) {
      showNotification("请先登录", "warning");
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl ?? "";

      if (avatarData) {
        showNotification("正在上传头像…", "info");
        const result = await uploadFile("user-avatar.png", avatarData, Keypub, Keypriv);
        finalAvatarUrl = result.fileUrl ?? "";
        setAvatarUrl(finalAvatarUrl);
        setAvatarData(null);
        if (avatarPreviewRef.current?.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreviewRef.current);
          avatarPreviewRef.current = null;
        }
        setAvatarPreview(null);
      }

      await new Promise<void>((resolve, reject) => {
        save_user_profile(
          {
            displayName: displayName.trim(),
            title: title.trim(),
            bio: bio.trim(),
            avatarUrl: finalAvatarUrl,
          },
          Keypub,
          Keypriv,
          (res: { code?: number; message?: string }) => {
            if (res?.code === 200) {
              showNotification("所有设置已保存", "success");
              setShowKeyHint(true);
              resolve();
            } else {
              reject(new Error(res?.message ?? "保存失败"));
            }
          }
        );
      });
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const scrollToKeys = () => {
    keySectionRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowKeyHint(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-indigo-600" />
        加载资料…
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/creator"
        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> 返回创作中心
      </Link>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">个人页面设置</h2>
          <p className="text-sm text-gray-600">自定义您的个人主页展示</p>
        </div>

        <div className="p-6">
          <div className="mx-auto max-w-3xl">
            {/* 头像 */}
            <div className="mb-8 flex flex-col items-center">
              <div
                className="mb-4 h-40 w-40 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-gray-300 transition hover:border-indigo-500"
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => document.getElementById("avatarInput")?.click()}
                tabIndex={0}
                role="button"
                aria-label="上传或粘贴头像"
              >
                <Image
                  src={displayAvatar}
                  alt="个人头像"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              {avatarHover && (
                <p className="mb-2 text-xs text-gray-500">Ctrl+V 可粘贴图片</p>
              )}

              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (!file.type.includes("image")) {
                      showNotification("请选择图片文件", "error");
                      return;
                    }
                    await applyAvatarFile(file);
                  }
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => document.getElementById("avatarInput")?.click()}
                className="mb-2 flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                <Upload className="mr-2 h-4 w-4" /> 选择图片
              </button>
              <p className="text-center text-xs text-gray-500">
                支持 JPG、PNG 格式 | 建议尺寸 400×400 像素 | 可直接粘贴图片
              </p>
            </div>

            {/* 基本信息 */}
            <div className="mb-10 space-y-6">
              {email && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    @
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">欢迎用户</p>
                    <p className="text-base font-medium text-gray-800">{email}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">用户名</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={10}
                  className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:w-64"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">职业</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={20}
                  className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:w-64"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">个人简介</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="介绍一下自己，让读者更了解您..."
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="relative flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 font-medium text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="inline h-4 w-4 animate-spin" />
                  ) : (
                    "保存所有设置"
                  )}
                </button>

                {showKeyHint && (
                  <button
                    type="button"
                    onClick={scrollToKeys}
                    className="absolute -bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-lg"
                  >
                    <ChevronDown className="h-3 w-3 animate-bounce text-indigo-300" />
                    下面还有密钥信息
                    <ChevronDown className="h-3 w-3 animate-bounce text-indigo-300" />
                  </button>
                )}
              </div>
            </div>

            {/* 密钥信息 */}
            <div
              ref={keySectionRef}
              className="rounded-xl border border-gray-200 bg-gray-50 p-5"
            >
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                <Key className="mr-2 h-5 w-5 text-indigo-600" /> 密钥信息
              </h3>

              <div className="mb-6">
                <h4 className="mb-3 text-sm font-medium text-gray-700">公钥信息</h4>
                <KeyRow label="普通二进制" value={keypubBin} onCopy={() => copyText(keypubBin, "公钥（二进制）")} />
                <KeyRow
                  label="Bech32格式"
                  value={keypubBech32}
                  onCopy={() => copyText(keypubBech32, "公钥（Bech32）")}
                />
              </div>

              <div>
                <h4 className="mb-3 flex items-center text-sm font-medium text-gray-700">
                  私钥信息
                  <span className="ml-2 flex items-center text-xs text-amber-600">
                    <AlertCircle className="mr-1 h-3 w-3" /> 请妥善保管
                  </span>
                </h4>
                <KeyRow
                  label="普通二进制"
                  value={showPrivateKey ? keyprivBin : "*******************************"}
                  onCopy={() => copyText(keyprivBin, "私钥（二进制）")}
                  copyDisabled={!showPrivateKey}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-100"
                    >
                      {showPrivateKey ? (
                        <>
                          <EyeOff className="mr-1 inline h-3 w-3" /> 隐藏
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1 inline h-3 w-3" /> 显示
                        </>
                      )}
                    </button>
                  }
                />
                <KeyRow
                  label="Bech32格式"
                  value={showPrivateKey ? keyprivBech32 : "*******************************"}
                  onCopy={() => copyText(keyprivBech32, "私钥（Bech32）")}
                  copyDisabled={!showPrivateKey}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyRow({
  label,
  value,
  onCopy,
  copyDisabled,
  action,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copyDisabled?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 grid grid-cols-1 items-center gap-2 sm:grid-cols-12 sm:gap-3">
      <div className="text-sm text-gray-600 sm:col-span-3">{label}：</div>
      <div className="break-all rounded border border-gray-200 bg-white p-2 text-sm sm:col-span-6">
        {value}
      </div>
      <div className="flex gap-2 sm:col-span-3">
        {action}
        <button
          type="button"
          disabled={copyDisabled}
          onClick={onCopy}
          className="flex items-center rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 disabled:opacity-40"
        >
          <Copy className="mr-1 h-3 w-3" /> 复制
        </button>
      </div>
    </div>
  );
}
