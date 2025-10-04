import { ulid } from './deps.ts';
import { createDDFrameworkProperties, type DDBotDesiredMinimalProperties, type DDFrameworkDesiredProperties, type MinimalDesiredProperties } from './lib/desired.ts';
import { EventManager } from './lib/manager/event.ts';
import { LeafManager } from './lib/manager/leaf.ts';
import type { DDFrameworkOptions } from './lib/options.ts';
import { type BotWithCacheProxy, ClientGenerator } from './lib/util/client.ts';
import { Permissions } from './lib/util/helpers/permission.ts';

/**
 * Internal DDFramework type with all desired properties.
 *
 * Used for internal framework operations where all desired properties are present.
 */
export type DDFrameworkInternal = DDFramework<DDFrameworkDesiredProperties>;

/**
 * Internal bot type for DDFramework with all desired properties.
 *
 * Used for internal bot operations and cache proxy typing.
 */
export type DDBotInternal = BotWithCacheProxy<DDFrameworkDesiredProperties>;

/**
 * The main class for DDFramework, encapsulating a Discord bot with extended functionalities.
 *
 * @typeParam T - The desired properties type for the bot instance.
 */
export class DDFramework<T extends DDFrameworkDesiredProperties = DDBotDesiredMinimalProperties> {
  /**
   * Framework options.
   *
   * @private
   */
  private options: DDFrameworkOptions;
  /**
   * The internal bot instance.
   *
   * @private Access is subject to change and breakage without notice.
   */
  private _internal_client: BotWithCacheProxy<T>;

  /**
   * Event Manager for registering listeners and handling Discord events.
   */
  public events: EventManager<T>;
  /**
   * Internal Event Manager with the internal bot type associated. Mirrors to `events`.
   *
   * @private Access is subject to change and breakage without notice. Use {@link internal} instead.
   */
  public _internal_events: EventManager<DDFrameworkDesiredProperties>;
  /**
   * Leaf Manager for managing leaf nodes (callbacks, components, autocomplete) in the framework.
   */
  public leaf: LeafManager;

  /**
   * Functional helpers for common framework operations (e.g., permissions calculations).
   */
  public helpers: {
    permissions: Permissions<T>;
  };

  /**
   * General purpose utilities for shared projects.
   *
   * Includes unique ID generation via `ulid`.
   */
  public utils = {
    ulid,
  };

  /**
   * Create an instance of DDFramework.
   *
   * @param options - Configuration options for the framework.
   * @param desiredProperties - The desired properties for the internal bot instance. Must include at least the minimal properties required by DDFramework.
   * @returns An instance of DDFramework.
   */
  public static create<T extends MinimalDesiredProperties>(
    options: DDFrameworkOptions,
    desiredProperties: T,
  ): DDFramework<DDFrameworkDesiredProperties<T>> {
    return new DDFramework(options, createDDFrameworkProperties(desiredProperties) as DDFrameworkDesiredProperties<T>);
  }

  /**
   * Initialize the DDFramework.
   *
   * @param options Configuration options for the framework.
   * @param desiredProperties The desired properties for the internal bot instance.
   *
   * @private
   * @remarks This constructor is private. Use `DDFramework.create()` to instantiate the framework.
   */
  private constructor(options: DDFrameworkOptions, desiredProperties: T) {
    // Apply Options and Defaults
    this.options = options;
    if (this.options.errorHandler === undefined) {
      this.options.errorHandler = (error) => {
        console.error('[DDFramework] Internal Error from Error Handler\n', error);
      };
    }

    this._internal_client = new ClientGenerator<T>().create(options.token, desiredProperties);
    this.events = new EventManager<T>(this, options);
    this._internal_events = this.events as unknown as EventManager<DDFrameworkDesiredProperties>;
    this.leaf = new LeafManager(this as unknown as DDFrameworkInternal, options);

    this.helpers = {
      permissions: new Permissions<T>(this),
    };
  }

  /**
   * Get the internal Discordeno bot instance with cache proxy.
   *
   * @returns The internal bot instance.
   */
  public get internal(): BotWithCacheProxy<T> {
    return this._internal_client;
  }

  /**
   * Start the DDFramework application and connect the bot to Discord.
   */
  public async start(): Promise<void> {
    await this._internal_client.start().catch((e) => {
      this.options.errorHandler?.(e);
    });
  }
}
