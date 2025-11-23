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
    intercept('interactionCreate', framework, 'leaf/event/modal', async (interaction) => {
      // Only process modal submit interactions
      if (!interaction.isModalSubmit()) return;

      // Ensure the interaction has a customId
      if (!interaction.customId) {
        await ResponseBuilder.make({
          header: 'Missing Callback Identifier',
          description: 'This is likely a bug. Please report this issue if it continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: 'Unable to find customId for Modal Submit Callback',
          },
        });
        return;
      }

      // Retrieve state for the modal interaction
      const state = framework.state.retrieve(interaction.customId, interaction.user.id);
      if (state === null) {
        await ResponseBuilder.make({
          header: 'Invalid/Expired Callback State',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: `State not found or expired for Modal Submit Callback: \`${interaction.customId}\``,
          },
        });
        return;
      }

      // Retrieve linked handler options
      const linkedOptions = framework.leaf.linkedOptions.get(state.groupId);
      if (!linkedOptions) {
        await ResponseBuilder.make({
          header: 'Linked Options Not Found',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: 'Linked options not found for Modal Submit Callback.',
          },
        });
        return;
      }

      // Retrieve the linked handler for the modal
      const linkedHandler = framework.leaf.linkedDynamics.get(state.groupId);
      if (linkedHandler === undefined || linkedHandler.modal === undefined) {
        await ResponseBuilder.make({
          header: 'Linked Handler Not Found',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: 'Linked handler not found for Modal Submit Callback.',
          },
        });
        return;
      }

      // Execute the modal callback
      await linkedHandler.modal({
        framework,
        interaction,
        customId: state.groupId,
        resolver: interaction.components,
        state,
      });
    }),
  );
}
