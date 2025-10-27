import type { DiscordFramework } from '@amethyst/ddframework';
import { ResponseBuilder } from '../../util/response/response.ts';
import { intercept } from '../intercept.ts';

/**
 * Injects a handler for Discord.js modal submit interactions into the framework.
 *
 * This function listens for 'interactionCreate' events, filters for modal submissions,
 * validates the interaction, retrieves state and handler, and invokes the modal callback.
 *
 * All errors and invalid states are handled with internal responses and logged via the framework's ledger.
 *
 * @param framework - The DiscordFramework instance to inject the handler into.
 */
export function injectModalHandler(framework: DiscordFramework): void {
  framework.djs.on(
    'interactionCreate',
    intercept(framework, 'leaf/event/modal', async (interaction) => {
      // Only process modal submit interactions
      if (!interaction.isModalSubmit()) return;

      // Ensure the interaction has a customId
      if (!interaction.customId) {
        await ResponseBuilder.handle(
          interaction,
          ResponseBuilder.internal(
            framework,
            'Missing Callback Identifier. This is likely a bug.',
            new Deno.errors.NotFound('Unable to find customId for Modal Submit Callback'),
          ),
        );
        return;
      }

      // Retrieve state for the modal interaction
      const state = framework.state.retrieve(interaction.customId, interaction.user.id);
      if (state === null) {
        await ResponseBuilder.handle(
          interaction,
          ResponseBuilder.internal(
            framework,
            'Invalid/Expired State of Callback Identifier. Please issue the original request again.',
            new Deno.errors.NotFound('State not found or expired for Modal Submit Callback.'),
          ),
        );
        return;
      }

      // Retrieve linked handler options
      const linkedOptions = framework.leaf.linkedOptions.get(state.groupId);
      if (!linkedOptions) {
        await ResponseBuilder.handle(
          interaction,
          ResponseBuilder.internal(
            framework,
            'Linked options not found for the callback identifier.',
            new Deno.errors.NotFound('Linked options not found for Modal Submit Callback.'),
          ),
        );
        return;
      }

      // Retrieve the linked handler for the modal
      const linkedHandler = framework.leaf.linkedDynamics.get(state.groupId);
      if (linkedHandler === undefined || linkedHandler.modal === undefined) {
        await ResponseBuilder.handle(
          interaction,
          ResponseBuilder.internal(
            framework,
            'Linked handler not found for the callback identifier.',
            new Deno.errors.NotFound('Linked handler or modal callback not found for Message Component Callback.'),
          ),
        );
        return;
      }

      // Execute the modal callback
      await linkedHandler.modal({
        framework,
        interaction,
        customId: interaction.customId,
        resolver: interaction.components,
        state,
      });
    }),
  );
}
