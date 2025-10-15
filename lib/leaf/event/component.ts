import { DiscordFramework } from '@amethyst/ddframework';
import { MessageFlags } from 'discord.js';
import { ResponseBuilder } from '../../util/response/response.ts';

export function injectComponentHandler(framework: DiscordFramework): void {
  framework.djs.on('interactionCreate', async (interaction) => {
    if (!interaction.isMessageComponent()) return;
    if (!interaction.customId) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Missing Callback Identifier. This is likely a bug.',
            new Deno.errors.NotFound('Unable to find customId for Message Component Callback'),
          ),
        ],
      });
      return;
    }
    const state = framework.state.retrieve(interaction.customId, interaction.user.id);
    if (state === null) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Invalid/Expired State of Callback Identifier.',
            new Deno.errors.NotFound('State not found or expired for Message Component Callback.'),
          ),
        ],
      });
      return;
    }

    const linkedOptions = framework.leaf.linkedOptions.get(state.groupId);
    if (!linkedOptions) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Linked options not found for the callback identifier.',
            new Deno.errors.NotFound('Linked options not found for Message Component Callback.'),
          ),
        ],
      });
      return;
    }

    const linkedHandler = framework.leaf.linkedDynamics.get(state.groupId);
    if (!linkedHandler) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Linked handler not found for the callback identifier.',
            new Deno.errors.NotFound('Linked handler not found for Message Component Callback.'),
          ),
        ],
      });
      return;
    }

    // Further processing with linkedOptions and state.value can be done here.
  });
}
