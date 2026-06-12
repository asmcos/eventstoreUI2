import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildMetadata } from "@/lib/seo";
import { fetchTopicById } from "@/lib/esclient/server";

interface TopicDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TopicDetailPageProps) {
  const { id } = await params;
  try {
    const topic = await fetchTopicById(id);
    if (!topic) return buildMetadata({ title: "话题未找到", noIndex: true });
    return buildMetadata({
      title: topic.data.title ?? "论坛话题",
      description:
        typeof topic.data.content === "string"
          ? topic.data.content.slice(0, 160)
          : undefined,
      path: `/topics/${id}`,
      type: "article",
    });
  } catch {
    return buildMetadata({ title: "论坛话题", path: `/topics/${id}` });
  }
}

export const dynamic = "force-dynamic";

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const { id } = await params;

  let topic;
  try {
    topic = await fetchTopicById(id);
  } catch {
    notFound();
  }

  if (!topic) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: topic.data.title,
    datePublished: topic.servertimestamp,
    url: `https://docs.chenlongos.cn/topics/${id}`,
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="card p-6 sm:p-10">
          <header className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="mb-4 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
              {topic.data.title}
            </h1>
            {topic.servertimestamp && (
              <time dateTime={topic.servertimestamp} className="text-sm text-gray-500">
                {topic.servertimestamp.split("T")[0]}
              </time>
            )}
          </header>
          <div className="prose-content">
            {typeof topic.data.content === "string" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.data.content}</ReactMarkdown>
            ) : (
              <p className="text-gray-500">暂无内容</p>
            )}
          </div>
          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            回帖与楼中楼功能正在迁移中，即将支持登录后回复讨论。
          </div>
          <footer className="mt-10 border-t border-gray-100 pt-6">
            <Link href="/topics" className="text-sm font-semibold text-blue-600 hover:underline">
              ← 返回话题列表
            </Link>
          </footer>
        </div>
      </article>
    </main>
  );
}
