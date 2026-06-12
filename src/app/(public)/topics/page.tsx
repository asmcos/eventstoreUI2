import Link from "next/link";
import { Eye, MessageCircle, Plus, RefreshCw } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { fetchBrowseLogs, fetchTopics } from "@/lib/esclient/server";
import { getShortTopicId } from "@/lib/utils/ids";

export const metadata = buildMetadata({
  title: "话题论坛",
  description: "系统编程技术社区话题讨论，分享经验与解答疑问。",
  path: "/topics",
  keywords: ["技术论坛", "话题讨论", "系统编程", "Rust"],
});

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  let topics: Awaited<ReturnType<typeof fetchTopics>> = [];
  let browseLogs: Record<string, number> = {};

  try {
    topics = await fetchTopics(0, 20);
    browseLogs = await fetchBrowseLogs(topics.map((t) => t.id));
  } catch (error) {
    console.error("Failed to fetch topics:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero banner — 对齐原版 viewtopics */}
        <div className="relative mb-8 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(66,153,225,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(66,153,225,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-blue-500 opacity-20 blur-[100px]" />
            <div
              className="absolute right-1/4 bottom-1/4 h-80 w-80 animate-pulse rounded-full bg-purple-600 opacity-10 blur-[120px]"
              style={{ animationDelay: "1s" }}
            />
          </div>
          <div className="absolute top-0 right-0 h-32 w-32 border-t-4 border-r-4 border-blue-500/30" />
          <div className="absolute bottom-0 left-0 h-24 w-24 border-b-4 border-l-4 border-purple-500/30" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="mb-1 text-3xl font-bold text-white">话题论坛</h1>
                  <p className="text-lg text-gray-400">
                    <span className="font-medium text-blue-400">Community Hub</span> • 科技讨论平台
                  </p>
                </div>
              </div>
              <p className="max-w-2xl text-gray-300">
                聚焦系统编程领域的核心技术讨论与交流，分享经验、解答疑问
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/topics"
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-300 shadow-lg transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-700 hover:shadow-blue-500/10"
              >
                <RefreshCw className="h-4 w-4 text-blue-400" />
                刷新列表
              </Link>
              <Link
                href="/edittopic"
                className="flex transform items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:via-blue-600 hover:to-purple-700 hover:shadow-blue-500/50"
              >
                <Plus className="h-5 w-5" />
                发布话题
              </Link>
            </div>
          </div>
        </div>

        {/* 列表 */}
        {topics.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="grid grid-cols-12 gap-6 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="col-span-12 text-sm font-medium text-gray-700 md:col-span-7">
                主题内容
              </div>
              <div className="col-span-6 hidden text-center text-sm font-medium text-gray-700 md:col-span-3 md:block">
                互动数据
              </div>
              <div className="col-span-6 hidden text-right text-sm font-medium text-gray-700 md:col-span-2 md:block">
                发布时间
              </div>
            </div>

            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${getShortTopicId(topic)}`}
                className="group grid grid-cols-12 gap-4 border-b border-gray-100 px-6 py-5 transition-all duration-200 last:border-b-0 hover:bg-gray-50 hover:shadow-sm md:gap-6 md:items-center"
              >
                <div className="col-span-12 md:col-span-7">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-500">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="mb-2 line-clamp-1 text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                        {topic.data.title}
                      </h2>
                      {topic.labels && topic.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {topic.labels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-6 flex items-center justify-center gap-4 text-sm text-gray-500 md:col-span-3">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-4 w-4 text-blue-400" />
                    {browseLogs[topic.id] ?? 0}
                  </span>
                </div>

                <div className="col-span-6 text-right text-sm text-gray-500 md:col-span-2">
                  {topic.servertimestamp && (
                    <time dateTime={topic.servertimestamp}>
                      {topic.servertimestamp.split("T")[0]}
                    </time>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-lg">
            <h3 className="mb-3 text-xl font-semibold text-gray-900">暂无主题</h3>
            <p className="mx-auto mb-6 max-w-md text-gray-600">
              还没有人发布主题，快来创建第一个话题，开启精彩讨论吧！
            </p>
            <Link
              href="/edittopic"
              className="inline-block rounded-lg bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-3 text-white shadow transition-colors hover:from-purple-800 hover:to-indigo-800 hover:shadow-lg"
            >
              创建第一个主题
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
