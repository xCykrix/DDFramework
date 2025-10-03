import { Discordeno } from '../../deps.ts';
import type { DDBotInternal, DDFrameworkInternal } from '../../mod.ts';
import type { DDFrameworkOptions } from '../options.ts';
import { injectChatInputHandler } from '../util/internal/event/chatInputHandler.ts';

/** Base Shape for any Option */
export interface BaseOption<T extends Discordeno.ApplicationCommandOptionTypes> extends Omit<Discordeno.ApplicationCommandOption, 'nameLocalizations' | 'descriptionLocalizations'> {
  type: T;
}

/** SubCommand */
export interface SubCommandOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.SubCommand> {
  options?: Option[];
}

/** SubCommand Group */
export interface SubCommandGroupOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.SubCommandGroup> {
  options: SubCommandOption[];
}

/** Leaf Option Types */
export interface StringOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.String> {}
export interface IntegerOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Integer> {}
export interface NumberOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Number> {}
export interface BooleanOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Boolean> {}
export interface UserOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.User> {}
export interface ChannelOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Channel> {}
export interface RoleOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Role> {}
export interface MentionableOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Mentionable> {}

/** Union of every possible Option */
export type Option =
  | SubCommandGroupOption
  | SubCommandOption
  | StringOption
  | IntegerOption
  | NumberOption
  | BooleanOption
  | UserOption
  | ChannelOption
  | RoleOption
  | MentionableOption;

/** Map Discord option types to TS primitives */
export type LeafTypeMap = {
  [Discordeno.ApplicationCommandOptionTypes.String]: string;
  [Discordeno.ApplicationCommandOptionTypes.Integer]: number;
  [Discordeno.ApplicationCommandOptionTypes.Boolean]: boolean;
  [Discordeno.ApplicationCommandOptionTypes.User]: DDBotInternal['transformers']['$inferredTypes']['user'];
  [Discordeno.ApplicationCommandOptionTypes.Channel]: DDBotInternal['transformers']['$inferredTypes']['channel'];
  [Discordeno.ApplicationCommandOptionTypes.Role]: DDBotInternal['transformers']['$inferredTypes']['role'];
  [Discordeno.ApplicationCommandOptionTypes.Mentionable]: DDBotInternal['transformers']['$inferredTypes']['user'] | DDBotInternal['transformers']['$inferredTypes']['role'];
  [Discordeno.ApplicationCommandOptionTypes.Number]: number;
};

/** Recursively extract `{ name: value }` from an options array */
export type ExtractArgsFromOptions<
  T extends readonly Option[] | undefined,
> = T extends readonly Option[] ? {
    [O in T[number] as O['name']]: O extends SubCommandGroupOption ? {
        [G in O['options'][number] as G['name']]: ExtractArgsFromOptions<G['options']>;
      }
      : O extends SubCommandOption ? ExtractArgsFromOptions<O['options']>
      : O extends { type: infer U } ? U extends keyof LeafTypeMap ? O['required'] extends true ? LeafTypeMap[U]
          : LeafTypeMap[U] | undefined
        : never
      : never;
  }
  : Record<PropertyKey, never>;

/** Full ChatInput Command JSON shape */
export interface ChatInputCommandJSON {
  type: Discordeno.ApplicationCommandTypes.ChatInput;
  name: string;
  description: string;
  options?: readonly Option[];
}

/** Final argument type for a given command definition */
export type ChatInputArgs<C extends ChatInputCommandJSON> = ExtractArgsFromOptions<C['options']>;

/** Auto Complete Response */
export type AutoCompleteResponse = {
  results: Discordeno.ApplicationCommandOptionChoice[];
  perPage?: number;
  allowEmptySearch?: boolean;
};

/** Dynamic handler type for processing. */
export type DynamicInjectedHandler<V extends ChatInputCommandJSON> = {
  callback<T extends ChatInputArgs<V>>(passthrough: {
    interaction: DDBotInternal['transformers']['$inferredTypes']['interaction'];
    guild?: DDBotInternal['cache']['$inferredTypes']['guild'];
    member?: DDBotInternal['cache']['$inferredTypes']['member'];
    botMember?: DDBotInternal['cache']['$inferredTypes']['member'];
    args: T;
  }): Promise<void>;
  autocomplete?<T extends Discordeno.InteractionDataOption>(passthrough: {
    interaction: DDBotInternal['transformers']['$inferredTypes']['interaction'];
    focused: T;
  }): Promise<AutoCompleteResponse | null>;
  component?<Z>(passthrough: {
    interaction: DDBotInternal['transformers']['$inferredTypes']['interaction'];
    baseCustomId: string;
    parsedModal: Map<string, string> | null;
    statePacket: Z | null;
  }): Promise<void>;
};

export type HandlerOptions = {
  // Access Control
  guildRequired: boolean;
  developerRequired: boolean;
  channelTypesRequired: (Discordeno.ChannelTypes.GuildAnnouncement | Discordeno.ChannelTypes.GuildText | Discordeno.ChannelTypes.GuildForum | Discordeno.ChannelTypes.GuildMedia | Discordeno.ChannelTypes.DM | Discordeno.ChannelTypes.GroupDm)[];

  // Bot Permissions
  botRequiredGuildPermissions: Discordeno.PermissionStrings[];
  botRequiredChannelPermissions: Discordeno.PermissionStrings[];

  // User Permissions
  userRequiredGuildPermissions: Discordeno.PermissionStrings[];
  userRequiredChannelPermissions: Discordeno.PermissionStrings[];

  // Components
  components?: {
    acceptedBaseCustomIds: string[];
    requireStatePacket: boolean;
    restrictToAuthor: boolean;
  };
};

export type HandlerPassthrough<Z extends ChatInputCommandJSON, T = ChatInputArgs<Z>> = {
  interaction: DDBotInternal['transformers']['$inferredTypes']['interaction'];
  guild?: DDBotInternal['cache']['$inferredTypes']['guild'];
  member?: DDBotInternal['cache']['$inferredTypes']['member'];
  botMember?: DDBotInternal['cache']['$inferredTypes']['member'];
  args: T;
};

export interface LeafDefinition<T extends ChatInputCommandJSON> {
  schema: T;
  options: HandlerOptions;
  handler: DynamicInjectedHandler<T>;
}

/**
 * Leaf Manager for managing the internal leaf structure.
 *
 * @private
 * @remarks This class is used internally by DDFramework and is not intended for direct initialization by end-users.
 */
export class LeafManager {
  private framework: DDFrameworkInternal;
  private options: DDFrameworkOptions;

  /**
   * Create an instance of LeafManager.
   *
   * @param framework The bot instance to manage leaves for.
   * @param options The options for the leaf manager.
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
  }

  /**
   * Register a leaf definition.
   *
   * @param definition The leaf definition to register.
   * @returns The registered leaf definition.
   */
  public registerLeaf<T extends ChatInputCommandJSON>(
    definition: LeafDefinition<T>,
  ): void {
    // Implementation for registering the leaf definition
  }
}
