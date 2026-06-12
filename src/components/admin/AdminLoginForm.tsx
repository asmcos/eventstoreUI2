"use client";

import { useState } from "react";
import { KeyRound, LogIn, UserPlus, AlertTriangle } from "lucide-react";
import { esecDecode, esecEncode, generateSecretKey, getPublicKey } from "eventstore-tools/src/key";
import { create_user } from "@/lib/esclient/esclient";
import { saveKey } from "@/lib/auth/keys";

interface AdminLoginFormProps {
  onSuccess: () => void;
}

export default function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [generatedKey, setGeneratedKey] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");

  const generateKey = () => {
    const priv = generateSecretKey();
    setGeneratedKey(priv);
    setPrivateKeyInput(esecEncode(priv));
  };

  const normalizePrivateKey = (input: string): Uint8Array | null => {
    let normalized = input.replace(/\s/g, "");
    if (!normalized.startsWith("esec1")) return null;
    if (normalized.length < 48) return null;
    try {
      const decoded = esecDecode(normalized) as Uint8Array | { data: Uint8Array };
      return decoded instanceof Uint8Array ? decoded : decoded.data;
    } catch {
      return null;
    }
  };

  const handleSubmit = () => {
    setError("");

    if (isNewAccount) {
      if (!email.trim()) {
        setError("请填写邮箱");
        return;
      }
      const priv = generatedKey ?? normalizePrivateKey(privateKeyInput);
      if (!priv) {
        setError("请生成或输入有效的 esec1 私钥");
        return;
      }
      const pub = getPublicKey(priv);
      create_user(email, pub, priv, (message: unknown) => {
        const res =
          (message as { 2?: { code?: number; message?: string } })?.[2] ??
          (message as { code?: number; message?: string });
        if (res?.code === 200) {
          saveKey(priv);
          onSuccess();
        } else {
          setError(res?.message ?? "注册失败");
        }
      });
      return;
    }

    const priv = normalizePrivateKey(privateKeyInput);
    if (!priv) {
      setError("无效的私钥格式，请使用 esec1 开头密钥");
      return;
    }
    saveKey(priv);
    onSuccess();
  };

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-100">
        <div className="bg-gradient-to-br from-[#165DFF] to-[#0e42b8] p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            {isNewAccount ? (
              <UserPlus className="h-8 w-8 text-white" />
            ) : (
              <LogIn className="h-8 w-8 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isNewAccount ? "创建管理员账号" : "管理员登录"}
          </h2>
          <p className="mt-1 text-sm text-white/80">
            {isNewAccount ? "生成密钥对并注册" : "使用 esec1 私钥登录"}
          </p>
        </div>

        <div className="space-y-4 p-6">
          {isNewAccount && (
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#165DFF] focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20"
                placeholder="your@email.com"
              />
            </div>
          )}

          <div>
            <label htmlFor="admin-key" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <KeyRound className="h-4 w-4 text-[#165DFF]" />
              {isNewAccount ? "生成的私钥" : "已有私钥"}
            </label>
            <div className="relative">
              <textarea
                id="admin-key"
                rows={4}
                value={privateKeyInput}
                onChange={(e) => setPrivateKeyInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#165DFF] focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20"
                placeholder={isNewAccount ? "点击生成新密钥对" : "粘贴 esec1... 私钥"}
              />
              {isNewAccount && (
                <button
                  type="button"
                  onClick={generateKey}
                  className="absolute bottom-3 right-3 rounded-lg bg-[#165DFF] px-3 py-1.5 text-xs text-white hover:bg-[#165DFF]/90"
                >
                  生成新密钥对
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#165DFF] py-3 font-medium text-white shadow-md hover:bg-[#165DFF]/90"
          >
            {isNewAccount ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {isNewAccount ? "创建账号" : "登录"}
          </button>

          <p className="text-center text-sm text-gray-500">
            <button
              type="button"
              onClick={() => {
                setIsNewAccount(!isNewAccount);
                setError("");
              }}
              className="font-medium text-[#165DFF] hover:underline"
            >
              {isNewAccount ? "已有账号？点击登录" : "没有账号？创建一个"}
            </button>
          </p>

          <p className="flex items-center justify-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            私钥仅保存在本地浏览器，请妥善保管
          </p>
        </div>
      </div>
    </div>
  );
}
