export interface EventStoreItem {
  id: string;
  user: string;
  data: Record<string, unknown> & {
    title?: string;
    coverImgurl?: string;
    coverUrl?: string;
    content?: string;
  };
  labels?: string[];
  tags?: [string, string][];
  servertimestamp?: string;
}

export interface UserProfile {
  user: string;
  data: {
    displayName?: string;
    avatarUrl?: string;
    title?: string;
    bio?: string;
  };
}

export type BrowseLogs = Record<string, number>;
