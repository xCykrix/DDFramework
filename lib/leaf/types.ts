import type { APIApplicationCommandAttachmentOption, APIApplicationCommandBooleanOption, APIApplicationCommandChannelOption, APIApplicationCommandIntegerOption, APIApplicationCommandMentionableOption, APIApplicationCommandNumberOption, APIApplicationCommandOptionChoice, APIApplicationCommandRoleOption, APIApplicationCommandStringOption, APIApplicationCommandSubcommandGroupOption, APIApplicationCommandSubcommandOption, APIApplicationCommandUserOption, ApplicationCommandOptionType, ApplicationCommandType, Attachment, AutocompleteInteraction, ChatInputCommandInteraction, Guild, GuildBasedChannel, GuildChannelType, GuildMember, MessageComponentInteraction, ModalComponentResolver, ModalSubmitInteraction, PermissionResolvable, RESTPostAPIChatInputApplicationCommandsJSONBody, Role, User } from 'discord.js';
import type { DiscordFramework } from '../../mod.ts';
import { StoredRetrievalGeneric } from '../types.ts';

/**
 * Represents a primitive option for a Discord application command.
 * Includes all non-nested option types.
 */
export type LeafPrimitiveOption =
  | APIApplicationCommandStringOption
  | APIApplicationCommandIntegerOption
  | APIApplicationCommandNumberOption
  | APIApplicationCommandBooleanOption
  | APIApplicationCommandUserOption
  | APIApplicationCommandChannelOption
  | APIApplicationCommandRoleOption
  | APIApplicationCommandMentionableOption
  | APIApplicationCommandAttachmentOption;

/**
 * Represents a subcommand option, which may contain primitive options.
 */
export type LeafSubcommandOption = Omit<APIApplicationCommandSubcommandOption, 'options'> & {
  options?: readonly LeafPrimitiveOption[];
};

/**
 * Represents a subcommand group option, which contains subcommand options.
 */
export type LeafSubcommandGroupOption = Omit<APIApplicationCommandSubcommandGroupOption, 'options'> & {
  options: readonly LeafSubcommandOption[];
};

/**
 * Union type for all possible command option types (primitive, subcommand, or group).
 */
export type LeafOption = LeafPrimitiveOption | LeafSubcommandOption | LeafSubcommandGroupOption;

/**
 * Represents a chat input command definition for Discord.js, with typed options.
 */
export type ChatInputCommandJSON = Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'type' | 'options'> & {
  type?: ApplicationCommandType.ChatInput;
  options?: readonly LeafOption[];
};

/**
 * Maps Discord.js option types to their corresponding TypeScript types.
 */
export type LeafTypeMap = {
  [ApplicationCommandOptionType.String]: string;
  [ApplicationCommandOptionType.Integer]: number;
  [ApplicationCommandOptionType.Number]: number;
  [ApplicationCommandOptionType.Boolean]: boolean;
  [ApplicationCommandOptionType.User]: User;
  [ApplicationCommandOptionType.Channel]: GuildBasedChannel;
  [ApplicationCommandOptionType.Role]: Role;
  [ApplicationCommandOptionType.Mentionable]: GuildMember | Role | User;
  [ApplicationCommandOptionType.Attachment]: Attachment;
};

/**
 * Recursively infers argument types from a command's options array.
 * Produces a type-safe object for handler args.
 */
export type ExtractArgsFromOptions<T extends readonly LeafOption[] | undefined> = T extends readonly LeafOption[] ? RequiredOptionRecord<T[number]> & OptionalOptionRecord<T[number]>
  : Record<PropertyKey, never>;

/**
 * Produces a record of required option names to their inferred types.
 */
type RequiredOptionRecord<O> = {
  [Name in ExtractRequiredOptionName<O>]-?: InferOptionArg<OptionByName<O, Name>>;
};

/**
 * Produces a record of optional option names to their inferred types.
 */
type OptionalOptionRecord<O> = {
  [Name in ExtractOptionalOptionName<O>]?: InferOptionArg<OptionByName<O, Name>>;
};

/**
 * Extracts required and optional option names and helpers for type inference.
 */
type ExtractRequiredOptionName<O> = O extends { required: true; name: infer N extends string } ? N : never;
type ExtractOptionalOptionName<O> = O extends { name: infer N extends string } ? (O extends { required: true } ? never : N) : never;
type OptionByName<O, Name extends string> = Extract<O, { name: Name }>;
type ExtractOptionName<O> = O extends { name: infer N extends string } ? N : never;

/**
 * Infers the argument type for a given option.
 */
type InferOptionArg<O> = O extends LeafSubcommandGroupOption ? SubcommandGroupArgs<O>
  : O extends LeafSubcommandOption ? ExtractArgsFromOptions<O['options']>
  : O extends { type: infer Type } ? Type extends keyof LeafTypeMap ? LeafTypeMap[Type]
    : never
  : never;

/**
 * Produces an argument object for a subcommand group.
 */
type SubcommandGroupArgs<G extends LeafSubcommandGroupOption> = {
  [Sub in G['options'][number] as ExtractOptionName<Sub>]: ExtractArgsFromOptions<Sub['options']>;
};

/**
 * Infers the argument object for a chat input command definition.
 */
export type ChatInputArgs<C extends ChatInputCommandJSON> = ExtractArgsFromOptions<C['options']>;

/**
 * Represents the response for an autocomplete handler.
 */
export type AutoCompleteResponse = {
  results: APIApplicationCommandOptionChoice[];
  perPage?: number;
  allowEmptySearch?: boolean;
};

/**
 * Represents a handler object for a command, component, modal, or autocomplete event.
 *
 * @typeParam V - The command schema type for argument inference.
 */
export type DynamicInjectedHandler<V extends ChatInputCommandJSON> = {
  /**
   * The main callback for a chat input command.
   */
  callback(passthrough: {
    framework: DiscordFramework;
    interaction: ChatInputCommandInteraction;
    guild: Guild;
    channel: GuildBasedChannel;
    invoker: GuildMember;
    bot: GuildMember;
    args: ChatInputArgs<V>;
  }): Promise<void>;
  /**
   * Optional handler for message components or modals.
   */
  component?(passthrough: {
    framework: DiscordFramework;
    interaction: MessageComponentInteraction;
    customId: string;
    state: StoredRetrievalGeneric<unknown> | null;
  }): Promise<void>;
  /**
   * Optional handler for modal submissions.
   */
  modal?(passthrough: {
    framework: DiscordFramework;
    interaction: ModalSubmitInteraction;
    customId: string;
    resolver: ModalComponentResolver;
    state: StoredRetrievalGeneric<unknown> | null;
  }): Promise<void>;
  /**
   * Optional handler for autocomplete events.
   */
  autocomplete?(passthrough: {
    framework: DiscordFramework;
    interaction: AutocompleteInteraction;
    focused: unknown;
  }): Promise<AutoCompleteResponse | null>;
};

/**
 * Options for configuring a handler's permissions, channel types, and component restrictions.
 */
export type HandlerOptions = {
  guild: {
    botRequiredGuildPermissions: PermissionResolvable;
    botRequiredChannelPermissions: PermissionResolvable;
    userRequiredGuildPermissions: PermissionResolvable;
    userRequiredChannelPermissions: PermissionResolvable;
  };
  developerRequired: boolean;
  channelTypesRequired: GuildChannelType[];
  components?: {
    acceptedBaseCustomIds: string[];
    requireStatePacket: true;
    restrictToAuthor: true;
  };
};

/**
 * Represents a full command definition, including schema, options, and handler.
 *
 * @typeParam T - The schema type for upsert/registration.
 * @typeParam V - The literal type for path iteration.
 */
export interface LeafDefinition<T extends ChatInputCommandJSON, V extends ChatInputCommandJSON> {
  /**
   * The schema used for upserting the command to Discord.
   */
  schema: T;
  /**
   * The literal definition used for path iteration and handler mapping.
   */
  literal: V;
  /**
   * The namespace for this command (used for path uniqueness).
   */
  namespace: string;
  /**
   * Handler options for permissions, channel types, and components.
   */
  options: HandlerOptions;
  /**
   * The handler object for this command.
   */
  handler: DynamicInjectedHandler<T>;
}
