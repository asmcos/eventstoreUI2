"use client";

import { generateSecretKey, getPublicKey } from "eventstore-tools/src/key";
import { WebStorage } from "@/lib/auth/storage";
import { getKey } from "@/lib/auth/keys";

function getAnonymousPubkey(): string {
  const storage = new WebStorage(localStorage);
  const stored = storage.get("anonymousprivkey");
  if (stored) {
    try {
      const keypriv = new Uint8Array(stored.split(",").map(Number));
      return getPublicKey(keypriv) as unknown as string;
    } catch {
      /* 重新生成 */
    }
  }
  const keypriv = generateSecretKey();
  storage.set("anonymousprivkey", keypriv.toString());
  return getPublicKey(keypriv) as unknown as string;
}

/**
 * 记录一次浏览（登录用户用其公钥，未登录则生成匿名公钥）。
 * 对应原项目 browselog()；经服务端 API 写入 EventStore，避免浏览器直连 WebSocket 失败。
 */
export function recordBrowseView(targetId: string, pubkey?: string | null): void {
  if (!targetId || typeof window === "undefined") return;
  const userPubkey = pubkey || getKey().Keypub || getAnonymousPubkey();
  if (!userPubkey) return;

  void fetch("/api/browselog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubkey: userPubkey, targetId }),
    keepalive: true,
  }).catch(() => {});
}
