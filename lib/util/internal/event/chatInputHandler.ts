import { Discordeno } from '../../../../deps.ts';
import type { DDFramework } from '../../../../mod.ts';
import type { DDFrameworkDesiredProperties } from '../../../desired.ts';
import type { DDFrameworkOptions } from '../../../options.ts';
import { QuickResponse } from '../../message/quickResponse.ts';
import { getFirstPathOfApplicationCommand } from '../../object/getFirstPathOfApplicationCommand.ts';

/**
 * Injects the chat input handler for Discord application command interactions into the DDFramework event system.
 *
 * This function registers an event listener for 'interactionCreate' events, handling command routing, permission checks,
 * developer restrictions, channel type enforcement, and dynamic handler invocation for chat input commands.
 *
 * @param framework - The DDFramework instance to inject the handler into.
 * @param fwoptions - The framework options, including error handler and developer list.
 */
export function injectChatInputHandler(framework: DDFramework<DDFrameworkDesiredProperties>, fwoptions: DDFrameworkOptions): void {
  framework.events.add('interactionCreate', async (interaction) => {
    // Verify Interaction is ApplicationCommand.
    if (interaction.type !== Discordeno.InteractionTypes.ApplicationCommand) return;

    // Path Extraction
    const path = getFirstPathOfApplicationCommand(interaction);
    if (path === null) return;

    // Late Validate State
    if (interaction.data?.name !== path.split('.')[0]) return;

    // Extract DynamicLink Options
    const options = framework.leaf.linkedOptions.get(path);
    if (options === undefined) {
      fwoptions?.errorHandler(
        new Deno.errors.InvalidData(`[DDFramework:InternalError] No linked options found for path: ${path}`),
      );
      await interaction.respond(QuickResponse.INTERNAL_REJECT(
        fwoptions,
        'This action is not correctly configured. Please report this issue to the bot developer. (LINKED_OPTIONS_MISSING)',
      ));
      return;
    }

    // Extract DynamicLink Handler
    const handler = framework.leaf.linkedDynamics.get(path);
    if (handler === undefined) {
      fwoptions?.errorHandler(
        new Deno.errors.InvalidData(`[DDFramework:InternalError] No linked handler found for path: ${path}`),
      );
      await interaction.respond(QuickResponse.INTERNAL_REJECT(
        fwoptions,
        'This action is not correctly configured. Please report this issue to the bot developer. (LINKED_HANDLER_MISSING)',
      ));
      return;
    }

    // Enforce Guild Requirement
    if (options.guild?.required && interaction.guildId === undefined) {
      await interaction.respond(QuickResponse.INTERNAL_REJECT(
        fwoptions,
        'This action is restricted to use in guild context. Please do not issue this via DMs.',
      ));
      return;
    }

    // Enforce Developer Requirement
    if (options.developerRequired && !fwoptions.developers.includes(`${interaction.user.id}`)) {
      await interaction.respond(QuickResponse.INTERNAL_REJECT(
        fwoptions,
        'This is a restricted action. You do not have permission to issue this request.',
      ));
      return;
    }

    // Enforce Channel Types
    if (options.channelTypesRequired.length === 0) {
      await interaction.respond(QuickResponse.INTERNAL_REJECT(
        fwoptions,
        'This action is not correctly configured to access channel types. Please report this issue to the bot developer.',
      ));
      return;
    }
    if (interaction.channel.type === undefined || !(options.channelTypesRequired as Discordeno.ChannelTypes[]).includes(interaction.channel.type)) {
      await interaction.respond(QuickResponse.INTERNAL_REJECT(
        fwoptions,
        `This action is not configured to access '${Object.entries(Discordeno.ChannelTypes).find(([_, v]) => v === interaction.channel.type)?.[0]}' types. Please report this issue to the bot developer if you believe this is an error.`,
      ));
      return;
    }

    // Enforce Permissions [guild?.required === true]
    if (options.guild?.required) {
      const guild = (await framework.internal.cache.guilds.get(interaction.guildId!))!;
      const member = (await framework.internal.cache.members.get(interaction.user.id, interaction.guildId!))!;
      const channel = (await framework.internal.cache.channels.get(interaction.channelId!))!;

      if (guild === undefined || member === undefined || channel === undefined) {
        fwoptions?.errorHandler(
          new Deno.errors.InvalidData(`[DDFramework:InternalError] Cache data for interaction '${interaction.id}' was missing. GID:${interaction.guildId}/CA${guild?.id}, UID:${interaction.user.id}/CA${member?.id}, CID:${interaction.channelId}/CA${channel?.id}`),
        );
        await interaction.respond(QuickResponse.INTERNAL_REJECT(
          fwoptions,
          'This action was not able to access the required guild data. Please report this issue to the bot developer if this issue persists. (GUILD_DATA_MISSING/MULTI_CACHE_MISS)',
        ));
        return;
      }

      // Check User Permissions
      if (options.guild.userRequiredGuildPermissions.length > 0 && !framework.helpers.permissions.hasGuildPermissions(guild, interaction.member!, options.guild.userRequiredGuildPermissions)) {
        await interaction.respond(
          QuickResponse.PERMISSIONS_CHECK_FAILED(
            fwoptions,
            'User',
            options.guild.userRequiredGuildPermissions,
          ),
        );
        return;
      }

      if (options.guild.userRequiredChannelPermissions.length > 0 && interaction.channelId !== undefined) {
        if (!framework.helpers.permissions.hasChannelPermissions(guild, channel.id, member, options.guild.userRequiredChannelPermissions)) {
          await interaction.respond(
            QuickResponse.PERMISSIONS_CHECK_FAILED(
              fwoptions,
              'User',
              options.guild.userRequiredChannelPermissions,
            ),
          );
          return;
        }
      }

      // Check Bot Permissions
      let botMember = (await framework.internal.cache.members.get(framework.internal.id, interaction.guildId!))!;
      if (botMember === undefined) {
        await framework.internal.helpers.getMember(interaction.guildId!, framework.internal.id);
        botMember = (await framework.internal.cache.members.get(framework.internal.id, interaction.guildId!))!;
      }
      if (botMember === undefined) {
        fwoptions?.errorHandler(
          new Deno.errors.InvalidData(`[DDFramework:InternalError] Bot cache data for interaction '${interaction.id}' was missing. GID:${interaction.guildId}/CA${guild?.id}, UID:${framework.internal.id}/CA${undefined}, CID:${interaction.channelId}/CA${channel?.id}`),
        );
        await interaction.respond(QuickResponse.INTERNAL_REJECT(
          fwoptions,
          'This action was not able to access the required guild data. Please report this issue to the bot developer if this issue persists. (GUID_DATA_MISSING/BOT_MEMBER_CACHE_MISS)',
        ));
        return;
      }

      if (options.guild.botRequiredGuildPermissions.length > 0 && !framework.helpers.permissions.hasGuildPermissions(guild, botMember, options.guild.botRequiredGuildPermissions)) {
        await interaction.respond(
          QuickResponse.PERMISSIONS_CHECK_FAILED(
            fwoptions,
            'Bot',
            options.guild.botRequiredGuildPermissions,
          ),
        );
        return;
      }

      if (options.guild.botRequiredChannelPermissions.length > 0 && interaction.channelId !== undefined) {
        if (!framework.helpers.permissions.hasChannelPermissions(guild, channel.id, botMember, options.guild.botRequiredChannelPermissions)) {
          await interaction.respond(
            QuickResponse.PERMISSIONS_CHECK_FAILED(
              fwoptions,
              'Bot',
              options.guild.botRequiredChannelPermissions,
            ),
          );
          return;
        }
      }
    }

    await handler.callback({
      framework,
      interaction,
      guild: options.guild?.required ? (await framework.internal.cache.guilds.get(interaction.guildId!))! : undefined,
      member: options.guild?.required ? (await framework.internal.cache.members.get(interaction.user.id, interaction.guildId!))! : undefined,
      botMember: options.guild?.required ? (await framework.internal.cache.members.get(framework.internal.id, interaction.guildId!))! : undefined,
      // deno-lint-ignore no-explicit-any -- Dynamic typing based on extracted types at runtime.
      args: Discordeno.commandOptionsParser(interaction) as any,
    });
  });
}
