import { ulid } from '@std/ulid';
import { MapWithExpiration } from './util/cache/mapWIthExpiration.ts';

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
  ): {
    groupId: string;
    value: T;
  } | null {
    const retrieval = this.state.get(storageId) as StoredGeneric<T> | undefined;
    if (retrieval === undefined || (retrieval.userId !== userId)) return null;
    return {
      groupId: retrieval.groupId,
      value: retrieval.value,
    };
  }
}

/**
 * Casts an unknown state value to a strongly-typed value.
 *
 * This helper is a small, explicit type assertion helper used when the caller
 * knows the concrete type of a value retrieved from the state store but TypeScript
 * only sees it as `unknown`.
 *
 * IMPORTANT: this function performs an unchecked cast and does not perform any
 * runtime validation. Use it only when you are certain of the stored value's
 * structure (for example, immediately after creating a state entry or after
 * a runtime-validated parse).
 *
 * @typeParam T - The expected type of the state value.
 * @param state - The value to cast (commonly the result of a `StateManager.retrieve` call).
 * @returns The given `state` value asserted as type `T`.
 *
 * @example
 * // retrieving a typed packet from the state manager
 * const packet = defineState<MyPacketType>(stateManager.retrieve(id, userId));
 */
export function defineState<T>(state: unknown): T {
  return state as T;
}
