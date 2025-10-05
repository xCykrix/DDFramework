import { deepMerge, Discordeno } from '../../deps.ts';
import type { DDFrameworkInternal } from '../../mod.ts';
import type { DDFrameworkOptions } from '../../mod.types.ts';
import { injectChatInputHandler } from '../util/internal/event/chatInputHandler.ts';
import { mergeChatInputJSON } from '../util/object/mergeChatInputJSON.ts';
import type { ChatInputCommandJSON, DynamicInjectedHandler, HandlerOptions, LeafDefinition, Option } from './leaf.types.ts';

/**
 * Manages command, component, and autocomplete leaf nodes in DDFramework.
 *
 * Handles registration, schema merging, and event wiring for all bot interaction handlers.
 *
 * @remarks
 * Used internally by DDFramework. Not intended for direct initialization by end-users.
 */
export class LeafManager {
  private framework: DDFrameworkInternal;
  private options: DDFrameworkOptions;

  /**
   * Maps command names to their registered command schemas.
   *
   * Used for upserting application commands to Discord guilds.
   */
  public linkedSchemas: Map<string, ChatInputCommandJSON> = new Map();
  /**
   * Maps command/component paths to their handler options.
   *
   * Used for permission checks and handler invocation.
   */
  public linkedOptions: Map<string, HandlerOptions> = new Map();
  /**
   * Maps command/component paths to their dynamic handler implementations.
   *
   * Used for routing interactions to the correct callback.
   */
  public linkedDynamics: Map<string, DynamicInjectedHandler<ChatInputCommandJSON>> = new Map();

  /**
   * Constructs a LeafManager and wires up all interaction handlers.
   *
   * @param framework - The bot instance to manage leaves for.
   * @param options - The options for the leaf manager.
   */
  public constructor(framework: DDFrameworkInternal, options: DDFrameworkOptions) {
    this.framework = framework;
    this.options = options;

    // Initialize Chat Interaction Handler for Leaf Commands
    injectChatInputHandler(this.framework, this.options);

    // Initialize Component Handler for Leaf Components
    // ...

    // Initialize Autocomplete Handler Leaf Autocomplete
    // ...

    // Initialize Built-in Ready Event
    this.framework._internal_events.add('ready', async (v) => {
      for (const guild of v.guilds) {
        await this.framework.internal.helpers.upsertGuildApplicationCommands(guild, this.linkedSchemas.values().toArray() as Discordeno.CreateApplicationCommand[]).catch((e) => {
          this.options.errorHandler(
            new Deno.errors.InvalidData(`[DDFramework:LeafManager] Failed to upsert linkedSchemas to guild ${guild}: ${e.message}`),
          );
        });
      }
    });
  }

  /**
   * Registers a leaf definition (command, component, or autocomplete handler).
   *
   * Adds all dynamic paths and component IDs to the internal handler maps, and merges schemas for upsert.
   *
   * @typeParam T - The command schema type.
   * @param definition - The leaf definition to register.
   */
  public linkLeaf<T extends ChatInputCommandJSON>(definition: LeafDefinition<T>): void {
    for (const path of this.iterateCommandPaths(definition.schema.name, definition.schema.options)) {
      this.registerLink(path, definition);
    }

    const componentIds = definition.options.components?.acceptedBaseCustomIds ?? [];
    for (const componentPath of componentIds) {
      this.registerLink(componentPath, definition);
    }

    this.mergeSchema(definition.schema.name, definition.schema);
  }

  /**
   * Recursively yields all dynamic command/component paths from options.
   *
   * Used for registering subcommands and groups for handler lookup.
   *
   * @param base - The base path to start from.
   * @param options - The options to extract paths from.
   * @returns Generator of dynamic path strings.
   */
  private *iterateCommandPaths(
    base: string,
    options?: readonly Option[],
  ): Generator<string, void, undefined> {
    yield base;
    if (!options) return;

    for (const option of options) {
      if (
        option.type === Discordeno.ApplicationCommandOptionTypes.SubCommand ||
        option.type === Discordeno.ApplicationCommandOptionTypes.SubCommandGroup
      ) {
        const currentPath = `${base}.${option.name}`;
        yield currentPath;
        if ('options' in option && Array.isArray(option.options)) {
          yield* this.iterateCommandPaths(currentPath, option.options);
        }
      }
    }
  }

  /**
   * Registers a dynamic path or component identifier with its handler and options.
   *
   * Internal utility for linkLeaf.
   *
   * @param path - The command/component path or custom ID.
   * @param definition - The leaf definition containing handler and options.
   */
  private registerLink<T extends ChatInputCommandJSON>(path: string, definition: LeafDefinition<T>): void {
    this.linkedDynamics.set(path, definition.handler as DynamicInjectedHandler<ChatInputCommandJSON>);
    this.linkedOptions.set(path, definition.options);
  }

  /**
   * Merges a command schema into the linkedSchemas map, combining with any existing schema.
   *
   * Ensures unique array values and combines sets/maps for Discord application command upsert.
   *
   * @param name - The command name.
   * @param schema - The command schema to merge.
   */
  private mergeSchema(name: string, schema: ChatInputCommandJSON): void {
    const existing = this.linkedSchemas.get(name);
    if (!existing) {
      this.linkedSchemas.set(name, schema);
      return;
    }

    const merged = deepMerge.deepMerge.withOptions<ChatInputCommandJSON>(
      {
        arrayMergeStrategy: 'unique',
        setMergeStrategy: 'combine',
        mapMergeStrategy: 'combine',
        customMergeFunctions: {
          Array: mergeChatInputJSON,
        },
      },
      existing,
      schema,
    );

    this.linkedSchemas.set(name, merged);
  }
}
