"use client";

import { subscribeCollect, subscribeFirst } from "./promise";
import {
  blog_counts,
  book_counts,
  create_blog,
  create_book,
  create_chapter,
  get_blog_id,
  get_blogs,
  get_book_id,
  get_books,
  get_chapter_author,
  update_book,
} from "./esclient";

type EsMessage = {
  code?: number;
  id?: string;
  user?: string;
  data?: string;
  counts?: number;
  tags?: [string, string][];
};

export async function collectBlogs(
  pubkey: string,
  offset: number,
  limit: number
): Promise<EsMessage[]> {
  return subscribeCollect<EsMessage>((cb) => get_blogs(pubkey, 0, offset, limit, cb));
}

export async function fetchBlogCount(pubkey: string): Promise<number> {
  const msg = await subscribeFirst<EsMessage>((cb) => blog_counts(pubkey, cb));
  return msg?.code === 200 ? (msg.counts ?? 0) : 0;
}

export async function fetchBookCount(pubkey: string): Promise<number> {
  const msg = await subscribeFirst<EsMessage>((cb) => book_counts(pubkey, cb));
  return msg?.code === 200 ? (msg.counts ?? 0) : 0;
}

export async function fetchBlogById(blogId: string): Promise<EsMessage | null> {
  return subscribeFirst<EsMessage>((cb) => get_blog_id(blogId, cb));
}

export async function fetchBookByIdClient(bookId: string): Promise<EsMessage | null> {
  return subscribeFirst<EsMessage>((cb) => get_book_id(bookId, cb));
}

export async function fetchChapterByAuthor(
  bookId: string,
  chapterName: string | number,
  authorPubkey: string
): Promise<string> {
  const msg = await subscribeFirst<EsMessage>((cb) =>
    get_chapter_author(bookId, String(chapterName), authorPubkey, cb)
  );
  return msg?.data ?? "";
}

export function saveBlog(
  blogData: Record<string, unknown>,
  pubkey: string,
  privkey: Uint8Array
): Promise<{ code: number; id?: string }> {
  return new Promise((resolve) => {
    let createdId: string | undefined;
    void create_blog(JSON.stringify(blogData), pubkey, privkey, (message: EsMessage) => {
      if (message.code === 201) {
        createdId = message.id;
        return;
      }
      resolve({ code: message.code ?? 500, id: createdId ?? blogData.blogId as string | undefined });
    });
  });
}

export function saveBook(
  bookInfo: Record<string, unknown>,
  pubkey: string,
  privkey: Uint8Array
): Promise<{ code: number; id?: string }> {
  return new Promise((resolve) => {
    let createdId: string | undefined;
    void create_book(bookInfo, pubkey, privkey, (message: EsMessage) => {
      if (message.code === 201) {
        createdId = message.id;
        return;
      }
      resolve({ code: message.code ?? 500, id: createdId });
    });
  });
}

export function patchBook(
  bookInfo: Record<string, unknown>,
  bookId: string,
  pubkey: string,
  privkey: Uint8Array
): Promise<{ code: number; message?: string }> {
  return new Promise((resolve) => {
    void update_book(bookInfo, bookId, pubkey, privkey, (message: EsMessage & { message?: string }) => {
      resolve({ code: message.code ?? 500, message: message.message });
    });
  });
}

export function saveChapter(
  bookId: string,
  content: string,
  chapterName: string | number,
  pubkey: string,
  privkey: Uint8Array
): Promise<{ code: number }> {
  return new Promise((resolve) => {
    void create_chapter(bookId, content, chapterName, pubkey, privkey, (message: EsMessage) => {
      resolve({ code: message.code ?? 500 });
    });
  });
}

export async function collectBooks(pubkey: string, offset: number, limit: number): Promise<EsMessage[]> {
  return subscribeCollect<EsMessage>((cb) => get_books(pubkey, offset, limit, cb));
}
