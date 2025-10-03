import type { DDFramework } from '../../mod.ts';
import type { DDFrameworkDesiredProperties } from '../desired.ts';
import type { DDFrameworkOptions } from '../options.ts';
import type { BotWithCacheProxy } from '../util/client.ts';

/**
 * Extract the parameter types of a specific event from the bot's event handlers.
 */
export type EventParameters<
  Z extends DDFrameworkDesiredProperties,
  T extends BotWithCacheProxy<Z>,
  K extends keyof T['events'],
> = NonNullable<T['events'][K]> extends (...args: infer P) => unknown ? P : never;

/**
 * Event Manager for easily registering listeners.
 *
 * @private
 * @remarks This class is used internally by DDFramework and is not intended for direct initialization by end-users.
 */
export class EventManager<T extends DDFrameworkDesiredProperties> {
  private framework: DDFramework<T>;
  private events: {
    [key in keyof typeof this.framework.internal.events]?: Set<(...args: unknown[]) => Promise<void>>;
  } = {};

  /**
   * Create an instance of EventManager.
   *
   * @param framework The framework instance to manage events for.
   * @param options The options for the event manager.
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
          callback(...args).catch((e) => options.errorHandler(e));
        }
      };
    }
  }

  /**
   * Add an event listener to the Discord Client.
   *
   * @param event The event to listen for.
   * @param callback The async [arrow] function callback to execute when the event is triggered.
   */
  public add<TZ extends keyof typeof this.framework.internal['events']>(event: TZ, callback: (...args: EventParameters<T, typeof this.framework.internal, TZ>) => Promise<void>): void {
    this.events[event]?.add(callback as (...args: unknown[]) => Promise<void>);
  }
}
