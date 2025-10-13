import { type ChatInputCommandInteraction } from 'discord.js';

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
  let path = '';

  const parts = {
    base: interaction.commandName,
    subCommandGroup: interaction.options.getSubcommandGroup(false),
    subCommand: interaction.options.getSubcommand(false),
  };

  path += parts.base;
  if (parts.subCommandGroup !== null) path += `.${parts.subCommandGroup}`;
  if (parts.subCommand !== null) path += `.${parts.subCommand}`;

  return (path.trim().length !== 0) ? path : null;
}
