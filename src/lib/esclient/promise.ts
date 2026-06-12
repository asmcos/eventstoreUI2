type Callback<T> = (message: T | "EOSE") => void;

const DEFAULT_TIMEOUT_MS = 5000;

export function subscribeCollect<T>(
  subscribe: (callback: Callback<T>) => void | Promise<void>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T[]> {
  return new Promise((resolve) => {
    const items: T[] = [];
    let settled = false;

    const finish = (result: T[]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => finish(items), timeoutMs);

    void subscribe((message) => {
      if (message === "EOSE") {
        finish(items);
      } else if (message) {
        items.push(message);
      }
    });
  });
}

export function subscribeFirst<T>(
  subscribe: (callback: Callback<T>) => void | Promise<void>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: T | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    void subscribe((message) => {
      if (message === "EOSE") {
        finish(null);
      } else if (message) {
        finish(message);
      }
    });
  });
}
