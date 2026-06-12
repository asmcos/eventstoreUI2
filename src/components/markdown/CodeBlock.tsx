"use client";

import { useMemo, useState } from "react";
import hljs from "highlight.js/lib/core";
import type { LanguageFn } from "highlight.js";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  html: "xml",
};

const REGISTERED = new Set<string>();

function registerLang(name: string, lang: LanguageFn) {
  if (REGISTERED.has(name)) return;
  hljs.registerLanguage(name, lang);
  REGISTERED.add(name);
}

registerLang("javascript", javascript);
registerLang("typescript", typescript);
registerLang("bash", bash);
registerLang("json", json);
registerLang("xml", xml);
registerLang("css", css);
registerLang("markdown", markdown);
registerLang("yaml", yaml);
registerLang("python", python);
registerLang("java", java);
registerLang("go", go);
registerLang("c", c);
registerLang("rust", rust);

function resolveLang(lang: string): string {
  const normalized = lang.trim().toLowerCase().split(":")[0] ?? "";
  const mapped = LANG_ALIASES[normalized] ?? normalized;
  return REGISTERED.has(mapped) ? mapped : "";
}

function highlightCode(code: string, lang: string): string {
  const targetLang = resolveLang(lang);
  if (targetLang) {
    try {
      return hljs.highlight(code, { language: targetLang, ignoreIllegals: true }).value;
    } catch {
      /* fall through */
    }
  }
  try {
    return hljs.highlightAuto(code).value;
  } catch {
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

interface CodeBlockProps {
  code: string;
  lang?: string;
}

export default function CodeBlock({ code, lang = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const displayLang = lang.trim() || "text";
  const lineCount = code.split("\n").length;
  const showDots = lineCount > 3;

  const html = useMemo(() => highlightCode(code, displayLang), [code, displayLang]);

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
      <pre className="hljs">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
