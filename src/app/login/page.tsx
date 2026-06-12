"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { esecDecode, esecEncode, generateSecretKey, getPublicKey } from "eventstore-tools/src/key";
import { create_user } from "@/lib/esclient/esclient";
import { saveKey } from "@/lib/auth/keys";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/creator";

  const [isNewAccount, setIsNewAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [generatedKey, setGeneratedKey] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generateKey = () => {
    const priv = generateSecretKey();
    setGeneratedKey(priv);
    setPrivateKeyInput(esecEncode(priv));
  };

  const normalizePrivateKey = (input: string): Uint8Array | null => {
    let normalized = input.replace(/\s/g, "");
    if (!normalized.startsWith("esec1")) {
      try {
        const bytes = new Uint8Array(normalized.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
        normalized = esecEncode(bytes);
      } catch {
        return null;
      }
    }
    if (!normalized.startsWith("esec1") || normalized.length < 48) return null;
    try {
      const decoded = esecDecode(normalized) as Uint8Array | { data: Uint8Array };
      return decoded instanceof Uint8Array ? decoded : decoded.data;
    } catch {
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isNewAccount) {
      if (!email.trim()) {
        setError("请填写邮箱");
        setLoading(false);
        return;
      }
      const priv = generatedKey ?? normalizePrivateKey(privateKeyInput);
      if (!priv) {
        setError("请生成或输入有效的 esec1 私钥");
        setLoading(false);
        return;
      }
      const pub = getPublicKey(priv);
      create_user(email, pub, priv, (message: unknown) => {
        const res = (message as { 2?: { code?: number; message?: string } })?.[2] ?? message as { code?: number; message?: string };
        if (res?.code === 200) {
          saveKey(priv);
          router.push(from);
        } else {
          setError(res?.message ?? "注册失败");
          setLoading(false);
        }
      });
      return;
    }

    const priv = normalizePrivateKey(privateKeyInput);
    if (!priv) {
      setError("无效的私钥格式，请使用 esec1 开头密钥");
      setLoading(false);
      return;
    }
    saveKey(priv);
    router.push(from);
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-8 shadow-2xl">
      <h1 className="mb-2 text-2xl font-bold text-white">
        {isNewAccount ? "注册创作者账户" : "登录创作中心"}
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        使用 esec1 私钥登录，密钥仅保存在本地浏览器中
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isNewAccount && (
          <div>
            <label className="mb-1 block text-sm text-gray-300">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              placeholder="your@email.com"
            />
          </div>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm text-gray-300">私钥 (esec1…)</label>
            {isNewAccount && (
              <button
                type="button"
                onClick={generateKey}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                生成新密钥
              </button>
            )}
          </div>
          <textarea
            value={privateKeyInput}
            onChange={(e) => setPrivateKeyInput(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2.5 font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="esec1..."
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-3 font-medium text-white transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
        >
          {loading ? "处理中…" : isNewAccount ? "注册并登录" : "登录"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setIsNewAccount(!isNewAccount);
          setError("");
        }}
        className="mt-4 w-full text-center text-sm text-gray-400 hover:text-white"
      >
        {isNewAccount ? "已有账户？去登录" : "没有账户？注册新账户"}
      </button>

      <Link href="/" className="mt-6 block text-center text-sm text-gray-500 hover:text-gray-300">
        返回首页
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 px-4">
      <Suspense fallback={<div className="text-gray-400">加载中…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
