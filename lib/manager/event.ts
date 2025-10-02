import type { DDFrameworkDesiredProperties } from '../desired.ts';
import type { DDFrameworkOptions } from '../options.ts';
import type { BotWithCacheProxy } from '../util/client.ts';

export type EventParameters<
  Z extends DDFrameworkDesiredProperties,
  T extends BotWithCacheProxy<Z>,
  K extends keyof T['events'],
> = NonNullable<T['events'][K]> extends (...args: infer P) => unknown ? P : never;

// export type EventParameters<T extends keyof typeof DiscordMod.client.events> = Parameters<NonNullable<typeof DiscordMod.client.events[T]>>;

export class EventManager<Z extends DDFrameworkDesiredProperties, T extends BotWithCacheProxy<Z>> {
  private bot: T;
  private events: {
    // deno-lint-ignore no-explicit-any
    [key in keyof T['events']]?: Set<(...args: unknown[]) => Promise<void>>;
  } = {};

  public constructor(bot: T, options: DDFrameworkOptions) {
    this.bot = bot;
    for (const k of Object.keys(bot.events)) {
      const key = k as keyof typeof bot.events;
      this.events[key] = new Set();
    }
    for (const k of Object.keys(bot.events)) {
      const key = k as keyof typeof bot.events;
      bot.events[key] = (...args: Parameters<NonNullable<typeof bot.events[typeof key]>>) => {
        for (const callback of this.events[key]!) {
          callback(...args).catch((e) => options.errorHandler(e));
        }
      };
    }
  }

  public add<TZ extends keyof typeof this.bot['events']>(event: TZ, callback: (...args: EventParameters<Z, T, TZ>) => Promise<void>): void {
    this.events[event]?.add(callback as (...args: unknown[]) => Promise<void>);
  }
}
