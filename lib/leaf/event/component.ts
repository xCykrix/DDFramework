import type { DiscordFramework } from '@amethyst/ddframework';
import { ResponseBuilder } from '../../util/response/response.ts';
import { intercept } from '../intercept.ts';

/**
 * Injects a handler for Discord.js message component interactions into the framework.
 *
 * This function listens for 'interactionCreate' events, filters for message components,
 * validates the interaction, retrieves state and handler, and invokes the component callback.
 *
 * All errors and invalid states are handled with internal responses and logged via the framework's ledger.
 *
 * @param framework - The DiscordFramework instance to inject the handler into.
 */
export function injectComponentHandler(framework: DiscordFramework): void {
  framework.djs.on(
    'interactionCreate',
    intercept('interactionCreate', framework, 'leaf/event/component', async (interaction) => {
      // Verify Interaction is Processable by Handler.
      if (!interaction.isMessageComponent()) return;
      if (!interaction.customId) {
        await ResponseBuilder.make({
          header: 'Missing Callback Identifier',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: `Unable to find customId for Message Component Callback: \`${interaction.customId}\``,
          },
        });
        return;
      }

      // Get State or Reject Interaction.
      const state = framework.state.retrieve(interaction.customId, interaction.user.id);
      if (state === null) {
        await ResponseBuilder.make({
          header: 'Invalid/Expired Callback State',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: `State not found or expired for Message Component Callback: \`${interaction.customId}\``,
          },
        });
        return;
      }

      // Get Linked Options or Reject Interaction.
      const linkedOptions = framework.leaf.linkedOptions.get(state.groupId);
      if (!linkedOptions) {
        await ResponseBuilder.make({
          header: 'Linked Options Not Found',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: 'Linked options not found for Message Component Callback.',
          },
        });
        return;
      }

      // Check Linked Handler
      const linkedHandler = framework.leaf.linkedDynamics.get(state.groupId);
      if (linkedHandler === undefined || linkedHandler.component === undefined) {
        await ResponseBuilder.make({
          header: 'Linked Handler Not Found',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: 'Linked handler or component callback not found for Message Component Callback.',
          },
        });
        return;
      }

      // Execute Callback to Component.
      await linkedHandler.component({
        framework,
        interaction,
        customId: state.groupId,
        state,
      });
    }),
  );
}
