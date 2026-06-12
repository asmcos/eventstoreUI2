"use client";

import { getPublicKey } from "eventstore-tools/src/key";
import { WebStorage } from "./storage";

export interface UserKeys {
  Keypriv: Uint8Array | null;
  Keypub: string | null;
}

export function getKey(): UserKeys {
  if (typeof window === "undefined") {
    return { Keypriv: null, Keypub: null };
  }

  const storage = new WebStorage(localStorage);
  const raw = storage.get("keyPriv");
  if (!raw) return { Keypriv: null, Keypub: null };

  try {
    const Keypriv = new Uint8Array(raw.split(",").map(Number));
    const Keypub = getPublicKey(Keypriv) as unknown as string;
    return { Keypriv, Keypub };
  } catch {
    return { Keypriv: null, Keypub: null };
  }
}

export function saveKey(Keypriv: Uint8Array): string {
  const storage = new WebStorage(localStorage);
  storage.set("keyPriv", Keypriv.toString());
  return getPublicKey(Keypriv) as unknown as string;
}

export function clearKey(): void {
  const storage = new WebStorage(localStorage);
  storage.remove("keyPriv");
}
