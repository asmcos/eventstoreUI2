import { buildMetadata, buildItemListJsonLd, absoluteUrl } from "@/lib/seo";
import { fetchHomePageData } from "@/lib/esclient/server";
import HomePageContent from "@/components/home/HomePageContent";
import { getShortBlogId, getShortBookId } from "@/lib/utils/ids";

export const metadata = buildMetadata({
  title: "辰龙社区文档中心",
  description:
    "汇聚操作系统、Rust编程与系统开发的专业文档、书籍和实战指南。系统编程技术资源平台。",
  path: "/",
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data;
  try {
    data = await fetchHomePageData();
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
    data = { books: [], blogs: [], usersProfile: {}, browseLogs: {} };
  }

  const bookListJsonLd = buildItemListJsonLd(
    data.books.map((book) => ({
      name: book.data.title ?? "技术书籍",
      url: absoluteUrl(`/books/${getShortBookId(book)}`),
    })),
    "推荐技术书籍"
  );

  const blogListJsonLd = buildItemListJsonLd(
    data.blogs.map((blog) => ({
      name: blog.data.title ?? "博客文章",
      url: absoluteUrl(`/blogs/${getShortBlogId(blog)}`),
    })),
    "最新博客文章"
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListJsonLd) }}
      />
      <HomePageContent data={data} />
    </>
  );
}
