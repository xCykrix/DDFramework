# Copilot Instructions for DDFramework

## Overview
- **DDFramework** is a Deno-based framework, likely for Discord bots or similar event-driven applications, leveraging the Discordeno library and DDCacheProxy for caching.
- The project is in early stages or is a minimal template; core logic is expected to be implemented in `mod.ts` and under `lib/`.
- All code is TypeScript, using strict linting and formatting rules as defined in `deno.jsonc`.

## Key Files & Structure
- `mod.ts`: Intended as the main entry point (currently empty).
- `deps.ts`: Centralizes all external dependencies. Use this file for all imports from third-party modules.
- `lib/`: Reserved for framework/library code. `lib/helper/` is present but currently empty.
- `deno.jsonc`: Contains strict compiler, lint, and formatting settings. Always run `deno lint` and `deno fmt` before committing.

## External Dependencies
- Use only the dependencies re-exported in `deps.ts`:
  - `Discordeno` (Discord bot framework)
  - `DDCacheProxy` (caching)
  - `@std/ulid` (unique IDs)
- Avoid direct imports from npm/jsr in other files; always go through `deps.ts`.

## Coding Conventions
- TypeScript strict mode is enforced. All code must pass strict type checks.
- Linting rules are strict and include custom rules (see `deno.jsonc`).
- Formatting: 2 spaces, no tabs, line width 1024, always use semicolons and single quotes.
- Use explicit function return types and module boundary types.
- Do not use Node.js `node_modules` (see `nodeModulesDir: none`).

## Workflows
- **Build/Run:** Use Deno CLI (`deno run mod.ts` or `deno task` if tasks are defined in the future).
- **Lint:** `deno lint`
- **Format:** `deno fmt`
- **Testing:** No tests or test framework present yet; add tests under `lib/` if needed.

## Project-Specific Patterns
- All external imports must be routed through `deps.ts`.
- No direct file system access unless explicitly enabled (see commented-out `@std/fs` import).
- License is restrictive: copying, modifying, or distributing is prohibited.

## Example: Importing a Dependency
```typescript
import { getULID } from './deps.ts';
```

## Contributing
- Follow the strict lint/format rules.
- Do not add new dependencies directly; update `deps.ts`.
- Respect the license: do not copy or distribute code externally.

---
_If you are unsure about a workflow or pattern, check `deno.jsonc` and `deps.ts` for guidance._
