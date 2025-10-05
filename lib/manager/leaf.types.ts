import type { Discordeno } from '../../deps.ts';
import type { DDBotInternal, DDFrameworkInternal } from '../../mod.ts';

/**
 * Base shape for any Discord application command option.
 *
 * Used to define the structure of options for Discord slash commands.
 *
 * @typeParam T - The Discordeno application command option type.
 * @example
 * const option: StringOption = { type: Discordeno.ApplicationCommandOptionTypes.String, name: 'query', ... };
 */
export interface BaseOption<T extends Discordeno.ApplicationCommandOptionTypes> extends Omit<Discordeno.ApplicationCommandOption, 'nameLocalizations' | 'descriptionLocalizations'> {
  type: T;
}

/**
 * SubCommand option type for Discord application commands.
 *
 * Represents a single subcommand, which may have its own options.
 */
export interface SubCommandOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.SubCommand> {
  options?: Option[];
}

/**
 * SubCommand group option type for Discord application commands.
 *
 * Represents a group of subcommands, each with their own options.
 */
export interface SubCommandGroupOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.SubCommandGroup> {
  options: SubCommandOption[];
}

/**
 * String option type for Discord application commands.
 *
 * Used for text input fields in slash commands.
 */
export interface StringOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.String> {}
/**
 * Integer option type for Discord application command.
 *
 * Used for numeric input fields in slash commands.
 */
export interface IntegerOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Integer> {}
/**
 * Number option type for Discord application command.
 *
 * Used for floating-point numeric input fields in slash commands.
 */
export interface NumberOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Number> {}
/**
 * Boolean option type for Discord application command.
 *
 * Used for true/false input fields in slash commands.
 */
export interface BooleanOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Boolean> {}
/**
 * User option type for Discord application command.
 *
 * Used for selecting a Discord user in slash commands.
 */
export interface UserOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.User> {}
/**
 * Channel option type for Discord application command.
 *
 * Used for selecting a Discord channel in slash commands.
 */
export interface ChannelOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Channel> {}
/**
 * Role option type for Discord application command.
 *
 * Used for selecting a Discord role in slash commands.
 */
export interface RoleOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Role> {}
/**
 * Mentionable option type for Discord application command.
 *
 * Used for selecting a user or role in slash commands.
 */
export interface MentionableOption extends BaseOption<Discordeno.ApplicationCommandOptionTypes.Mentionable> {}

/**
 * Union type of every possible Discord application command option.
 *
 * Used for typing arrays of options in command schemas.
 */
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

/**
 * Maps Discord option types to TypeScript primitives or framework types.
 *
 * Used for inferring argument types from command options.
 */
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

/**
 * Recursively extracts `{ name: value }` from an options array for command argument typing.
 *
 * Used to build argument objects for handler callbacks.
 */
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

/**
 * Full ChatInput command JSON shape for Discord application commands.
 *
 * Represents the schema for a Discord slash command.
 * @example
 * const schema: ChatInputCommandJSON = { type: ..., name: 'ping', description: 'Ping command', options: [...] };
 */
export interface ChatInputCommandJSON {
  type: Discordeno.ApplicationCommandTypes.ChatInput;
  name: string;
  description: string;
  options?: readonly Option[];
}

/**
 * Final argument type for a given command definition.
 *
 * Used for typing the args property in handler callbacks.
 */
export type ChatInputArgs<C extends ChatInputCommandJSON> = ExtractArgsFromOptions<C['options']>;

/**
 * Autocomplete response type for Discord application command options.
 *
 * Used for returning results from autocomplete handlers.
 */
export type AutoCompleteResponse = {
  results: Discordeno.ApplicationCommandOptionChoice[];
  perPage?: number;
  allowEmptySearch?: boolean;
};

/**
 * Dynamic handler type for processing commands, autocomplete, and components.
 *
 * Used for registering callbacks for commands, autocomplete, and components.
 *
 * @typeParam V - The command schema type.
 * @example
 * const handler: DynamicInjectedHandler<MyCommandSchema> = { callback: (ctx) => { ... } };
 */
export type DynamicInjectedHandler<V extends ChatInputCommandJSON> = {
  callback<T extends ChatInputArgs<V>>(passthrough: {
    framework: DDFrameworkInternal;
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

/**
 * Options for configuring a leaf handler (command/component/autocomplete).
 *
 * Used for specifying permissions, channel types, and component restrictions.
 */
export type HandlerOptions = {
  guild?: {
    required: true;
    botRequiredGuildPermissions: Discordeno.PermissionStrings[];
    botRequiredChannelPermissions: Discordeno.PermissionStrings[];
    userRequiredGuildPermissions: Discordeno.PermissionStrings[];
    userRequiredChannelPermissions: Discordeno.PermissionStrings[];
  } | {
    required: false;
  };
  developerRequired: boolean;
  channelTypesRequired: (Discordeno.ChannelTypes.GuildAnnouncement | Discordeno.ChannelTypes.GuildText | Discordeno.ChannelTypes.GuildForum | Discordeno.ChannelTypes.GuildMedia | Discordeno.ChannelTypes.DM | Discordeno.ChannelTypes.GroupDm)[];
  components?: {
    acceptedBaseCustomIds: string[];
    requireStatePacket: boolean;
    restrictToAuthor: boolean;
  };
};

/**
 * Passthrough type for handler callbacks, providing context and arguments.
 *
 * Used for passing interaction context and parsed arguments to handlers.
 */
export type HandlerPassthrough<Z extends ChatInputCommandJSON, T = ChatInputArgs<Z>> = {
  interaction: DDBotInternal['transformers']['$inferredTypes']['interaction'];
  guild?: DDBotInternal['cache']['$inferredTypes']['guild'];
  member?: DDBotInternal['cache']['$inferredTypes']['member'];
  botMember?: DDBotInternal['cache']['$inferredTypes']['member'];
  args: T;
};

/**
 * Definition for a leaf node (command/component/autocomplete) in DDFramework.
 *
 * Used for registering commands/components/autocomplete handlers with the framework.
 */
export interface LeafDefinition<T extends ChatInputCommandJSON> {
  schema: T;
  options: HandlerOptions;
  handler: DynamicInjectedHandler<T>;
}
