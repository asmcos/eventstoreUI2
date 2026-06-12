import { Suspense } from "react";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { fetchBookDetailData } from "@/lib/esclient/server";
import BookReader from "@/components/book/BookReader";
import { findChapterInOutline } from "@/lib/book/outline";
import { uploadpath } from "@/lib/config";

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chapter?: string }>;
}

export async function generateMetadata({ params, searchParams }: BookDetailPageProps) {
  const { id } = await params;
  const { chapter } = await searchParams;
  try {
    const data = await fetchBookDetailData(id, chapter);
    if (!data) return buildMetadata({ title: "书籍未找到", noIndex: true });

    const chapterNode = chapter ? findChapterInOutline(data.outline, chapter) : null;
    const bookTitle = data.book.data.title ?? "技术书籍";
    const pageTitle = chapterNode ? `${chapterNode.title} - ${bookTitle}` : bookTitle;

    return buildMetadata({
      title: pageTitle,
      description: chapterNode
        ? `阅读《${bookTitle}》章节：${chapterNode.title}`
        : `阅读《${bookTitle}》——系统编程技术书籍。`,
      path: chapter ? `/books/${id}?chapter=${encodeURIComponent(chapter)}` : `/books/${id}`,
      image: data.book.data.coverImgurl
        ? `${uploadpath}${data.book.data.coverImgurl}`
        : undefined,
      type: "book",
    });
  } catch {
    return buildMetadata({ title: "技术书籍", path: `/books/${id}` });
  }
}

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params, searchParams }: BookDetailPageProps) {
  const { id } = await params;
  const { chapter } = await searchParams;

  let detail;
  try {
    detail = await fetchBookDetailData(id, chapter);
  } catch {
    notFound();
  }

  if (!detail) notFound();

  const title = (detail.book.data.title as string) ?? "未命名书籍";
  const chapterNode = chapter ? findChapterInOutline(detail.outline, chapter) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: title,
    author: detail.authorName ? { "@type": "Person", name: detail.authorName } : undefined,
    url: chapter
      ? `https://docs.chenlongos.cn/books/${id}?chapter=${encodeURIComponent(chapter)}`
      : `https://docs.chenlongos.cn/books/${id}`,
    image: detail.book.data.coverImgurl
      ? `${uploadpath}${detail.book.data.coverImgurl}`
      : undefined,
    ...(chapterNode && {
      hasPart: {
        "@type": "Chapter",
        name: chapterNode.title,
        url: `https://docs.chenlongos.cn/books/${id}?chapter=${encodeURIComponent(chapter!)}`,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-slate-500">
            加载书籍…
          </div>
        }
      >
        <BookReader
          shortBookId={id}
          title={title}
          authorName={detail.authorName}
          outline={detail.outline}
          initialChapterId={detail.firstChapterId}
          initialContent={detail.firstChapterContent}
        />
      </Suspense>
    </>
  );
}
