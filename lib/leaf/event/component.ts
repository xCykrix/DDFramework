import type { DiscordFramework } from '@amethyst/ddframework';
import { ResponseBuilder } from '../../util/response/response.ts';
import { intercept } from '../intercept.ts';

export function injectComponentHandler(framework: DiscordFramework): void {
  framework.djs.on(
    'interactionCreate',
    intercept(framework, 'leaf/event/component', async (interaction) => {
      // Verify Interaction is Processable by Handler.
      if (!interaction.isMessageComponent()) return;
      if (!interaction.customId) {
        await ResponseBuilder.handle(
          interaction,
          ResponseBuilder.internal(
            framework,
            'Missing Callback Identifier. This is likely a bug.',
            new Deno.errors.NotFound('Unable to find customId for Message Component Callback'),
          ),
        );
        return;
      }

      // Get State or Reject Interaction.
      const state = framework.state.retrieve(interaction.customId, interaction.user.id);
      if (state === null) {
        await ResponseBuilder.handle(
          interaction,
          ResponseBuilder.internal(
            framework,
            'Invalid/Expired State of Callback Identifier. Please issue the original request again.',
            new Deno.errors.NotFound('State not found or expired for Message Component Callback.'),
          ),
        );
        return;
      }

      // Get Linked Options or Reject Interaction.
      const linkedOptions = framework.leaf.linkedOptions.get(state.groupId);
      if (!linkedOptions) {
        await ResponseBuilder.handle(
          interaction,
          ResponseBuilder.internal(
            framework,
            'Linked options not found for the callback identifier.',
            new Deno.errors.NotFound('Linked options not found for Message Component Callback.'),
          ),
        );
        return;
      }

      // Check Linked Handler
      const linkedHandler = framework.leaf.linkedDynamics.get(state.groupId);
      if (linkedHandler === undefined || linkedHandler.component === undefined) {
        await ResponseBuilder.handle(
          interaction,
          ResponseBuilder.internal(
            framework,
            'Linked handler not found for the callback identifier.',
            new Deno.errors.NotFound('Linked handler or component callback not found for Message Component Callback.'),
          ),
        );
        return;
      }

      // Execute Callback to Component.
      await linkedHandler.component({
        framework,
        interaction,
        customId: interaction.customId,
        state,
      });
    }),
  );
}
