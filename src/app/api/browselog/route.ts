import { NextResponse } from "next/server";
import { create_browselog, ensureConnected } from "@/lib/esclient/esclient";

export const runtime = "nodejs";

interface BrowseLogBody {
  pubkey?: string;
  targetId?: string;
}

export async function POST(request: Request) {
  let body: BrowseLogBody;
  try {
    body = (await request.json()) as BrowseLogBody;
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const { pubkey, targetId } = body;
  if (!pubkey || !targetId) {
    return NextResponse.json({ error: "缺少 pubkey 或 targetId" }, { status: 400 });
  }

  const connected = await ensureConnected(5000);
  if (!connected) {
    return NextResponse.json({ error: "EventStore 连接失败" }, { status: 503 });
  }

  const result = await new Promise<unknown>((resolve) => {
    void create_browselog(pubkey, targetId, (message: unknown) => resolve(message));
  });

  return NextResponse.json({ ok: true, result });
}
