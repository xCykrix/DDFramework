import { ulid } from '../../deps.ts';
import { MapWithExpiration } from './cache/mapWithExpiration.ts';

/**
 * Options for managing state entries in StateManager.
 */
type StateOptions = {
  /** Optional user ID associated with the state entry. */
  userId?: string;
  /** Optional expiration time in milliseconds for the state entry. */
  deleteAfterMs?: number;
};

/**
 * Represents a stored state entry in StateManager.
 *
 * @typeParam T - The type of value stored.
 */
type StoredGeneric<T> = {
  /** Group identifier for categorizing the state entry. */
  groupId: string;
  /** Unique storage ID for the state entry. */
  storageId: string;
  /** Optional user ID associated with the state entry. */
  userId?: string;
  /** The value stored in the state entry. */
  value: T;
};

/**
 * A utility class for managing temporary state entries with expiration.
 *
 * Each state entry is associated with a unique storageId and can optionally be tied to a userId.
 *
 * @private
 * @remarks This class is used internally by DDFramework and is not intended for direct initialization by end-users.
 */
export class StateManager {
  private state = new MapWithExpiration<string, StoredGeneric<unknown>>(5 * 60 * 1000);

  /**
   * Creates a new state entry with a unique storageId, storing the provided packet and associated metadata.
   *
   * @param groupId - A group identifier to categorize the state entry.
   * @param packet - The data to be stored in the state.
   * @param options - Optional parameters for state management.
   * @returns The storageId of the created state entry.
   */
  public make(
    groupId: string,
    packet: unknown,
    options?: StateOptions,
  ): string {
    const storageId = ulid();
    this.state.set(storageId, {
      groupId,
      storageId,
      userId: options?.userId,
      value: packet,
    }, options?.deleteAfterMs);
    return storageId;
  }

  /**
   * Retrieves a value from the state cache by its storageId and the userId.
   *
   * @typeParam T - The type of value stored.
   * @param storageId - The storage ID of the state entry.
   * @param userId - The user ID to match for retrieval.
   * @returns The stored value if found and the userId matches, otherwise null.
   */
  public retrieve<T>(
    storageId: string,
    userId: string,
  ): T | null {
    const retrieval = this.state.get(storageId) as StoredGeneric<T> | undefined;
    if (retrieval === undefined || (retrieval.userId !== userId)) return null;
    return retrieval.value;
  }
}
