import { NextResponse } from "next/server";
import { fetchBookDetailData, fetchChapterContent } from "@/lib/esclient/server";

interface RouteParams {
  params: Promise<{ bookId: string; chapterId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { bookId, chapterId } = await params;

  try {
    const detail = await fetchBookDetailData(bookId);
    if (!detail) {
      return NextResponse.json({ error: "书籍未找到" }, { status: 404 });
    }

    const content = await fetchChapterContent(
      detail.rawBookId,
      decodeURIComponent(chapterId),
      detail.book.user
    );

    return NextResponse.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "加载章节失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
