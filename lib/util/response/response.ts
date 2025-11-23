import type { DiscordFramework } from '@amethyst/ddframework';
import { type ChatInputCommandInteraction, ContainerBuilder, type InteractionEditReplyOptions, type InteractionReplyOptions, type InteractionUpdateOptions, type MessageComponentInteraction, MessageFlags, type ModalSubmitInteraction, type PermissionResolvable, SeparatorSpacingSize } from 'discord.js';

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
    options: InteractionReplyOptions | InteractionEditReplyOptions | InteractionUpdateOptions,
    forceUpdateReply = false,
  ): Promise<void> {
    // Just reply if we do not want to run logic parsing.
    if (forceUpdateReply) {
      if (interaction.deferred) {
        await interaction.editReply(options as InteractionEditReplyOptions);
      } else {
        await interaction.reply(options as InteractionReplyOptions);
      }
      return;
    }

    if ((interaction.isButton() && interaction.message) || interaction.isSelectMenu() || (interaction.isModalSubmit() && interaction.isFromMessage())) {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(options as InteractionEditReplyOptions);
      } else {
        await interaction.update(options as InteractionUpdateOptions);
      }
      return;
    }

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(options as InteractionEditReplyOptions);
      return;
    }

    // Catch-all Reply
    await interaction.reply(options as InteractionReplyOptions);
  }

  public static async make(
    struct: {
      header?: string;
      description?: string | string[];
      callback?: (builder: ContainerBuilder) => ContainerBuilder;
      error?: {
        framework: DiscordFramework;
        ulid: string;
        cause: string;
      };
      options?: {
        timestamp?: boolean;
        forceUpdateReply?: boolean;
      };
    },
    interaction?:
      | ChatInputCommandInteraction
      | MessageComponentInteraction
      | ModalSubmitInteraction,
  ): Promise<void | InteractionEditReplyOptions> {
    let builder = new ContainerBuilder();
    if (struct.header) {
      builder = builder
        .addTextDisplayComponents((b) => b.setContent(`**${struct.header}**`))
        .addSeparatorComponents((b) => b.setSpacing(SeparatorSpacingSize.Small));
    }
    if (struct.description) {
      builder = builder
        .addTextDisplayComponents((b) => b.setContent(`${Array.isArray(struct.description) ? struct.description.join('\n') : struct.description}`))
        .addSeparatorComponents((b) => b.setSpacing(SeparatorSpacingSize.Small));
    }
    builder = struct.callback ? struct.callback(builder) : builder;
    if (!struct.header && !struct.description) {
      builder = builder.addSeparatorComponents((b) => b.setSpacing(SeparatorSpacingSize.Small));
    }
    if (struct.options?.timestamp ?? true) {
      builder = builder
        .addTextDisplayComponents((b) => b.setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F>` + (struct.error?.ulid ? ` | Reference: ${struct.error.ulid}` : '')));
    }
    if (struct.error?.cause) {
      struct.error?.framework.ledger.warning(
        `Non-fatal Tracked Error`,
        {
          ulid: struct.error.ulid,
          header: struct.header,
          description: struct.description,
          cause: struct.error.cause,
        },
      );
    }
    if (interaction) {
      await this.handle(interaction, { flags: MessageFlags.IsComponentsV2, components: [builder] }, struct.options?.forceUpdateReply ?? false);
      return;
    }
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [builder],
    };
  }

  public static async processing(options: {
    framework: DiscordFramework;
    interaction:
      | ChatInputCommandInteraction
      | MessageComponentInteraction
      | ModalSubmitInteraction;
  }): Promise<void> {
    await this.make({
      header: 'Processing Request',
      description: [
        'Your request has been acknowledged and is being processed. Please wait...',
        '',
        'This message will be updated once processing is complete. If this takes longer than expected, please try again after a moment or report an issue..',
      ],
    }, options.interaction) as InteractionEditReplyOptions;
  }

  public static async pcheck(options: {
    framework: DiscordFramework;
    interaction:
      | ChatInputCommandInteraction
      | MessageComponentInteraction
      | ModalSubmitInteraction;
    permissions: PermissionResolvable;
    origin: 'You' | 'I';
    channel: boolean;
  }): Promise<void> {
    await this.make({
      header: 'Permission Error',
      description: [
        `${options.origin} do not have the required permissions to perform this action${options.channel ? ` in this channel.` : '.'}.`,
        '',
        `**Missing Permissions**: ${options.permissions.toString()}`,
      ].join('\n'),
    }, options.interaction) as InteractionEditReplyOptions;
  }
}
