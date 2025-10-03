/**
 * A Map-like collection where entries automatically expire after a specified time.
 *
 * Each entry added to the map will be removed after the expiration time elapses.
 * You can specify a default expiration for all entries, or override per entry.
 *
 * Example usage:
 *   const expMap = new MapWithExpiration<string, number>(5000); // 5 seconds default
 *   expMap.set('foo', 42); // expires in 5 seconds
 *   expMap.set('bar', 99, 10000); // expires in 10 seconds
 */
export class MapWithExpiration<K, V> implements Iterable<[K, V]> {
  private items = new Map<K, V>();
  private timers = new Map<K, ReturnType<typeof setTimeout>>();

  /**
   * Create a new MapWithExpiration.
   * @param defaultExpirationMs Default expiration time in milliseconds for entries added.
   */
  public constructor(private defaultExpirationMs: number) {}

  /**
   * Add or update an entry, with optional custom expiration time.
   * If the key already exists, its expiration timer is reset.
   * @param key The key to set.
   * @param value The value to set.
   * @param expirationMs Optional expiration time in milliseconds for this entry.
   * @returns The map instance (for chaining).
   */
  public set(key: K, value: V, expirationMs?: number): this {
    if (this.items.has(key)) {
      this.clearTimer(key);
    }
    this.items.set(key, value);
    const ms = expirationMs ?? this.defaultExpirationMs;
    this.timers.set(key, setTimeout(() => this.delete(key), ms));
    return this;
  }

  /**
   * Remove an entry and cancel its expiration timer.
   * @param key The key to remove.
   * @returns True if the entry was present and removed, false otherwise.
   */
  public delete(key: K): boolean {
    this.clearTimer(key);
    return this.items.delete(key);
  }

  /**
   * Check if a key exists in the map.
   * @param key The key to check.
   * @returns True if the key is present, false otherwise.
   */
  public has(key: K): boolean {
    return this.items.has(key);
  }

  /**
   * Get the value for a key, or undefined if not present.
   * @param key The key to get.
   * @returns The value, or undefined.
   */
  public get(key: K): V | undefined {
    return this.items.get(key);
  }

  /**
   * Get the number of entries currently in the map.
   */
  public get size(): number {
    return this.items.size;
  }

  /**
   * Remove all entries and cancel all expiration timers.
   */
  public clear(): void {
    for (const key of this.items.keys()) {
      this.clearTimer(key);
    }
    this.items.clear();
  }

  /**
   * Iterate over the entries in the map.
   */
  public [Symbol.iterator](): Iterator<[K, V]> {
    return this.items[Symbol.iterator]();
  }

  /**
   * Cancel the expiration timer for a specific key, if present.
   * @param key The key whose timer should be cleared.
   */
  private clearTimer(key: K): void {
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    this.timers.delete(key);
  }
}
