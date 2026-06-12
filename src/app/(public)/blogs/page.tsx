import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";
import { fetchBlogs, fetchBrowseLogs, fetchUsersProfile } from "@/lib/esclient/server";
import BlogCard from "@/components/home/BlogCard";
import { blogListGrid } from "@/lib/layout";

export const metadata = buildMetadata({
  title: "博客文章",
  description: "系统编程与操作系统领域的技术分享与实践指南。",
  path: "/blogs",
  keywords: ["技术博客", "系统编程", "Rust", "操作系统"],
});

export const dynamic = "force-dynamic";

export default async function BlogsPage() {
  let blogs: Awaited<ReturnType<typeof fetchBlogs>> = [];
  let browseLogs: Record<string, number> = {};
  let usersProfile: Awaited<ReturnType<typeof fetchUsersProfile>> = {};

  try {
    blogs = await fetchBlogs(0, 12);
    const userPubkeys = [...new Set(blogs.map((b) => b.user))];
    [browseLogs, usersProfile] = await Promise.all([
      fetchBrowseLogs(blogs.map((b) => b.id)),
      fetchUsersProfile(userPubkeys),
    ]);
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            {siteConfig.name} 技术博客
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            辰龙操作系统 开发技巧、系统设计以及最新技术动态
          </p>
          {blogs.length > 0 && (
            <p className="mt-6 text-lg text-gray-700">
              共 <span className="font-semibold text-blue-600">{blogs.length}</span> 篇博客文章
            </p>
          )}
        </div>

        {blogs.length > 0 ? (
          <div className={`${blogListGrid} mb-12`}>
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                blog={blog}
                viewCount={browseLogs[blog.id] ?? 0}
                author={usersProfile[blog.user]}
                variant="list"
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <h3 className="mb-2 text-2xl font-semibold text-gray-700">暂无博客文章</h3>
            <p className="mx-auto max-w-md text-gray-500">当前没有找到博客文章，请稍后再来。</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
              返回首页
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
