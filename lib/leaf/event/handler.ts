import type { DiscordFramework } from '@amethyst/ddframework';
import { GuildBasedChannel, GuildChannelType, GuildMember, MessageFlags } from 'discord.js';
import { getFirstPathOfApplicationCommand } from '../../util/command.helper.ts';
import { ResponseBuilder } from '../../util/response/response.ts';
import { parse } from '../parse.ts';

export function injectCommandHandler(framework: DiscordFramework): void {
  framework.djs.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.guildId === null) return;
    if (interaction.channel?.isDMBased()) return;
    if (!interaction.channel?.isSendable()) return;

    // Extract Path
    const path = getFirstPathOfApplicationCommand(interaction);
    if (path === null) return;

    // Late Validate
    if (interaction.commandName !== path?.split('.')[0]) return;

    // Get Linked Options
    const options = framework.leaf.linkedOptions.get(path);
    if (options === undefined) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Missing Linked Options for Interaction.',
            new Deno.errors.NotFound(`Missing Linked Options for Interaction (${path})`),
          ),
        ],
      });
      return;
    }

    // Get Linked Handler
    const handler = framework.leaf.linkedDynamics.get(path);
    if (handler === undefined) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Missing Linked Handler for Interaction.',
            new Deno.errors.NotFound(`Missing Linked Handler for Interaction (${path})`),
          ),
        ],
      });
      return;
    }

    // Get Types
    const channel = await framework.partial.channel(interaction.channel) as GuildBasedChannel;
    const invoker = await framework.partial.guildMember(interaction.member as GuildMember);
    const bot = await framework.partial.guildMember(interaction.guild!.members.me as GuildMember);
    if (channel === null || invoker === null || bot === null) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Failed to Resolve Interaction Objects.',
            new Deno.errors.NotFound('Failed to resolve one of channel, invoker, or bot.'),
          ),
        ],
      });
      return;
    }

    // Check Channel Types
    if (!options.channelTypesRequired.includes(channel.type as GuildChannelType)) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.internal(
            framework,
            'Invalid Channel Type for Interaction.',
            new Deno.errors.InvalidData(`Channel type ${channel.type} is not allowed for this interaction.`),
          ),
        ],
      });
      return;
    }

    // Check Permissions
    if (!invoker.permissions.has(options.guild.userRequiredGuildPermissions)) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.permission(
            options.guild.userRequiredGuildPermissions,
            'You',
            false,
          ),
        ],
      });
      return;
    }

    if (!invoker.permissionsIn(channel).has(options.guild.userRequiredChannelPermissions)) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.permission(
            options.guild.userRequiredChannelPermissions,
            'You',
            true,
          ),
        ],
      });
      return;
    }

    if (!bot.permissions.has(options.guild.botRequiredGuildPermissions)) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.permission(
            options.guild.botRequiredGuildPermissions,
            'I',
            false,
          ),
        ],
      });
      return;
    }

    if (!bot.permissionsIn(channel).has(options.guild.botRequiredChannelPermissions)) {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          ResponseBuilder.permission(
            options.guild.botRequiredChannelPermissions,
            'I',
            true,
          ),
        ],
      });
      return;
    }

    await handler.callback({
      framework,
      interaction,
      guild: interaction.guild!,
      channel,
      invoker,
      bot,
      // deno-lint-ignore no-explicit-any -- Dynamically Typed at Client Compile-time
      args: parse(interaction) as any,
    });
  });
}
