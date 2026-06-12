"use client";

import { useEffect, useState } from "react";
import type { Highlighter } from "shiki";

const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
};

const SUPPORTED_LANGS = [
  "javascript",
  "typescript",
  "bash",
  "json",
  "html",
  "css",
  "markdown",
  "yaml",
  "python",
  "java",
  "go",
  "c",
  "rust",
  "text",
];

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["vitesse-light", "vitesse-dark"],
        langs: SUPPORTED_LANGS,
      })
    );
  }
  return highlighterPromise;
}

function resolveLang(lang: string): string {
  const normalized = lang.trim().toLowerCase().split(":")[0] ?? "text";
  const mapped = LANG_ALIASES[normalized] ?? normalized;
  return SUPPORTED_LANGS.includes(mapped) ? mapped : "text";
}

function resolveTheme(): "vitesse-light" | "vitesse-dark" {
  if (typeof window === "undefined") return "vitesse-light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "vitesse-dark"
    : "vitesse-light";
}

interface CodeBlockProps {
  code: string;
  lang?: string;
}

export default function CodeBlock({ code, lang = "" }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const displayLang = lang.trim() || "text";
  const lineCount = code.split("\n").length;
  const showDots = lineCount > 3;

  useEffect(() => {
    let cancelled = false;
    const targetLang = resolveLang(displayLang);

    void getHighlighter().then((highlighter) => {
      if (cancelled) return;
      try {
        const highlighted = highlighter.codeToHtml(code, {
          lang: targetLang,
          theme: resolveTheme(),
        });
        setHtml(highlighted);
      } catch {
        setHtml(
          `<pre class="shiki"><code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, displayLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="code-block">
      <div className="code-header">
        {showDots ? (
          <div className="code-header-left">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
        ) : (
          <span />
        )}
        <span>{displayLang}</span>
        <button type="button" className="copy-btn" onClick={handleCopy}>
          {copied ? "已复制!" : "复制"}
        </button>
      </div>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="shiki p-4 text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
