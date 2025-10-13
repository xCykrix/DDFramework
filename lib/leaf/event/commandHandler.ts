import type { DiscordFramework } from '@amethyst/ddframework';
import { getFirstPathOfApplicationCommand } from '../../util/command.helper.ts';

export function injectCommandHandler(framework: DiscordFramework): void {
  framework.djs.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Extract Path
    const path = getFirstPathOfApplicationCommand(interaction);
    console.info(path);
  });
}
