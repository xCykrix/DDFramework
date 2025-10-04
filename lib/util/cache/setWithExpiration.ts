import { ExpirationManager } from './expirationManager.ts';

/**
 * A Set-like collection where items automatically expire after a specified time.
 *
 * Each item added to the set will be removed after the expiration time elapses.
 * You can specify a default expiration for all items, or override per item.
 *
 * Example usage:
 *   const expSet = new SetWithExpiration<string>(5000); // 5 seconds default
 *   expSet.add('foo'); // expires in 5 seconds
 *   expSet.add('bar', 10000); // expires in 10 seconds
 */
export class SetWithExpiration<T> implements Iterable<T> {
  private readonly items = new Set<T>();
  private readonly expirations: ExpirationManager<T>;

  /**
   * Create a new SetWithExpiration.
   * @param defaultExpirationMs Default expiration time in milliseconds for items added.
   */
  public constructor(defaultExpirationMs: number) {
    this.expirations = new ExpirationManager<T>(defaultExpirationMs, (item) => {
      this.items.delete(item);
    });
  }

  /**
   * Add an item to the set, with optional custom expiration time.
   * If the item already exists, its expiration timer is reset.
   * @param item The item to add.
   * @param expirationMs Optional expiration time in milliseconds for this item.
   * @returns The set instance (for chaining).
   */
  public add(item: T, expirationMs?: number): this {
    this.items.add(item);
    this.expirations.schedule(item, expirationMs);
    return this;
  }

  /**
   * Remove an item from the set and cancel its expiration timer.
   * @param item The item to remove.
   * @returns True if the item was present and removed, false otherwise.
   */
  public delete(item: T): boolean {
    this.expirations.cancel(item);
    return this.items.delete(item);
  }

  /**
   * Check if an item exists in the set.
   * @param item The item to check.
   * @returns True if the item is present, false otherwise.
   */
  public has(item: T): boolean {
    return this.items.has(item);
  }

  /**
   * Get the number of items currently in the set.
   */
  public get size(): number {
    return this.items.size;
  }

  /**
   * Remove all items from the set and cancel all expiration timers.
   */
  public clear(): void {
    this.expirations.clear();
    this.items.clear();
  }

  /**
   * Iterate over the items in the set.
   */
  public [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }
}
