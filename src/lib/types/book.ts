export interface OutlineItem {
  id: string;
  title: string;
  type: "chapter" | "folder";
  children?: OutlineItem[];
}

export interface BookDetailData {
  book: import("./events").EventStoreItem;
  rawBookId: string;
  shortBookId: string;
  outline: OutlineItem[];
  firstChapterId: string | null;
  firstChapterContent: string;
  authorName: string;
  authorProfile?: import("./events").UserProfile;
}
