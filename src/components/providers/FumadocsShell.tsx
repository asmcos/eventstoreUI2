"use client";

import type { ReactNode } from "react";
import { TranslationProvider } from "@fuma-translate/react";
import { RootProvider } from "fumadocs-ui/provider/next";

/** 为 Fumadocs 组件（Link、Heading、CodeBlock）提供 Next.js 与 i18n 上下文 */
export default function FumadocsShell({ children }: { children: ReactNode }) {
  return (
    <RootProvider search={{ enabled: false }} theme={{ enabled: false }}>
      <TranslationProvider translations={{}}>{children}</TranslationProvider>
    </RootProvider>
  );
}
