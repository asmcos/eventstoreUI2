export class WebStorage {
  constructor(private readonly storage: Storage) {}

  get(key: string): string | null {
    return this.storage.getItem(`es:${key}`);
  }

  set(key: string, value: string): void {
    this.storage.setItem(`es:${key}`, value);
  }

  remove(key: string): void {
    this.storage.removeItem(`es:${key}`);
  }
}
