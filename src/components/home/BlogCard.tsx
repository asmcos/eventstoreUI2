import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronRight, Eye } from "lucide-react";
import { uploadpath } from "@/lib/config";
import type { EventStoreItem, UserProfile } from "@/lib/types/events";
import { getShortBlogId } from "@/lib/utils/ids";

interface BlogCardProps {
  blog: EventStoreItem;
  viewCount?: number;
  author?: UserProfile;
  /** home: 首页三列卡片；list: 博客列表双列 */
  variant?: "home" | "list";
}

export default function BlogCard({
  blog,
  viewCount = 0,
  author,
  variant = "home",
}: BlogCardProps) {
  const href = `/blogs/${getShortBlogId(blog)}`;
  const title = blog.data.title ?? "未命名文章";
  const coverUrl = blog.data.coverUrl ? `${uploadpath}${blog.data.coverUrl}` : null;
  const date = blog.servertimestamp?.split("T")[0] ?? "";
  const avatarUrl = author?.data.avatarUrl
    ? `${uploadpath}${author.data.avatarUrl}`
    : null;

  const isList = variant === "list";
  const thumbSize = isList ? "h-32 w-32" : "h-28 w-28";
  const padding = isList ? "p-6" : "p-5";
  const titleClass = isList
    ? "text-xl font-semibold"
    : "text-lg font-semibold";

  return (
    <article
      className={`overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:shadow-lg ${
        isList ? "hover:-translate-y-[5px]" : ""
      }`}
    >
      <div className={padding}>
        <div className="mb-4 flex items-start">
          <Link
            href={href}
            className={`${thumbSize} mr-4 shrink-0 overflow-hidden rounded-lg bg-gray-100`}
          >
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={title}
                width={128}
                height={128}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                无封面
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <h3 className={`mb-2 ${titleClass} text-gray-900 transition-colors hover:text-blue-600`}>
              <Link href={href}>{title}</Link>
            </h3>
            <div className="mb-3 space-y-2">
              {date && (
                <div className="flex items-center text-gray-700">
                  <Calendar className="mr-2 h-4 w-4 shrink-0 text-blue-400" aria-hidden />
                  <time dateTime={blog.servertimestamp}>{date}</time>
                </div>
              )}
              <div className="flex items-center text-gray-700">
                <Eye className="mr-2 h-4 w-4 shrink-0 text-green-400" aria-hidden />
                <span>{viewCount} 次</span>
              </div>
            </div>
          </div>
        </div>

        {blog.labels && blog.labels.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {blog.labels.map((label) => (
              <span
                key={label}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          {author?.data.displayName ? (
            <div className="flex items-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={author.data.displayName}
                  width={32}
                  height={32}
                  className="mr-2 h-8 w-8 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                  {author.data.displayName[0]}
                </div>
              )}
              <span className="text-sm text-gray-700">{author.data.displayName}</span>
            </div>
          ) : (
            <span />
          )}
          <Link
            href={href}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            阅读全文
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
