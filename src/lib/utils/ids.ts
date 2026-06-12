import type { EventStoreItem } from "@/lib/types/events";

export function getTagValue(
  tags: [string, string][] | undefined,
  key: string
): string | null {
  const tag = tags?.find((t) => t[0] === key);
  return tag ? tag[1] : null;
}

export function normalizeEventId(event: EventStoreItem): EventStoreItem {
  const dTag = getTagValue(event.tags, "d");
  if (dTag) {
    return { ...event, id: dTag };
  }
  return event;
}

export function getShortBookId(book: EventStoreItem): string {
  return `${book.user.substring(0, 8)}-${book.id.substring(0, 8)}`;
}

export function getShortBlogId(blog: EventStoreItem): string {
  return `${blog.user.substring(0, 8)}-${blog.id.substring(0, 8)}`;
}

export function getShortTopicId(topic: EventStoreItem): string {
  return `${topic.user.substring(0, 8)}-${topic.id.substring(0, 8)}`;
}
