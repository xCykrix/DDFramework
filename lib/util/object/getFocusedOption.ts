import type { Discordeno } from '../../../deps.ts';

/**
 * Find the focused option in a (possibly nested) options array from an interaction.
 *
 * Many Discord application command interactions include an `options` array which may contain
 * subcommands or subcommand groups. Only one option in the entire tree may be marked with
 * `focused: true` during an autocomplete interaction. This utility traverses the tree and
 * returns that option.
 *
 * @param options - The options array to search, or `undefined` when there are none.
 * @returns The focused {@link Discordeno.InteractionDataOption} if present, otherwise `undefined`.
 * @example
 * // Single-level search
 * getFocusedOption([{ name: 'query', focused: true }]);
 * // -> { name: 'query', focused: true }
 *
 * @example
 * // Nested search
 * getFocusedOption([{ name: 'group', options: [{ name: 'sub', focused: true }] }]);
 * // -> { name: 'sub', focused: true }
 *
 * @remarks
 * This function performs a depth-first search; its runtime is linear in the number of options
 * in the tree.
 */
export function getFocusedOption(options: Discordeno.InteractionDataOption[] | undefined): Discordeno.InteractionDataOption | undefined {
  if (!options) return undefined;
  for (const opt of options) {
    if (opt.focused) return opt;
    if (opt.options) {
      const found = getFocusedOption(opt.options);
      if (found) return found;
    }
  }
  return undefined;
}
