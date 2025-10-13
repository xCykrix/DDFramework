import { ApplicationCommandOptionType, type ChatInputCommandInteraction } from 'discord.js';

/**
 * Extracts the full path of a Discord application command from an interaction object.
 *
 * Traverses subcommands and subcommand groups to build a dot-separated path string.
 *
 * @param interaction - The Discord interaction object.
 * @returns The full command path as a string, or null if not found.
 * @example
 * // For a command /foo bar baz, returns 'foo.bar.baz'
 */
export function getFirstPathOfApplicationCommand(interaction: ChatInputCommandInteraction): string | null {
  let path = interaction.commandName;
  let options = interaction.options;

  while (Array.isArray(options) && options.length > 0) {
    const option = options[0];
    if (
      option.type === ApplicationCommandOptionType.Subcommand ||
      option.type === ApplicationCommandOptionType.SubcommandGroup
    ) {
      path += `.${option.name}`;
      options = option.options;
    } else {
      break;
    }
  }

  return path;
}
