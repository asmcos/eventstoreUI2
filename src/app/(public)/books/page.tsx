import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { fetchBooks, fetchBrowseLogs } from "@/lib/esclient/server";
import BookCard from "@/components/home/BookCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { bookGrid } from "@/lib/layout";

export const metadata = buildMetadata({
  title: "技术书籍",
  description: "浏览系统编程、操作系统与Rust领域的高质量技术书籍。",
  path: "/books",
  keywords: ["技术书籍", "系统编程", "Rust", "操作系统"],
});

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  let books: Awaited<ReturnType<typeof fetchBooks>> = [];
  let browseLogs: Record<string, number> = {};

  try {
    books = await fetchBooks(0, 20);
    browseLogs = await fetchBrowseLogs(books.map((b) => b.id));
  } catch (error) {
    console.error("Failed to fetch books:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader
          as="h1"
          title="技术书籍"
          description="精选系统编程、操作系统与 Rust 领域的高质量技术书籍"
        />
        {books.length > 0 ? (
          <div className={bookGrid}>
            {books.map((book) => (
              <BookCard key={book.id} book={book} viewCount={browseLogs[book.id] ?? 0} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">暂无书籍数据</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
              返回首页
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
