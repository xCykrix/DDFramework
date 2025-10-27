import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';

/**
 * Extracts the full path of a Discord application command from an interaction object.
 *
 * Traverses subcommands and subcommand groups to build a dot-separated path string.
 *
 * @param interaction - The Discord.js interaction object (chat input or autocomplete).
 * @returns The full command path as a string (e.g., 'foo.bar.baz'), or null if not found.
 *
 * @example
 * // For a command /foo bar baz, returns 'foo.bar.baz'
 * const path = getFirstPathOfApplicationCommand(interaction);
 */
export function getFirstPathOfApplicationCommand(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
): string | null {
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
