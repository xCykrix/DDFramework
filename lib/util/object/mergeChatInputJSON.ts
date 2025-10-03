import { deepMerge } from '../../../deps.ts';

const mergeChatInputJSON = (a: any[], b: any[]): any[] => {
  if (!Array.isArray(a) || !Array.isArray(b)) return b ?? a;
  const mergedOptions: typeof a = [];
  const map = new Map<string, any>();

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
            map.get(opt.name),
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
};
