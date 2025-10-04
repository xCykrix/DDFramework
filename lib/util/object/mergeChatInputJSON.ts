import { deepMerge } from '../../../deps.ts';

/** Represents a single chat input option. */
type ChatInputOption = { name?: string; [key: string]: unknown };

/**
 * Custom merge function to intelligently merge arrays of ChatInputCommandJSON options.
 *
 * - Merges options by their `name` property.
 * - Recursively merges nested options.
 * - Combines unique options and preserves unnamed options.
 *
 * @param a The first array of ChatInputCommandJSON options.
 * @param b The second array of ChatInputCommandJSON options.
 * @returns The merged array of ChatInputCommandJSON options.
 */
export function mergeChatInputJSON(a: ChatInputOption[], b: ChatInputOption[]): ChatInputOption[] {
  if (!Array.isArray(a) || !Array.isArray(b)) return b ?? a;
  const mergedOptions: ChatInputOption[] = [];
  const map = new Map<string, ChatInputOption>();

  // Index all options from 'a' by name
  for (const opt of a) {
    if (opt && typeof opt.name === 'string') {
      map.set(opt.name, opt);
    } else {
      mergedOptions.push(opt);
    }
  }

  // Merge or add options from 'b'
  for (const opt of b) {
    if (opt && typeof opt.name === 'string') {
      if (map.has(opt.name)) {
        // Recursively merge if duplicate name
        map.set(
          opt.name,
          deepMerge.deepMerge.withOptions(
            {
              arrayMergeStrategy: 'unique',
              setMergeStrategy: 'combine',
              mapMergeStrategy: 'combine',
              customMergeFunctions: { Array: mergeChatInputJSON },
            },
            map.get(opt.name) ?? {},
            opt,
          ),
        );
      } else {
        map.set(opt.name, opt);
      }
    } else {
      mergedOptions.push(opt);
    }
  }

  // Combine merged named options and unnamed ones
  return [...map.values(), ...mergedOptions];
}
