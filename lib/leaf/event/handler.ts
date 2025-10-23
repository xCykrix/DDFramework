import type { DiscordFramework } from '@amethyst/ddframework';
import { type GuildBasedChannel, type GuildChannelType, type GuildMember } from 'discord.js';
import { getFirstPathOfApplicationCommand } from '../../util/command.helper.ts';
import { ResponseBuilder } from '../../util/response/response.ts';
import { parse } from '../parse.ts';

export function injectCommandHandler(framework: DiscordFramework): void {
  framework.djs.on('interactionCreate', async (interaction) => {
    // Verify Interaction is Processable by Handler.
    if (!interaction.isChatInputCommand()) return;
    if (interaction.guildId === null) return;
    if (interaction.channel?.isDMBased()) return;
    if (!interaction.channel?.isSendable()) return;

    // Extract Path
    const path = getFirstPathOfApplicationCommand(interaction);
    if (path === null) return;
    if (interaction.commandName !== path?.split('.')[0]) return;

    // Get Linked Options.
    const options = framework.leaf.linkedOptions.get(path);
    if (options === undefined) {
      await ResponseBuilder.handle(
        interaction,
        ResponseBuilder.internal(
          framework,
          'Missing Linked Options for Interaction.',
          new Deno.errors.NotFound(`Missing Linked Options for Interaction (${path})`),
        ),
      );
      return;
    }

    // Get Linked Handler.
    const linkedHandler = framework.leaf.linkedDynamics.get(path);
    if (linkedHandler === undefined) {
      await ResponseBuilder.handle(
        interaction,
        ResponseBuilder.internal(
          framework,
          'Missing Linked Handler for Interaction.',
          new Deno.errors.NotFound(`Missing Linked Handler for Interaction (${path})`),
        ),
      );
      return;
    }

    // Build Passthrough Variables.
    const channel = await framework.partial.channel(interaction.channel) as GuildBasedChannel;
    const invoker = await framework.partial.guildMember(interaction.member as GuildMember);
    const bot = await framework.partial.guildMember(interaction.guild!.members.me as GuildMember);
    if (channel === null || invoker === null || bot === null) {
      await ResponseBuilder.handle(
        interaction,
        ResponseBuilder.internal(
          framework,
          'Failed to Resolve Interaction Objects.',
          new Deno.errors.NotFound('Failed to resolve one of channel, invoker, or bot.'),
        ),
      );
      return;
    }

    // Check Channel Types.
    if (!options.channelTypesRequired.includes(channel.type as GuildChannelType)) {
      await ResponseBuilder.handle(
        interaction,
        ResponseBuilder.internal(
          framework,
          'Invalid Channel Type for Interaction.',
          new Deno.errors.InvalidData(`Channel type ${channel.type} is not allowed for this interaction.`),
        ),
      );
      return;
    }

    // Check Permissions.
    if (!invoker.permissions.has(options.guild.userRequiredGuildPermissions)) {
      await ResponseBuilder.handle(
        interaction,
        ResponseBuilder.permission(
          options.guild.userRequiredGuildPermissions,
          'You',
          false,
        ),
      );
      return;
    }

    if (!invoker.permissionsIn(channel).has(options.guild.userRequiredChannelPermissions)) {
      await ResponseBuilder.handle(
        interaction,
        ResponseBuilder.permission(
          options.guild.userRequiredChannelPermissions,
          'You',
          true,
        ),
      );
      return;
    }

    if (!bot.permissions.has(options.guild.botRequiredGuildPermissions)) {
      await ResponseBuilder.handle(
        interaction,
        ResponseBuilder.permission(
          options.guild.botRequiredGuildPermissions,
          'I',
          false,
        ),
      );
      return;
    }

    if (!bot.permissionsIn(channel).has(options.guild.botRequiredChannelPermissions)) {
      await ResponseBuilder.handle(
        interaction,
        ResponseBuilder.permission(
          options.guild.botRequiredChannelPermissions,
          'I',
          true,
        ),
      );
      return;
    }

    // Execute Callback.
    await linkedHandler.callback({
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
