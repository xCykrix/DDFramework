import { type Discordeno, ulid } from './deps.ts';
import { createDDFrameworkProperties, type DDFrameworkDesiredProperties, type MinimalDesiredProperties } from './lib/desired.ts';
import { EventManager } from './lib/manager/event.ts';
import type { DDFrameworkOptions } from './lib/options.ts';
import { type BotWithCacheProxy, ClientGenerator } from './lib/util/client.ts';

export class DDFramework<T extends DDFrameworkDesiredProperties = MinimalDesiredProperties> {
  #internal: BotWithCacheProxy<T>;
  public events: EventManager<T, BotWithCacheProxy<T>>;

  /**
   * Useful & Helpful Utilities
   */
  public helpers = {
    permissions: null,
  };
  public utils = {
    ulid,
  };

  public static create<T extends Discordeno.TransformersDesiredProperties>(
    options: DDFrameworkOptions,
    desiredProperties: T,
  ): DDFramework<DDFrameworkDesiredProperties<T>> {
    const mergedProperties = createDDFrameworkProperties(desiredProperties);
    return new DDFramework(options, mergedProperties);
  }

  private constructor(options: DDFrameworkOptions, desiredProperties: T) {
    this.#internal = new ClientGenerator<T>().create(options.token, desiredProperties);
    this.events = new EventManager<T, BotWithCacheProxy<T>>(this.#internal, options);
  }

  public get internal(): BotWithCacheProxy<T> {
    return this.#internal;
  }

  public async start(): Promise<void> {
    await this.#internal.start();
    this.events.add('ready', async (v) => {

    })
  }
}
