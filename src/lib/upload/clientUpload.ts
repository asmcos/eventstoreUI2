"use client";

import { upload_file } from "@/lib/esclient/esclient";

interface UploadResult {
  code: number;
  fileUrl?: string;
}

export function uploadFile(
  filename: string,
  fileData: Uint8Array,
  pubkey: string,
  privkey: Uint8Array
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    void upload_file(filename, fileData, pubkey, privkey, (message: unknown[]) => {
      const result = message[2] as UploadResult | undefined;
      if (result?.code === 200) {
        resolve(result);
      } else if (result?.code === 202) {
        // 分片上传中，等待最终 200
      } else {
        reject(new Error("上传失败"));
      }
    });
  });
}

export async function fileToUint8Array(file: File | Blob): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const [, base64Data] = dataUrl.split(",");
  const binaryString = atob(base64Data);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}
