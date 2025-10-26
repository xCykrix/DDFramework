import type { DiscordFramework } from '@amethyst/ddframework';
import { type ChatInputCommandInteraction, ContainerBuilder, type InteractionEditReplyOptions, type InteractionReplyOptions, type MessageComponentInteraction, MessageFlags, type ModalSubmitInteraction, type PermissionResolvable, SeparatorSpacingSize } from 'discord.js';

export class ResponseBuilder {
  public static async handle(
    interaction:
      | ChatInputCommandInteraction
      | MessageComponentInteraction
      | ModalSubmitInteraction,
    options: InteractionReplyOptions | InteractionEditReplyOptions,
  ): Promise<void> {
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(options as InteractionEditReplyOptions);
    } else {
      await interaction.reply(options as InteractionReplyOptions);
    }
  }

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
