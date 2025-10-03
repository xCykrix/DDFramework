import type { DDFramework } from '../../mod.ts';
import type { DDFrameworkDesiredProperties } from '../desired.ts';
import type { DDFrameworkOptions } from '../options.ts';
import { injectChatInputHandler } from '../util/internal/event/chatInputHandler.ts';

/**
 * Leaf Manager for managing the internal leaf structure.
 *
 * @private
 * @remarks This class is used internally by DDFramework and is not intended for direct initialization by end-users.
 */
export class LeafManager {
  private framework: DDFramework<DDFrameworkDesiredProperties>;
  private options: DDFrameworkOptions;

  /**
   * Create an instance of LeafManager.
   *
   * @param framework The bot instance to manage leaves for.
   * @param options The options for the leaf manager.
   */
  public constructor(framework: DDFramework<DDFrameworkDesiredProperties>, options: DDFrameworkOptions) {
    this.framework = framework;
    this.options = options;

    // Initialize Chat Interaction Handler for Leaf Commands
    injectChatInputHandler(this.framework, this.options);

    // Initialize Component Handler for Leaf Components
    // ...

    // Initialize Autocomplete Handler Leaf Autocomplete
    // ...
  }

  public add(): void {
  }
}
