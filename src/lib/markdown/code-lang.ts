/** 无语言标注时：JSON 形状 → json，否则 → bash */
export function inferFenceLang(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "bash";

  const first = trimmed[0];
  if (first === "{" || first === "[") {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      if (/^[\[{][\s\S]*[\]}]\s*$/.test(trimmed)) return "json";
    }
  }

  return "bash";
}

export const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  terminal: "bash",
  yml: "yaml",
  md: "markdown",
  html: "xml",
  htm: "xml",
  jsonc: "json",
  json5: "json",
};

export const REGISTERED_LANGS = new Set([
  "javascript",
  "typescript",
  "bash",
  "shell",
  "sh",
  "json",
  "xml",
  "css",
  "markdown",
  "yaml",
  "python",
  "java",
  "go",
  "c",
  "rust",
  "plaintext",
]);

/** 未标注或 text/txt 时默认 bash；未知语言回退 plaintext */
export function resolveHighlightLang(lang: string): string {
  const raw = lang.trim().toLowerCase().split(":")[0] ?? "";
  if (!raw || raw === "text" || raw === "txt") return "bash";
  const mapped = LANG_ALIASES[raw] ?? raw;
  return REGISTERED_LANGS.has(mapped) ? mapped : "plaintext";
}

export function displayLangLabel(lang: string): string {
  const raw = lang.trim().split(":")[0] ?? "";
  return raw || "bash";
}
