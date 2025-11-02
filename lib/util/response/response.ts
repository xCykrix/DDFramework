import type { DiscordFramework } from '@amethyst/ddframework';
import { type ActionRowBuilder, type ChatInputCommandInteraction, ContainerBuilder, type InteractionEditReplyOptions, type InteractionReplyOptions, type MessageComponentInteraction, MessageFlags, type ModalSubmitInteraction, type PermissionResolvable, SeparatorSpacingSize } from 'discord.js';

/**
 * Utility class for building and sending Discord.js interaction responses.
 *
 * Provides helpers for replying, editing, and formatting error and permission messages.
 */
export class ResponseBuilder {
  /**
   * Sends or edits a reply to a Discord interaction, depending on its state.
   *
   * @param interaction - The interaction to respond to (chat, component, or modal).
   * @param options - The reply or edit options.
   */
  public static async handle(
    interaction:
      | ChatInputCommandInteraction
      | MessageComponentInteraction
      | ModalSubmitInteraction,
    options: InteractionReplyOptions | InteractionEditReplyOptions,
    forceEditReply = false,
  ): Promise<void> {
    if (interaction.replied || interaction.deferred || forceEditReply) {
      await interaction.editReply(options as InteractionEditReplyOptions);
    } else {
      await interaction.reply(options as InteractionReplyOptions);
    }
  }

  /**
   * Builds a full interaction reply with custom components and a timestamp.
   *
   * @param callback - Function to configure the ContainerBuilder.
   * @returns The reply options for editing or replying to an interaction.
   */
  public static full(
    callback: (builder: ContainerBuilder) => void,
  ): InteractionEditReplyOptions {
    const builder = new ContainerBuilder();
    callback(builder);
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [
        builder
          .addSeparatorComponents((b) => b.setSpacing(SeparatorSpacingSize.Small))
          .addTextDisplayComponents((b) =>
            b.setContent(
              `-# <t:${Math.floor(Date.now() / 1000)}:F>`,
            )
          ),
      ],
    };
  }

  /**
   * Builds a fixed-content interaction reply with a timestamp.
   *
   * @param content - The lines of content to display.
   * @returns The reply options for editing or replying to an interaction.
   */
  public static fixed(content: string[]): InteractionEditReplyOptions {
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents((b) => b.setContent(content.join('\n')))
          .addSeparatorComponents((b) => b.setSpacing(SeparatorSpacingSize.Small))
          .addTextDisplayComponents((b) =>
            b.setContent(
              `-# <t:${Math.floor(Date.now() / 1000)}:F>`,
            )
          ),
      ],
    };
  }

  /**
   * Builds a fixed-content interaction reply with a timestamp and an action row.
   *
   * @param content - The lines of content to display.
   * @param actionrowBuilder - The action builder to append.
   * @returns The reply options for editing or replying to an interaction.
   */
  public static fixedWithActionRow(content: string[], actionrowBuilder: ActionRowBuilder): InteractionEditReplyOptions {
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents((b) => b.setContent(content.join('\n')))
          .addSeparatorComponents((b) => b.setSpacing(SeparatorSpacingSize.Small))
          .addActionRowComponents(actionrowBuilder)
          .addSeparatorComponents((b) => b.setSpacing(SeparatorSpacingSize.Small))
          .addTextDisplayComponents((b) =>
            b.setContent(
              `-# <t:${Math.floor(Date.now() / 1000)}:F>`,
            )
          ),
      ],
    };
  }

  /**
   * Builds an internal error response and logs the error with a unique support ID.
   *
   * @param framework - The DiscordFramework instance for logging.
   * @param message - The error message to display.
   * @param context - The error context (exception object).
   * @returns The reply options for editing or replying to an interaction.
   */
  public static internal(
    framework: DiscordFramework,
    message: string,
    context: Error,
  ): InteractionEditReplyOptions {
    const id = crypto.randomUUID();
    framework.ledger.severe(`[${id}] Internal Error Response - ${message}`, {
      err: context,
    });
    return this.full(
      (builder) =>
        builder
          .addTextDisplayComponents((b) =>
            b.setContent([
              'This request was acknowledged but not processed due to one or more internal exceptions or security violations. Please try again later or report this as an issue.',
              '',
              `**Technical Details**: ${message}`,
              `**Support ID**: ${id}`,
            ].join('\n'))
          ),
    );
  }

  /**
   * Builds a permission error response for missing permissions.
   *
   * @param permissions - The required permissions.
   * @param origin - 'You' or 'I', indicating who is missing the permissions.
   * @param channel - Whether the permission is channel-specific.
   * @returns The reply options for editing or replying to an interaction.
   */
  public static permission(
    permissions: PermissionResolvable,
    origin: 'You' | 'I',
    channel: boolean,
  ): InteractionEditReplyOptions {
    return this.full((builder) =>
      builder.addTextDisplayComponents((b) =>
        b.setContent([
          `${origin} do not have the required permissions to perform this action${channel ? ` in this channel.` : '.'}.`,
          '',
          `**Missing Permissions**: ${permissions.toString()}`,
        ].join('\n'))
      )
    );
  }
}
