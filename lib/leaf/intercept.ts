import type { DiscordFramework } from '@amethyst/ddframework';

/**
 * Wraps an async event handler to ensure errors are caught and logged via the framework's ledger.
 *
 * This utility is intended for use with Discord.js event handlers or any async callback
 * where unhandled promise rejections should be logged instead of crashing the process.
 *
 * @typeParam T - The argument types for the event handler.
 * @param framework - The DiscordFramework instance for logging errors.
 * @param id - A unique identifier for the handler, used in error logs.
 * @param asyncListener - The async function to wrap.
 * @returns A synchronous function that invokes the async handler and logs any errors.
 *
 * @example
 * client.on('messageCreate', intercept(framework, 'messageCreate', async (msg) => {
 *   // ...async logic...
 * }));
 */
export function intercept<T>(
  framework: DiscordFramework,
  id: string,
  asyncListener: (...args: T[]) => Promise<unknown>,
): (...args: T[]) => void {
  return (...args: T[]): void => {
    asyncListener(...args)
      .catch((e) => {
        framework.ledger.severe(`[Leaf Interceptor] Unhandled Error in Handler: ${id}`, {
          id,
          err: e,
          cause: e.cause,
        });
      });
  };
}
