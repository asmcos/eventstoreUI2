import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { fetchBlogs, fetchBooks, fetchTopics } from "@/lib/esclient/server";
import { getShortBlogId, getShortBookId, getShortTopicId } from "@/lib/utils/ids";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.domain;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/books`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blogs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/topics`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const [books, blogs, topics] = await Promise.all([
      fetchBooks(0, 100),
      fetchBlogs(0, 100),
      fetchTopics(0, 100),
    ]);

    const bookRoutes = books.map((book) => ({
      url: `${base}/books/${getShortBookId(book)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const blogRoutes = blogs.map((blog) => ({
      url: `${base}/blogs/${getShortBlogId(blog)}`,
      lastModified: blog.servertimestamp ? new Date(blog.servertimestamp) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const topicRoutes = topics.map((topic) => ({
      url: `${base}/topics/${getShortTopicId(topic)}`,
      lastModified: topic.servertimestamp ? new Date(topic.servertimestamp) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...bookRoutes, ...blogRoutes, ...topicRoutes];
  } catch {
    return staticRoutes;
  }
}
