import type { ChatInputCommandInteraction, CommandInteractionOption } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';

/**
 * Parses all options from a ChatInputCommandInteraction into a plain object.
 * Handles subcommands, subcommand groups, and all option types recursively.
 *
 * @param interaction - The Discord.js ChatInputCommandInteraction to parse.
 * @returns An object mapping option names to their resolved values.
 */
export function parse(interaction: ChatInputCommandInteraction): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  for (const option of interaction.options.data) {
    switch (option.type) {
      case ApplicationCommandOptionType.SubcommandGroup:
        // Subcommand groups contain subcommands
        args[option.name] = {};
        if (option.options) {
          for (const sub of option.options) {
            if (sub.type === ApplicationCommandOptionType.Subcommand) {
              (args[option.name] as Record<string, unknown>)[sub.name] = parseSubcommandOptions(interaction, sub.options ?? []);
            }
          }
        }
        break;
      case ApplicationCommandOptionType.Subcommand:
        args[option.name] = parseSubcommandOptions(interaction, option.options ?? []);
        break;
      default:
        args[option.name] = resolveOptionValue(interaction, option);
    }
  }
  return args;
}

/**
 * Parses options for a subcommand into a plain object.
 *
 * @param interaction - The parent ChatInputCommandInteraction.
 * @param options - The options array for the subcommand.
 * @returns An object mapping option names to their resolved values.
 */
function parseSubcommandOptions(
  interaction: ChatInputCommandInteraction,
  options: readonly CommandInteractionOption[],
): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (const option of options) {
    args[option.name] = resolveOptionValue(interaction, option);
  }
  return args;
}

/**
 * Resolves the value of a single command option, handling Discord.js option types.
 *
 * @param interaction - The parent ChatInputCommandInteraction.
 * @param option - The option to resolve.
 * @returns The resolved value for the option, or null if not found.
 */
function resolveOptionValue(
  interaction: ChatInputCommandInteraction,
  option: CommandInteractionOption,
): unknown {
  switch (option.type) {
    case ApplicationCommandOptionType.User:
      return interaction.options.getUser(option.name) ?? null;
    case ApplicationCommandOptionType.Channel:
      return interaction.options.getChannel(option.name) ?? null;
    case ApplicationCommandOptionType.Role:
      return interaction.options.getRole(option.name) ?? null;
    case ApplicationCommandOptionType.Mentionable:
      return (
        interaction.options.getUser(option.name) ||
        interaction.options.getRole(option.name)
      ) ?? null;
    case ApplicationCommandOptionType.Attachment:
      return interaction.options.getAttachment(option.name) ?? null;
    default:
      return option.value;
  }
}
