import { ulid } from './deps.ts';
import { createDDFrameworkProperties, type DDFrameworkDesiredProperties, type MinimalDesiredProperties } from './lib/desired.ts';
import { EventManager } from './lib/manager/event.ts';
import { LeafManager } from './lib/manager/leaf.ts';
import type { DDFrameworkOptions } from './lib/options.ts';
import { type BotWithCacheProxy, ClientGenerator } from './lib/util/client.ts';
import { Permissions } from './lib/util/helpers/permission.ts';

/** The internal bot type for DDFramework desired properties. */
export type DDFrameworkInternal = DDFramework<DDFrameworkDesiredProperties>;
export type DDBotInternal = BotWithCacheProxy<DDFrameworkDesiredProperties>;

/**
 * The main class for DDFramework, encapsulating a Discord bot with extended functionalities.
 */
export class DDFramework<T extends DDFrameworkDesiredProperties = MinimalDesiredProperties> {
  private options: DDFrameworkOptions;
  private _internal_client: BotWithCacheProxy<T>;

  /** Event Manager for easily registering listeners. */
  public events: EventManager<T>;
  public leaf: LeafManager;

  /** Functional helpers (e.g., permissions calculations, etc.) */
  public helpers: {
    permissions: Permissions<T>;
  };

  /** General purpose utilities for shared projects. */
  public utils = {
    ulid,
  };

  /**
   * Create a instance of DDFramework.
   *
   * @param options Configuration options for the framework.
   * @param desiredProperties The desired properties for the internal bot instance. Must include at least the minimal properties required by DDFramework.
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
    this.leaf = new LeafManager(this as unknown as DDFrameworkInternal, options);

    this.helpers = {
      permissions: new Permissions<T>(this),
    };
  }

  /** Get the internal bot instance. */
  public get internal(): BotWithCacheProxy<T> {
    return this._internal_client;
  }

  /** Start the application. */
  public async start(): Promise<void> {
    await this._internal_client.start().catch((e) => {
      this.options.errorHandler?.(e);
    });
  }
}
