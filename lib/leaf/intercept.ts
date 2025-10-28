import type { DiscordFramework } from '@amethyst/ddframework';
import type { ClientEventTypes } from 'discord.js';

/**
 * Type-safe intercept for Discord.js events.
 * @param framework Your framework instance.
 * @param label     A label for logging or tracing.
 * @param handler   The actual event handler.
 * @returns         The handler, with correct parameter types.
 */
export function intercept<
  K extends keyof ClientEventTypes,
>(
  event: K,
  framework: DiscordFramework,
  id: string,
  asyncListener: (...args: ClientEventTypes[K]) => Promise<void>,
): (...args: ClientEventTypes[K]) => void {
  return (...args: ClientEventTypes[K]): void => {
    asyncListener(...args)
      .catch((e) => {
        framework.ledger.severe(`[Leaf Interceptor] Unhandled Error in Handler`, {
          id,
          event,
          err: e,
          cause: e.cause,
        });
      });
  };
}
