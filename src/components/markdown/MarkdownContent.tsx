"use client";

import React, {
  isValidElement,
  useMemo,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { slugifyHeading } from "@/lib/markdown/toc";
import { displayLangLabel, inferFenceLang, resolveHighlightLang } from "@/lib/markdown/code-lang";
import { htmlStyleToObject, normalizeMarkdownHtml } from "@/lib/markdown/preprocess";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function MarkdownImage({ src, alt, style, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 用户 Markdown 含任意上传域名与 inline style
    <img
      src={src}
      alt={alt ?? ""}
      style={htmlStyleToObject(style)}
      className={className ? `my-4 rounded-lg ${className}` : "my-4 max-w-full rounded-lg"}
      loading="lazy"
      {...props}
    />
  );
}

function extractCodeBlock(children: ReactNode): { code: string; lang: string } | null {
  if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) {
    return null;
  }
  const className = children.props.className ?? "";
  const code = String(children.props.children ?? "").replace(/\n$/, "");
  if (!code) return null;

  if (className.includes("language-")) {
    const lang = className.replace(/.*language-(\S+).*/, "$1");
    return { code, lang };
  }

  return { code, lang: inferFenceLang(code) };
}

function wrapHeading(
  Component: (props: HTMLAttributes<HTMLHeadingElement>) => React.JSX.Element
) {
  return ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
    const id = props.id ?? slugifyHeading(String(children));
    return (
      <Component {...props} id={id}>
        {children}
      </Component>
    );
  };
}

function toShikiLang(lang: string): string {
  const resolved = resolveHighlightLang(lang);
  return resolved === "plaintext" ? "text" : resolved;
}

const components: Components = {
  h1: wrapHeading(defaultMdxComponents.h1),
  h2: wrapHeading(defaultMdxComponents.h2),
  h3: wrapHeading(defaultMdxComponents.h3),
  h4: wrapHeading(defaultMdxComponents.h4),
  h5: wrapHeading(defaultMdxComponents.h5),
  h6: wrapHeading(defaultMdxComponents.h6),
  a: defaultMdxComponents.a,
  table: defaultMdxComponents.table,
  img: MarkdownImage,
  pre: ({ children }) => {
    const block = extractCodeBlock(children);
    if (block) {
      const lang = toShikiLang(block.lang);
      const title = displayLangLabel(block.lang);
      return (
        <DynamicCodeBlock
          lang={lang}
          code={block.code}
          codeblock={title ? { title } : undefined}
        />
      );
    }
    return defaultMdxComponents.pre({ children });
  },
  code: ({ className, children }) => {
    if (className?.includes("language-")) {
      return <code className={className}>{children}</code>;
    }
    return <code>{children}</code>;
  },
};

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const processed = useMemo(() => normalizeMarkdownHtml(content), [content]);

  return (
    <article className={`prose max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </article>
  );
}
