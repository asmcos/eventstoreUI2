import type { CSSProperties } from "react";

/** 将 HTML style 字符串转为 React 可用的 style 对象 */
export function htmlStyleToObject(
  style: string | CSSProperties | undefined
): CSSProperties | undefined {
  if (!style || typeof style !== "string") {
    return style as CSSProperties | undefined;
  }
  const result: Record<string, string> = {};
  for (const rule of style.split(";")) {
    const colon = rule.indexOf(":");
    if (colon === -1) continue;
    const key = rule.slice(0, colon).trim();
    const value = rule.slice(colon + 1).trim();
    if (!key || !value) continue;
    const camelKey = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * 修正粘贴内容里常见的非标准 HTML（如 ClawBot 截图：src 未加引号）
 */
export function normalizeMarkdownHtml(content: string): string {
  return content.replace(/<img\b([^>]*?)>/gi, (_tag, attrs: string) => {
    let normalized = attrs;
    if (!/\ssrc\s*=/.test(normalized)) return `<img${normalized}>`;
    normalized = normalized.replace(/\ssrc\s*=\s*([^\s"'=<>`]+)/i, ' src="$1"');
    return `<img${normalized}>`;
  });
}
