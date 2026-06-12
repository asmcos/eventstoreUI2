import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import {
  fetchBlogById,
  fetchBrowseLogs,
  fetchUsersProfile,
} from "@/lib/esclient/server";
import BlogArticle from "@/components/blog/BlogArticle";
import { uploadpath } from "@/lib/config";
import type { UserProfile, BrowseLogs } from "@/lib/types/events";

interface BlogDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { id } = await params;
  try {
    const blog = await fetchBlogById(id);
    if (!blog) return buildMetadata({ title: "文章未找到", noIndex: true });
    const excerpt =
      typeof blog.data.content === "string"
        ? blog.data.content.slice(0, 160)
        : blog.data.title;
    return buildMetadata({
      title: blog.data.title ?? "博客文章",
      description: excerpt ?? undefined,
      path: `/blogs/${id}`,
      image: blog.data.coverUrl ? `${uploadpath}${blog.data.coverUrl}` : undefined,
      type: "article",
    });
  } catch {
    return buildMetadata({ title: "博客文章", path: `/blogs/${id}` });
  }
}

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { id } = await params;

  let blog;
  try {
    blog = await fetchBlogById(id);
  } catch {
    notFound();
  }

  if (!blog) notFound();

  const profiles = await fetchUsersProfile([blog.user]).catch(
    (): Record<string, UserProfile> => ({})
  );
  const browseLogs = await fetchBrowseLogs([blog.id]).catch((): BrowseLogs => ({}));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.data.title,
    datePublished: blog.servertimestamp,
    author: profiles[blog.user]?.data.displayName
      ? { "@type": "Person", name: profiles[blog.user].data.displayName }
      : undefined,
    image: blog.data.coverUrl ? `${uploadpath}${blog.data.coverUrl}` : undefined,
    url: `https://docs.chenlongos.cn/blogs/${id}`,
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogArticle
        blog={blog}
        author={profiles[blog.user]}
        viewCount={browseLogs[blog.id] ?? 0}
      />
    </main>
  );
}
