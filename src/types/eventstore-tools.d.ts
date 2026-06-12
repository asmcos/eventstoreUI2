declare module "eventstore-tools/src/key" {
  export function generateSecretKey(): Uint8Array;
  export function getPublicKey(privkey: Uint8Array): Uint8Array;
  export function verifyEvent(event: unknown, pubkey: Uint8Array): boolean;
  export function esecEncode(privkey: Uint8Array): string;
  export function esecDecode(key: string): Uint8Array;
  export function epubEncode(pubkey: Uint8Array): string;
  export function epubDecode(key: string): Uint8Array;
  export function secureEvent(event: Record<string, unknown>, privkey: Uint8Array): unknown;
  export function hashMessage(message: string): string;
}

declare module "eventstore-tools/src/WebSocketClient" {
  export class WebSocketClient {
    constructor(url: string);
    connect(): Promise<void>;
    subscribe(event: unknown, callback: (message: unknown) => void): void;
    unsubscribe(id: unknown): void;
    publish(event: unknown, callback: (message: unknown) => void): void;
  }
}

declare module "eventstore-tools/src/permissions" {
  export const PERMISSIONS: Record<string, number>;
}
