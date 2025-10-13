import type { ChatInputCommandInteraction } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';

// Discord.js version: parses options from a ChatInputCommandInteraction
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

import type { CommandInteractionOption } from 'discord.js';

function parseSubcommandOptions(interaction: ChatInputCommandInteraction, options: readonly CommandInteractionOption[]): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (const option of options) {
    args[option.name] = resolveOptionValue(interaction, option);
  }
  return args;
}

function resolveOptionValue(interaction: ChatInputCommandInteraction, option: CommandInteractionOption): unknown {
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
