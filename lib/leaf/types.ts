import type { APIApplicationCommandAttachmentOption, APIApplicationCommandBooleanOption, APIApplicationCommandChannelOption, APIApplicationCommandIntegerOption, APIApplicationCommandMentionableOption, APIApplicationCommandNumberOption, APIApplicationCommandOptionChoice, APIApplicationCommandRoleOption, APIApplicationCommandStringOption, APIApplicationCommandSubcommandGroupOption, APIApplicationCommandSubcommandOption, APIApplicationCommandUserOption, ApplicationCommandOptionType, ApplicationCommandType, Attachment, AutocompleteInteraction, ChatInputCommandInteraction, Guild, GuildBasedChannel, GuildChannelResolvable, GuildChannelType, GuildMember, MessageComponentInteraction, ModalComponentResolver, ModalSubmitInteraction, PermissionResolvable, RESTPostAPIChatInputApplicationCommandsJSONBody, Role, User } from 'discord.js';
import type { DiscordFramework } from '../../mod.ts';

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

export type LeafSubcommandOption = Omit<APIApplicationCommandSubcommandOption, 'options'> & {
  options?: readonly LeafPrimitiveOption[];
};

export type LeafSubcommandGroupOption = Omit<APIApplicationCommandSubcommandGroupOption, 'options'> & {
  options: readonly LeafSubcommandOption[];
};

export type LeafOption = LeafPrimitiveOption | LeafSubcommandOption | LeafSubcommandGroupOption;

export type ChatInputCommandJSON = Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'type' | 'options'> & {
  type?: ApplicationCommandType.ChatInput;
  options?: readonly LeafOption[];
};

export type LeafTypeMap = {
  [ApplicationCommandOptionType.String]: string;
  [ApplicationCommandOptionType.Integer]: number;
  [ApplicationCommandOptionType.Number]: number;
  [ApplicationCommandOptionType.Boolean]: boolean;
  [ApplicationCommandOptionType.User]: User;
  [ApplicationCommandOptionType.Channel]: GuildChannelResolvable;
  [ApplicationCommandOptionType.Role]: Role;
  [ApplicationCommandOptionType.Mentionable]: GuildMember | Role | User;
  [ApplicationCommandOptionType.Attachment]: Attachment;
};

export type ExtractArgsFromOptions<T extends readonly LeafOption[] | undefined> = T extends readonly LeafOption[] ? RequiredOptionRecord<T[number]> & OptionalOptionRecord<T[number]>
  : Record<PropertyKey, never>;

type RequiredOptionRecord<O> = {
  [Name in ExtractRequiredOptionName<O>]-?: InferOptionArg<OptionByName<O, Name>>;
};

type OptionalOptionRecord<O> = {
  [Name in ExtractOptionalOptionName<O>]?: InferOptionArg<OptionByName<O, Name>>;
};

type ExtractRequiredOptionName<O> = O extends { required: true; name: infer N extends string } ? N : never;
type ExtractOptionalOptionName<O> = O extends { name: infer N extends string } ? (O extends { required: true } ? never : N) : never;
type OptionByName<O, Name extends string> = Extract<O, { name: Name }>;
type ExtractOptionName<O> = O extends { name: infer N extends string } ? N : never;

type InferOptionArg<O> = O extends LeafSubcommandGroupOption ? SubcommandGroupArgs<O>
  : O extends LeafSubcommandOption ? ExtractArgsFromOptions<O['options']>
  : O extends { type: infer Type } ? Type extends keyof LeafTypeMap ? LeafTypeMap[Type]
    : never
  : never;

type SubcommandGroupArgs<G extends LeafSubcommandGroupOption> = {
  [Sub in G['options'][number] as ExtractOptionName<Sub>]: ExtractArgsFromOptions<Sub['options']>;
};

export type ChatInputArgs<C extends ChatInputCommandJSON> = ExtractArgsFromOptions<C['options']>;

export type AutoCompleteResponse = {
  results: APIApplicationCommandOptionChoice[];
  perPage?: number;
  allowEmptySearch?: boolean;
};

export type DynamicInjectedHandler<V extends ChatInputCommandJSON> = {
  callback(passthrough: {
    framework: DiscordFramework;
    interaction: ChatInputCommandInteraction;
    guild: Guild;
    channel: GuildBasedChannel;
    invoker: GuildMember;
    bot: GuildMember;
    args: ChatInputArgs<V>;
  }): Promise<void>;
  component?(passthrough: {
    framework: DiscordFramework;
    interaction: MessageComponentInteraction | ModalSubmitInteraction;
    customId: string;
    state: unknown | null;
  }): Promise<void>;
  modal?(passthrough: {
    framework: DiscordFramework;
    interaction: ModalSubmitInteraction;
    customId: string;
    resolver: ModalComponentResolver;
    state: unknown | null;
  }): Promise<void>;
  autocomplete?(passthrough: {
    framework: DiscordFramework;
    interaction: AutocompleteInteraction;
    focused: unknown;
  }): Promise<AutoCompleteResponse | null>;
};

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

export interface LeafDefinition<T extends ChatInputCommandJSON> {
  schema: T;
  options: HandlerOptions;
  handler: DynamicInjectedHandler<T>;
}
