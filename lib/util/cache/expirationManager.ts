/**
 * Internal helper for scheduling expirations on keyed collections.
 *
 * @typeParam K - Key type used to track timers.
 */
export class ExpirationManager<K> {
  private timers = new Map<K, ReturnType<typeof setTimeout>>();

  /**
   * Create a new expiration manager.
   *
   * @param defaultExpirationMs - Default expiration timeout for keys.
   * @param onExpire - Callback invoked when a key expires.
   */
  public constructor(
    private readonly defaultExpirationMs: number,
    private readonly onExpire: (key: K) => void,
  ) {}

  /**
   * Schedule (or reschedule) expiration for a key.
   *
   * @param key - Key to expire.
   * @param expirationMs - Optional timeout override in milliseconds.
   */
  public schedule(key: K, expirationMs?: number): void {
    this.cancel(key);
    const milliseconds = expirationMs ?? this.defaultExpirationMs;
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key);
        this.onExpire(key);
      }, milliseconds),
    );
  }

  /**
   * Cancel the expiration timer for a key, if one exists.
   *
   * @param key - Key whose timer should be cleared.
   */
  public cancel(key: K): void {
    const timer = this.timers.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Cancel all timers and reset the manager.
   */
  public clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
