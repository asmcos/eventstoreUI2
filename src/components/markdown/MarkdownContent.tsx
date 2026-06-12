import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { slugifyHeading } from "@/lib/markdown/toc";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => {
    const text = String(children);
    return (
      <h1
        id={slugifyHeading(text)}
        className="mb-4 mt-8 scroll-mt-24 text-2xl font-bold text-slate-800"
      >
        {children}
      </h1>
    );
  },
  h2: ({ children }) => {
    const text = String(children);
    return (
      <h2
        id={slugifyHeading(text)}
        className="mb-3 mt-8 scroll-mt-24 border-b border-slate-100 pb-2 text-xl font-bold text-slate-800"
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const text = String(children);
    return (
      <h3
        id={slugifyHeading(text)}
        className="mb-2 mt-6 scroll-mt-24 text-lg font-semibold text-slate-800"
      >
        {children}
      </h3>
    );
  },
  p: ({ children }) => <p className="mb-6 leading-7 text-slate-700">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="my-8 rounded-r-md border-l-4 border-indigo-600 bg-slate-50 py-4 pl-6 italic text-slate-600">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-blue-600 underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-indigo-700">
        {children}
      </code>
    );
  },
};

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`blog-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
