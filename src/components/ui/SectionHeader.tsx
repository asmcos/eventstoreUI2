import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  href?: string;
  as?: "h1" | "h2";
  centered?: boolean;
  action?: ReactNode;
}

export default function SectionHeader({
  title,
  description,
  href,
  as = "h2",
  centered = false,
  action,
}: SectionHeaderProps) {
  const Tag = as;
  const titleClass =
    as === "h1"
      ? "text-3xl font-bold text-gray-900 sm:text-4xl"
      : "text-3xl font-bold text-gray-900";

  if (action) {
    return (
      <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Tag className="mb-4">
            {href ? (
              <Link href={href} className="transition-colors hover:text-blue-600">
                {title}
              </Link>
            ) : (
              title
            )}
          </Tag>
          {description && <p className="max-w-2xl text-gray-600">{description}</p>}
        </div>
        <div className="mt-0 shrink-0">{action}</div>
      </div>
    );
  }

  return (
    <div className={`mb-12 ${centered ? "text-center" : ""}`}>
      <Tag className={`mb-4 ${titleClass}`}>
        {href ? (
          <Link href={href} className="transition-colors hover:text-blue-600">
            {title}
          </Link>
        ) : (
          title
        )}
      </Tag>
      {description && (
        <p className={`max-w-2xl text-gray-600 ${centered ? "mx-auto" : ""}`}>
          {description}
        </p>
      )}
    </div>
  );
}
