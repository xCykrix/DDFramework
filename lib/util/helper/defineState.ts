import { StoredRetrievalGeneric } from '../../types.ts';

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
export function defineState<T>(state: StoredRetrievalGeneric<T> | StoredRetrievalGeneric<unknown>, expectedGroupId?: string): T {
  if (expectedGroupId !== undefined && state.groupId !== expectedGroupId) {
    throw new Deno.errors.InvalidData(`Expected groupId "${expectedGroupId}", but received "${state.groupId}".`);
  }
  return state.value as T;
}
