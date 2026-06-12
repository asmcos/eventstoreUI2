import "server-only";

import { get_chapter_author,
  get_books,
  get_blogs,
  get_users_profile,
  get_browselog_count,
  get_book_id,
  get_book_shortid,
  get_blog_id,
  get_blog_shortid,
  get_topic_id,
  get_topic_shortid,
  get_topics,
  ensureConnected,
} from "./esclient";
import { subscribeCollect } from "./promise";
import type { BrowseLogs, EventStoreItem, UserProfile } from "@/lib/types/events";
import type { BookDetailData, OutlineItem } from "@/lib/types/book";
import { findFirstChapter, findChapterInOutline, isChapterInOutline, normalizeOutlineItems, normalizeChapterId } from "@/lib/book/outline";
import { getTagValue, normalizeEventId } from "@/lib/utils/ids";

const DEFAULT_TIMEOUT_MS = 5000;

async function withEventStore<T>(fn: () => Promise<T>): Promise<T> {
  const connected = await ensureConnected(DEFAULT_TIMEOUT_MS);
  if (!connected) {
    throw new Error("EventStore WebSocket 连接失败，请确认 ws://127.0.0.1:8080 服务已启动");
  }
  return fn();
}

function parseBookData(event: EventStoreItem): EventStoreItem {
  if (typeof event.data === "string") {
    try {
      return { ...event, data: JSON.parse(event.data) };
    } catch {
      return event;
    }
  }
  return event;
}

export async function fetchChapterContent(
  rawBookId: string,
  chapterName: string,
  authorPubkey: string
): Promise<string> {
  return withEventStore(async () => {
    const raw = await subscribeCollect<{ data?: string } | string>((cb) =>
      get_chapter_author(rawBookId, chapterName, authorPubkey, cb)
    );
    const chapter = raw.find(
      (m) => m && m !== "EOSE" && typeof m === "object" && "data" in m && m.data
    ) as { data?: string } | undefined;
    return chapter?.data ?? "";
  });
}

export async function fetchBookDetailData(
  shortBookId: string,
  requestedChapterId?: string | null
): Promise<BookDetailData | null> {
  const book = await fetchBookById(shortBookId);
  if (!book) return null;

  const parsed = parseBookData(book);
  const rawBookId = getTagValue(parsed.tags, "d") || parsed.id;
  const authorPubkey = parsed.user;

  let outline: OutlineItem[] = [];
  try {
    const outlineRaw = await fetchChapterContent(rawBookId, "outline.md", authorPubkey);
    if (outlineRaw) outline = normalizeOutlineItems(JSON.parse(outlineRaw) as OutlineItem[]);
  } catch {
    outline = [];
  }

  const defaultChapter = findFirstChapter(outline);
  let targetChapter = defaultChapter;

  if (requestedChapterId && isChapterInOutline(outline, requestedChapterId)) {
    targetChapter = findChapterInOutline(outline, requestedChapterId) ?? defaultChapter;
  }

  let chapterContent = "";
  if (targetChapter) {
    chapterContent = await fetchChapterContent(
      rawBookId,
      normalizeChapterId(targetChapter.id),
      authorPubkey
    );
  }

  const profiles = await fetchUsersProfile([authorPubkey]);
  const authorProfile = profiles[authorPubkey];
  const data = parsed.data as Record<string, string>;

  return {
    book: parsed,
    rawBookId,
    shortBookId,
    outline,
    firstChapterId: targetChapter ? normalizeChapterId(targetChapter.id) : null,
    firstChapterContent: chapterContent,
    authorName: data.author ?? authorProfile?.data.displayName ?? "",
    authorProfile,
  };
}

function parseBlogData(event: EventStoreItem): EventStoreItem {
  if (typeof event.data === "string") {
    try {
      return { ...event, data: JSON.parse(event.data) };
    } catch {
      return event;
    }
  }
  return event;
}

function parseProfileData(event: UserProfile): UserProfile {
  if (typeof event.data === "string") {
    try {
      return { ...event, data: JSON.parse(event.data as unknown as string) };
    } catch {
      return event;
    }
  }
  return event;
}

export async function fetchBooks(
  offset = 0,
  limit = 10
): Promise<EventStoreItem[]> {
  return withEventStore(async () => {
    const raw = await subscribeCollect<EventStoreItem>((cb) =>
      get_books(null, offset, limit, cb)
    );
    return raw.filter(Boolean).map(normalizeEventId);
  });
}

export async function fetchBlogs(
  offset = 0,
  limit = 10
): Promise<EventStoreItem[]> {
  return withEventStore(async () => {
    const raw = await subscribeCollect<EventStoreItem>((cb) =>
      get_blogs(null, 0, offset, limit, cb)
    );
    return raw
      .filter(Boolean)
      .map(normalizeEventId)
      .map(parseBlogData);
  });
}

export async function fetchTopics(
  offset = 0,
  limit = 10
): Promise<EventStoreItem[]> {
  return withEventStore(async () => {
    const raw = await subscribeCollect<EventStoreItem>((cb) =>
      get_topics(null, 0, offset, limit, cb)
    );
    return raw
      .filter(Boolean)
      .map(normalizeEventId)
      .map(parseBlogData);
  });
}

export async function fetchUsersProfile(
  pubkeys: string[]
): Promise<Record<string, UserProfile>> {
  if (pubkeys.length === 0) return {};
  const raw = await subscribeCollect<UserProfile>((cb) =>
    get_users_profile(pubkeys, cb)
  );
  const profiles: Record<string, UserProfile> = {};
  for (const item of raw) {
    if (item?.user) {
      profiles[item.user] = parseProfileData(item);
    }
  }
  return profiles;
}

export async function fetchBrowseLogs(ids: string[]): Promise<BrowseLogs> {
  if (ids.length === 0) return {};
  const result = await subscribeCollect<{ code: number; counts?: { targetId: string; count: number }[] }>(
    (cb) => get_browselog_count(ids, cb)
  );
  const logs: BrowseLogs = {};
  for (const message of result) {
    if (message?.code === 200 && message.counts) {
      for (const count of message.counts) {
        logs[count.targetId] = count.count;
      }
    }
  }
  return logs;
}

export interface HomePageData {
  books: EventStoreItem[];
  blogs: EventStoreItem[];
  usersProfile: Record<string, UserProfile>;
  browseLogs: BrowseLogs;
  backendError?: string;
}

export async function fetchHomePageData(): Promise<HomePageData> {
  try {
    const [books, blogs] = await Promise.all([
      fetchBooks(0, 4),
      fetchBlogs(0, 3),
    ]);

    const userPubkeys = [...new Set(blogs.map((b) => b.user).filter(Boolean))];
    const ids = [...books, ...blogs].map((item) => item.id);

    const [usersProfile, browseLogs] = await Promise.all([
      fetchUsersProfile(userPubkeys),
      fetchBrowseLogs(ids),
    ]);

    const empty = books.length === 0 && blogs.length === 0;
    return {
      books,
      blogs,
      usersProfile,
      browseLogs,
      backendError: empty
        ? "EventStore 已连接但未返回数据，请确认 MongoDB 已启动且数据库中有内容（mongod + eventstore 服务）"
        : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "EventStore 数据获取失败";
    return {
      books: [],
      blogs: [],
      usersProfile: {},
      browseLogs: {},
      backendError: message,
    };
  }
}

export async function fetchBookById(bookId: string): Promise<EventStoreItem | null> {
  let sUserId: string | null = null;
  let sBookId: string | null = null;
  let rawId: string | null = bookId;

  if (bookId.includes("-")) {
    [sUserId, sBookId] = bookId.split("-");
    rawId = null;
  }

  const raw = await subscribeCollect<EventStoreItem>((cb) => {
    if (rawId) {
      get_book_id(rawId, cb);
    } else if (sUserId && sBookId) {
      get_book_shortid(sUserId, sBookId, cb);
    } else {
      cb("EOSE");
    }
  });

  const book = raw.find(Boolean);
  return book ? normalizeEventId(book) : null;
}

export async function fetchBlogById(blogId: string): Promise<EventStoreItem | null> {
  let sUserId: string | null = null;
  let sBlogId: string | null = null;
  let rawId: string | null = blogId;

  if (blogId.includes("-")) {
    [sUserId, sBlogId] = blogId.split("-");
    rawId = null;
  }

  const raw = await subscribeCollect<EventStoreItem & { code?: number }>((cb) => {
    if (rawId) {
      get_blog_id(rawId, cb);
    } else if (sUserId && sBlogId) {
      get_blog_shortid(sUserId, sBlogId, cb);
    } else {
      cb("EOSE");
    }
  });

  const blog = raw.find(Boolean);
  if (!blog || (blog.code !== undefined && blog.code !== 200)) return null;
  return parseBlogData(normalizeEventId(blog as EventStoreItem));
}

export async function fetchTopicById(topicId: string): Promise<EventStoreItem | null> {
  let sUserId: string | null = null;
  let sTopicId: string | null = null;
  let rawId: string | null = topicId;

  if (topicId.includes("-")) {
    [sUserId, sTopicId] = topicId.split("-");
    rawId = null;
  }

  const raw = await subscribeCollect<EventStoreItem & { code?: number }>((cb) => {
    if (rawId) {
      get_topic_id(rawId, cb);
    } else if (sUserId && sTopicId) {
      get_topic_shortid(sUserId, sTopicId, cb);
    } else {
      cb("EOSE");
    }
  });

  const topic = raw.find(Boolean);
  if (!topic || (topic.code !== undefined && topic.code !== 200)) return null;
  return parseBlogData(normalizeEventId(topic as EventStoreItem));
}

export function getPublishedStatus(event: EventStoreItem): string | null {
  return getTagValue(event.tags, "s");
}
