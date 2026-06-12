"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface SimpleMDERef {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  isReady: () => boolean;
}

interface SimpleMDEEditorProps {
  initialValue?: string;
  minHeight?: number;
  onChange?: (value: string) => void;
  onPasteImage?: (file: File | Blob) => Promise<string | null>;
  onReady?: () => void;
}

interface SimpleMDEInstance {
  value: (v?: string) => string;
  codemirror: {
    hasFocus: () => boolean;
    getCursor: () => { line: number; ch: number };
    replaceRange: (text: string, cursor: { line: number; ch: number }) => void;
    setCursor: (line: number, ch: number) => void;
    refresh: () => void;
    on: (event: string, handler: (cm: unknown, event: ClipboardEvent) => void) => void;
  };
  toTextArea: () => void;
}

declare global {
  interface Window {
    SimpleMDE?: new (options: Record<string, unknown>) => SimpleMDEInstance;
  }
}

let loadPromise: Promise<void> | null = null;

function loadSimpleMDE(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.SimpleMDE) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[href="/lib/simplemde/simplemde.min.css"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/lib/simplemde/simplemde.min.css";
      document.head.appendChild(css);
    }

    const script = document.createElement("script");
    script.src = "/lib/simplemde/simplemde.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("SimpleMDE 加载失败"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

function safeDestroyEditor(instance: SimpleMDEInstance | null) {
  if (!instance) return;
  try {
    instance.toTextArea();
  } catch {
    /* ignore */
  }
}

function insertImageMarkdown(instance: SimpleMDEInstance, url: string) {
  const cm = instance.codemirror;
  const cursor = cm.getCursor();
  cm.replaceRange(`![图片](${url})\n`, cursor);
  cm.setCursor(cursor.line + 1, 0);
}

const SimpleMDEEditor = forwardRef<SimpleMDERef, SimpleMDEEditorProps>(function SimpleMDEEditor(
  { initialValue = "", minHeight = 320, onChange, onPasteImage, onReady },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<SimpleMDEInstance | null>(null);
  const mountedRef = useRef(true);
  const onChangeRef = useRef(onChange);
  const onPasteImageRef = useRef(onPasteImage);
  const onReadyRef = useRef(onReady);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    onChangeRef.current = onChange;
    onPasteImageRef.current = onPasteImage;
    onReadyRef.current = onReady;
  });

  useImperativeHandle(ref, () => ({
    getValue: () => editorRef.current?.value() ?? "",
    setValue: (value: string) => {
      if (editorRef.current) {
        editorRef.current.value(value);
        editorRef.current.codemirror.refresh();
      }
    },
    focus: () => editorRef.current?.codemirror.refresh(),
    isReady: () => editorRef.current !== null,
  }));

  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    const textarea = document.createElement("textarea");
    container.appendChild(textarea);

    void loadSimpleMDE().then(() => {
      if (!mountedRef.current || !window.SimpleMDE || !container.isConnected) return;

      const insertImageButton = {
        name: "insertImage",
        action: function (editor: SimpleMDEInstance) {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.addEventListener("change", () => {
            const file = input.files?.[0];
            if (!file || !onPasteImageRef.current || !mountedRef.current) return;
            void onPasteImageRef.current(file).then((url) => {
              if (!url || !mountedRef.current || editorRef.current !== editor) return;
              insertImageMarkdown(editor, url);
            });
          });
          input.click();
        },
        className: "fa fa-camera",
        title: "上传图片",
      };

      const instance = new window.SimpleMDE({
        element: textarea,
        autoDownloadFontAwesome: false,
        spellChecker: false,
        toolbar: [
          "heading-1",
          "heading-2",
          "heading-3",
          "|",
          "bold",
          "italic",
          "strikethrough",
          "|",
          "unordered-list",
          "ordered-list",
          "|",
          "link",
          "image",
          "table",
          "|",
          "quote",
          "code",
          "|",
          "preview",
          "side-by-side",
          "fullscreen",
          insertImageButton,
          "|",
          "guide",
        ],
        initialValue: initialValueRef.current,
        minHeight: String(minHeight),
      });

      if (!mountedRef.current) {
        safeDestroyEditor(instance);
        return;
      }

      editorRef.current = instance;

      instance.codemirror.on("change", () => {
        if (!mountedRef.current) return;
        onChangeRef.current?.(instance.value());
      });

      if (onPasteImageRef.current) {
        instance.codemirror.on("paste", (_cm, event) => {
          const items = event.clipboardData?.items;
          if (!items) return;
          for (const item of items) {
            if (item.kind === "file" && item.type.includes("image")) {
              const blob = item.getAsFile();
              if (!blob) continue;
              event.preventDefault();
              void onPasteImageRef.current!(blob).then((url) => {
                if (!url || !mountedRef.current || editorRef.current !== instance) return;
                insertImageMarkdown(instance, url);
              });
              break;
            }
          }
        });
      }

      onReadyRef.current?.();
    });

    return () => {
      mountedRef.current = false;
      safeDestroyEditor(editorRef.current);
      editorRef.current = null;
      container.innerHTML = "";
    };
    // 仅挂载一次；内容更新由 ref.setValue 负责
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="simplemde-container w-full" />;
});

export default SimpleMDEEditor;
