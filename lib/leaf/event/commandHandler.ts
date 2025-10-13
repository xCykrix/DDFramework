import type { DiscordFramework } from '@amethyst/ddframework';
import { getFirstPathOfApplicationCommand } from '../../util/command.helper.ts';
import { parse } from '../parse.ts';

export function injectCommandHandler(framework: DiscordFramework): void {
  framework.djs.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Extract Path
    const path = getFirstPathOfApplicationCommand(interaction);
    const args = parse(interaction);

    console.info(path, args);
  });
}
