import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import { uploadpath } from "@/lib/config";
import type { EventStoreItem } from "@/lib/types/events";
import { getShortBookId } from "@/lib/utils/ids";

interface BookCardProps {
  book: EventStoreItem;
  viewCount?: number;
}

export default function BookCard({ book, viewCount = 0 }: BookCardProps) {
  const href = `/books/${getShortBookId(book)}`;
  const title = book.data.title ?? "未命名书籍";
  const coverUrl = book.data.coverImgurl
    ? `${uploadpath}${book.data.coverImgurl}`
    : null;

  return (
    <article className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={href} className="relative block w-full pt-[100%]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            className="absolute inset-0 object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 text-sm text-gray-400">
            暂无封面
          </div>
        )}
      </Link>

      <div className="flex flex-grow flex-col p-5">
        <h3 className="mb-3 line-clamp-2 min-h-[56px] text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
          <Link href={href}>{title}</Link>
        </h3>

        {book.labels && book.labels.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {book.labels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center rounded-lg bg-gray-50 px-3 py-1.5 text-gray-600">
              <Eye className="mr-2 h-4 w-4 text-blue-500" aria-hidden />
              <span className="text-sm font-medium">{viewCount}</span>
            </div>
            <Link
              href={href}
              className="transform rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              阅读
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
