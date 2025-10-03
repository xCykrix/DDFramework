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
  private items = new Set<T>();
  private timers = new Map<T, ReturnType<typeof setTimeout>>();

  /**
   * Create a new SetWithExpiration.
   * @param defaultExpirationMs Default expiration time in milliseconds for items added.
   */
  public constructor(private defaultExpirationMs: number) {}

  /**
   * Add an item to the set, with optional custom expiration time.
   * If the item already exists, its expiration timer is reset.
   * @param item The item to add.
   * @param expirationMs Optional expiration time in milliseconds for this item.
   * @returns The set instance (for chaining).
   */
  public add(item: T, expirationMs?: number): this {
    if (this.items.has(item)) {
      this.clearTimer(item);
    }
    this.items.add(item);
    const ms = expirationMs ?? this.defaultExpirationMs;
    this.timers.set(item, setTimeout(() => this.delete(item), ms));
    return this;
  }

  /**
   * Remove an item from the set and cancel its expiration timer.
   * @param item The item to remove.
   * @returns True if the item was present and removed, false otherwise.
   */
  public delete(item: T): boolean {
    this.clearTimer(item);
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
    for (const item of this.items) {
      this.clearTimer(item);
    }
    this.items.clear();
  }

  /**
   * Iterate over the items in the set.
   */
  public [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }

  /**
   * Cancel the expiration timer for a specific item, if present.
   * @param item The item whose timer should be cleared.
   */
  private clearTimer(item: T): void {
    const timer = this.timers.get(item);
    if (timer) clearTimeout(timer);
    this.timers.delete(item);
  }
}
