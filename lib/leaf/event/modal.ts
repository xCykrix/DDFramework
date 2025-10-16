import type { DiscordFramework } from '@amethyst/ddframework';
import { MessageFlags } from 'discord.js';
import { ResponseBuilder } from '../../util/response/response.ts';

export function injectModalHandler(framework: DiscordFramework): void {
  framework.djs.on('interactionCreate', async (interaction) => {
    // Verify Interaction is Processable by Handler.
    if (!interaction.isModalSubmit()) return;
    if (!interaction.customId) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Missing Callback Identifier. This is likely a bug.',
            new Deno.errors.NotFound('Unable to find customId for Modal Submit Callback'),
          ),
        ],
      });
      return;
    }

    // Get State or Reject Interaction.
    const state = framework.state.retrieve(interaction.customId, interaction.user.id);
    if (state === null) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Invalid/Expired State of Callback Identifier. Please issue the original request again.',
            new Deno.errors.NotFound('State not found or expired for Modal Submit Callback.'),
          ),
        ],
      });
      return;
    }

    // Get Linked Options or Reject Interaction.
    const linkedOptions = framework.leaf.linkedOptions.get(state.groupId);
    if (!linkedOptions) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Linked options not found for the callback identifier.',
            new Deno.errors.NotFound('Linked options not found for Modal Submit Callback.'),
          ),
        ],
      });
      return;
    }

    // Check Linked Handler
    const linkedHandler = framework.leaf.linkedDynamics.get(state.groupId);
    if (linkedHandler === undefined || linkedHandler.modal === undefined) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Linked handler not found for the callback identifier.',
            new Deno.errors.NotFound('Linked handler or modal callback not found for Message Component Callback.'),
          ),
        ],
      });
      return;
    }

    // Execute Callback to Component.
    await linkedHandler.modal({
      framework,
      interaction,
      customId: interaction.customId,
      resolver: interaction.components,
      state,
    });
  });
}
