import { deepMerge, Discordeno } from '../../deps.ts';
import type { DDFrameworkInternal } from '../../mod.ts';
import type { DDFrameworkOptions } from '../options.ts';
import { injectChatInputHandler } from '../util/internal/event/chatInputHandler.ts';
import { mergeChatInputJSON } from '../util/object/mergeChatInputJSON.ts';
import type { ChatInputCommandJSON, DynamicInjectedHandler, HandlerOptions, LeafDefinition, Option } from './leaf.types.ts';

/**
 * Leaf Manager for managing command, component, and autocomplete leaf nodes in DDFramework.
 *
 * @remarks This class is used internally by DDFramework and is not intended for direct initialization by end-users.
 */
export class LeafManager {
  private framework: DDFrameworkInternal;
  private options: DDFrameworkOptions;

  /**
   * Map of command names to their registered command schemas.
   */
  public linkedSchemas: Map<string, ChatInputCommandJSON> = new Map();
  /**
   * Map of command/component paths to their handler options.
   */
  public linkedOptions: Map<string, HandlerOptions> = new Map();
  /**
   * Map of command/component paths to their dynamic handler implementations.
   */
  public linkedDynamics: Map<string, DynamicInjectedHandler<ChatInputCommandJSON>> = new Map();

  /**
   * Create an instance of LeafManager.
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
   * Register a leaf definition (command/component/autocomplete handler).
   *
   * @typeParam T - The command schema type.
   * @param definition - The leaf definition to register.
   */
  public linkLeaf<T extends ChatInputCommandJSON>(definition: LeafDefinition<T>): void {
    const commandPaths = new Set<string>([definition.schema.name]);
    for (const path of this.getDynamicPath(definition.schema.name, definition.schema.options)) {
      commandPaths.add(path);
    }

    for (const path of commandPaths) {
      this.registerLink(path, definition);
    }

    const componentIds = definition.options.components?.acceptedBaseCustomIds ?? [];
    for (const componentPath of componentIds) {
      this.registerLink(componentPath, definition);
    }

    if (!this.linkedSchemas.has(definition.schema.name)) {
      this.linkedSchemas.set(definition.schema.name, definition.schema);
    } else {
      const merge = deepMerge.deepMerge.withOptions<ChatInputCommandJSON>(
        {
          arrayMergeStrategy: 'unique',
          setMergeStrategy: 'combine',
          mapMergeStrategy: 'combine',
          customMergeFunctions: {
            Array: mergeChatInputJSON,
          },
        },
        this.linkedSchemas.get(definition.schema.name)!,
        definition.schema,
      );
      this.linkedSchemas.set(definition.schema.name, merge);
    }
  }

  /**
   * Recursively get dynamic command/component paths from options.
   *
   * @param base - The base path to start from.
   * @param options - The options to extract paths from.
   * @returns An array of dynamic paths.
   */
  private getDynamicPath(
    base: string,
    options?: readonly Option[],
  ): string[] {
    if (!options) return [];
    const paths: string[] = [];
    for (const option of options) {
      // Only include if type is ChatInput, SubCommand, or SubCommandGroup
      if (
        option.type === Discordeno.ApplicationCommandOptionTypes.SubCommand ||
        option.type === Discordeno.ApplicationCommandOptionTypes.SubCommandGroup
      ) {
        const currentPath = `${base}.${option.name}`;
        paths.push(currentPath);
        if ('options' in option && Array.isArray(option.options)) {
          paths.push(...this.getDynamicPath(currentPath, option.options));
        }
      }
    }
    return paths;
  }

  /**
   * Register a dynamic path or component identifier with its handler and options.
   */
  private registerLink<T extends ChatInputCommandJSON>(path: string, definition: LeafDefinition<T>): void {
    this.linkedDynamics.set(path, definition.handler as DynamicInjectedHandler<ChatInputCommandJSON>);
    this.linkedOptions.set(path, definition.options);
  }
}
export type { AutoCompleteResponse, BaseOption, BooleanOption, ChannelOption, ChatInputArgs, ChatInputCommandJSON, DynamicInjectedHandler, ExtractArgsFromOptions, HandlerOptions, HandlerPassthrough, IntegerOption, LeafDefinition, LeafTypeMap, MentionableOption, NumberOption, Option, RoleOption, StringOption, SubCommandGroupOption, SubCommandOption, UserOption } from './leaf.types.ts';
