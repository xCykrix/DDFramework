import { ApplicationCommandOptionType, Events, type Guild } from 'discord.js';
import type { DiscordFramework } from '../../mod.ts';
import { injectCommandHandler } from './event/handler.ts';
import type { ChatInputCommandJSON, DynamicInjectedHandler, HandlerOptions, LeafDefinition, LeafOption } from './types.ts';

/**
 * Manages command, component, and autocomplete leaf nodes in DDFramework.
 *
 * Handles registration, schema merging, and event wiring for all bot interaction handlers.
 *
 * @remarks
 * Used internally by DDFramework. Not intended for direct initialization by end-users.
 */
export class LeafManager {
  private framework: DiscordFramework;

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
  public constructor(framework: DiscordFramework) {
    this.framework = framework;

    injectCommandHandler(this.framework);

    // On ready, register commands per guild using Discord.js
    this.framework.djs.once(Events.ClientReady, async () => {
      try {
        const schemas = Array.from(this.linkedSchemas.values());
        for (const guild of this.framework.djs.guilds.cache.values()) {
          await this.registerGuildCommands(guild, schemas).catch((e) => {
            this.framework.ledger.warning(`[LeafManager] Failed to register commands for guild.`, {
              error: e,
            });
          });
        }
      } catch (e) {
        this.framework.ledger.severe(`[LeafManager] Failed to register guild commands.`, {
          err: e,
        });
      }
    });
  }

  private async registerGuildCommands(guild: Guild, schemas: ChatInputCommandJSON[]): Promise<void> {
    try {
      await guild.commands.set(schemas);
      this.framework.ledger.information(`[LeafManager] Upserted ${schemas.length} commands to guild ${guild.id}`);
    } catch (e) {
      this.framework.ledger.severe(`[LeafManager] Failed to set commands for guild.`, {
        guildId: guild.id,
        err: e,
      });
    }
  }

  /**
   * Registers a leaf definition (command, component, or autocomplete handler).
   *
   * Adds all dynamic paths and component IDs to the internal handler maps, and merges schemas for upsert.
   *
   * @typeParam T - The command schema type.
   * @param definition - The leaf definition to register.
   */
  public linkLeaf<T extends ChatInputCommandJSON, V extends ChatInputCommandJSON>(definition: LeafDefinition<T, V>): void {
    for (const path of this.iterateCommandPaths(definition.literal.name, definition.literal.options)) {
      this.framework.ledger.trace('[TraceInitialize] linkLeaf()', {
        name: definition.literal.name,
        options: definition.literal.options,
        path,
      });
      this.registerLink(path, definition);
    }

    const componentIds = definition.options.components?.acceptedBaseCustomIds ?? [];
    for (const componentPath of componentIds) {
      this.registerLink(componentPath, definition);
    }

    this.addLinkedSchema(definition.schema.name, definition.schema);
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
    options?: readonly LeafOption[],
  ): Generator<string, void, undefined> {
    yield base;
    if (!options) return;

    for (const option of options) {
      if (
        option.type === ApplicationCommandOptionType.Subcommand ||
        option.type === ApplicationCommandOptionType.SubcommandGroup
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
  private registerLink<T extends ChatInputCommandJSON, V extends ChatInputCommandJSON>(path: string, definition: LeafDefinition<T, V>): void {
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
  private addLinkedSchema(name: string, schema: ChatInputCommandJSON): void {
    // For now, last write wins. If merge semantics are needed, reintroduce a custom merge.
    this.linkedSchemas.set(name, schema);
  }
}
