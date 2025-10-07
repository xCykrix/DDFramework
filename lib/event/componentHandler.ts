import { Discordeno } from '../../deps.ts';
import type { DDFramework } from '../../mod.ts';
import type { DDFrameworkOptions } from '../../mod.types.ts';
import type { DDFrameworkDesiredProperties } from '../desired.ts';
import { QuickResponse } from '../util/message/quickResponse.ts';

/**
 * Registers the DDFramework component handler for Discord interactions.
 *
 * Handles MessageComponent and ModalSubmit interactions, verifies custom IDs, retrieves linked options and handlers,
 * and passes parsed modal data to the appropriate handler. Responds with error messages for missing or expired state packets.
 *
 * @param framework - The DDFramework instance.
 * @param fwoptions - The framework options.
 */
export function injectComponentHandler(
  framework: DDFramework<DDFrameworkDesiredProperties>,
  fwoptions: DDFrameworkOptions,
): void {
  framework.events.add('interactionCreate', async (interaction) => {
    // Only handle MessageComponent or ModalSubmit interactions
    if (
      interaction.type !== Discordeno.InteractionTypes.MessageComponent &&
      interaction.type !== Discordeno.InteractionTypes.ModalSubmit
    ) return;

    const customId = interaction.data?.customId;
    if (!customId) {
      fwoptions.errorHandler(
        new Deno.errors.InvalidData('[DDFramework:ComponentHandler] Interaction received was missing a customId.'),
        customId,
      );
      return;
    }
    const statePacket = customId ? framework.state.retrieve(customId, `${interaction.user.id}`) : null;

    const linkedOptions = framework.leaf.linkedOptions.get(statePacket?.groupId ?? '');
    if (!linkedOptions) {
      fwoptions.errorHandler(
        new Deno.errors.NotFound(`[DDFramework:ComponentHandler] No linkedOptions found for path: ${customId}`),
        `Custom ID: ${customId}`,
      );
      return;
    }

    const dynamicHandler = framework.leaf.linkedDynamics.get(statePacket?.groupId ?? '');
    if (!dynamicHandler?.component) {
      fwoptions.errorHandler(
        new Deno.errors.NotFound(`[DDFramework:ComponentHandler] No dynamicHandler.component found for path: ${customId}`),
        `Custom ID: ${customId}`,
      );
      return;
    }

    // Build passthrough data
    if ((linkedOptions.components?.requireStatePacket ?? true) && statePacket === null) {
      await interaction.respond(
        QuickResponse.EXPECTED_REJECT(
          'This interaction has expired or is invalid. Please try again.',
        ),
        { isPrivate: true },
      );
      return;
    }

    // Pass to handler
    await dynamicHandler.component({
      interaction,
      baseCustomId: statePacket?.groupId ?? ``,
      statePacket: statePacket?.value ?? null,
      parsedModal: interaction.type === Discordeno.InteractionTypes.ModalSubmit ? parseModal(interaction) : null,
    });
  });
}

/**
 * Parses a Discord modal interaction into a Map of customId-value pairs.
 *
 * Traverses all components and subcomponents, extracting values from text inputs and labels.
 *
 * @param interaction - The Discord modal interaction.
 * @returns Map of customId to value, or null if not a modal submit or no components found.
 */
export function parseModal(
  interaction: DDFramework<DDFrameworkDesiredProperties>['internal']['transformers']['$inferredTypes']['interaction'],
): Map<string, string> | null {
  if (interaction.type !== Discordeno.InteractionTypes.ModalSubmit) return null;
  if (!interaction.data?.components?.length) return null;

  const mappedValues = new Map<string, string>();

  for (const component of interaction.data.components) {
    // Extract direct component values
    if (component.component) {
      const { customId, value, id } = component.component;
      if (customId !== undefined && value !== undefined) {
        mappedValues.set(customId, value);
      } else if (value !== undefined) {
        mappedValues.set(`id-${id}`, value);
      }
    }

    // Traverse subcomponents
    if (component.components?.length) {
      for (const subComponent of component.components) {
        if (subComponent.type === Discordeno.MessageComponentTypes.Label) {
          for (const labelSubComponent of subComponent.components ?? []) {
            if (labelSubComponent.type === Discordeno.MessageComponentTypes.TextInput) {
              const { customId, value, id } = labelSubComponent;
              if (customId !== undefined && value !== undefined) {
                mappedValues.set(customId, value);
              } else if (value !== undefined) {
                mappedValues.set(`id-${id}`, value);
              }
            }
          }
          if (subComponent.component) {
            const { customId, value, id } = subComponent.component;
            if (customId !== undefined && value !== undefined) {
              mappedValues.set(customId, value);
            } else if (value !== undefined) {
              mappedValues.set(`id-${id}`, value);
            }
          }
        }
        if (subComponent.type === Discordeno.MessageComponentTypes.TextInput) {
          const { customId, value, id } = subComponent;
          if (customId !== undefined && value !== undefined) {
            mappedValues.set(customId, value);
          } else if (value !== undefined) {
            mappedValues.set(`id-${id}`, value);
          }
        }
      }
    }
    if (component.type === Discordeno.MessageComponentTypes.TextInput) {
      const { customId, value, id } = component;
      if (customId !== undefined && value !== undefined) {
        mappedValues.set(customId, value);
      } else if (value !== undefined) {
        mappedValues.set(`id-${id}`, value);
      }
    }
  }

  return mappedValues;
}
