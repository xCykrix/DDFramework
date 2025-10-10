import { Discordeno } from '../../../deps.ts';

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
export function getFirstPathOfApplicationCommand(interaction: Partial<Discordeno.Interaction>): string | null {
  if (!interaction?.data?.name) return null;

  let path = interaction.data.name;
  let options = interaction.data.options;

  while (Array.isArray(options) && options.length > 0) {
    const option = options[0];
    if (
      option.type === Discordeno.ApplicationCommandOptionTypes.SubCommand ||
      option.type === Discordeno.ApplicationCommandOptionTypes.SubCommandGroup
    ) {
      path += `.${option.name}`;
      options = option.options;
    } else {
      break;
    }
  }

  return path;
}
