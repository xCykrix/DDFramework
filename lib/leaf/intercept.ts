import type { DiscordFramework } from '@amethyst/ddframework';

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
