import type { DDFramework } from '../../mod.ts';
import type { DDFrameworkDesiredProperties } from '../desired.ts';
import type { DDFrameworkOptions } from '../options.ts';
import type { BotWithCacheProxy } from '../util/client.ts';

/**
 * Extracts the parameter types of a specific event from the bot's event handlers.
 *
 * @typeParam Z - The desired properties type for the bot.
 * @typeParam T - The bot instance type.
 * @typeParam K - The event name (key of the events object).
 * @returns The tuple of parameter types for the event handler.
 */
export type EventParameters<
  Z extends DDFrameworkDesiredProperties,
  T extends BotWithCacheProxy<Z>,
  K extends keyof T['events'],
> = NonNullable<T['events'][K]> extends (...args: infer P) => unknown ? P : never;

/**
 * Event Manager for registering and managing Discord event listeners in DDFramework.
 *
 * @typeParam T - The desired properties type for the bot instance.
 *
 * @remarks This class is used internally by DDFramework and is not intended for direct initialization by end-users.
 */
export class EventManager<T extends DDFrameworkDesiredProperties> {
  /**
   * The DDFramework instance associated with this event manager.
   */
  private framework: DDFramework<T>;

  /**
   * Internal mapping of event names to sets of async event handler callbacks.
   */
  private events: {
    [key in keyof typeof this.framework.internal.events]?: Set<(...args: unknown[]) => Promise<void>>;
  } = {};

  /**
   * Create an instance of EventManager.
   *
   * @param framework - The DDFramework instance to manage events for.
   * @param options - The options for the event manager.
   */
  public constructor(framework: DDFramework<T>, options: DDFrameworkOptions) {
    this.framework = framework;
    for (const k of Object.keys(framework.internal.events)) {
      const key = k as keyof typeof framework.internal.events;
      this.events[key] = new Set();
    }
    for (const k of Object.keys(framework.internal.events)) {
      const key = k as keyof typeof framework.internal.events;
      framework.internal.events[key] = (...args: Parameters<NonNullable<typeof framework.internal.events[typeof key]>>) => {
        for (const callback of this.events[key]!) {
          callback(...args).catch((error) => options.errorHandler(error));
        }
      };
    }
  }

  /**
   * Add an event listener to the Discord Client.
   *
   * @typeParam TZ - The event name (key of the events object).
   * @param event - The event to listen for.
   * @param callback - The async function callback to execute when the event is triggered.
   */
  public add<TZ extends keyof typeof this.framework.internal['events']>(event: TZ, callback: (...args: EventParameters<T, typeof this.framework.internal, TZ>) => Promise<void>): void {
    this.events[event]?.add(callback as (...args: unknown[]) => Promise<void>);
  }
}
