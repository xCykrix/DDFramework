import type { DiscordFramework } from '@amethyst/ddframework';
import type { GuildBasedChannel, GuildChannelType, GuildMember } from 'discord.js';
import { getFirstPathOfApplicationCommand } from '../../util/internal/getFirstPathOfApplicationCommand.ts';
import { ResponseBuilder } from '../../util/response/response.ts';
import { intercept } from '../intercept.ts';
import { parse } from '../parse.ts';

/**
 * Injects a handler for Discord.js chat input command interactions into the framework.
 *
 * This function listens for 'interactionCreate' events, filters for chat input commands,
 * validates the interaction, checks permissions and channel types, retrieves the handler,
 * and invokes the command callback with all required context.
 *
 * All errors and invalid states are handled with internal responses and logged via the framework's ledger.
 *
 * @param framework - The DiscordFramework instance to inject the handler into.
 */
export function injectCommandHandler(framework: DiscordFramework): void {
  framework.djs.on(
    'interactionCreate',
    intercept('interactionCreate', framework, 'leaf/event/handler', async (interaction) => {
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
        await ResponseBuilder.make({
          header: 'Missing Linked Options',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: `Missing linked options for Interaction (${path})`,
          },
        });
        return;
      }

      // Get Linked Handler.
      const linkedHandler = framework.leaf.linkedDynamics.get(path);
      if (linkedHandler === undefined) {
        await ResponseBuilder.make({
          header: 'Missing Linked Handler',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: `Missing linked handler for Interaction (${path})`,
          },
        });
        return;
      }

      // Build Passthrough Variables.
      const channel = await framework.partial.channel(interaction.channel) as GuildBasedChannel;
      const invoker = await framework.partial.member(interaction.member as GuildMember);
      const bot = await framework.partial.member(interaction.guild!.members.me as GuildMember);
      if (channel === null || invoker === null || bot === null) {
        await ResponseBuilder.make({
          header: 'Failed to Resolve Interaction Objects',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: 'Failed to resolve one of channel, invoker, or bot.',
          },
        });
        return;
      }

      // Check Channel Types.
      if (!options.channelTypesRequired.includes(channel.type as GuildChannelType)) {
        await ResponseBuilder.make({
          header: 'Invalid Channel Type',
          description: 'Please re-issue the original request. Otherwise, report this as an issue if this continues to occur.',
          error: {
            framework,
            ulid: framework.util.ulid(),
            cause: `Channel type ${channel.type} is not allowed for this interaction.`,
          },
        });
        return;
      }

      // Check Permissions.
      if (!invoker.permissions.has(options.guild.userRequiredGuildPermissions)) {
        await ResponseBuilder.pcheck({
          framework,
          interaction,
          permissions: options.guild.userRequiredGuildPermissions,
          origin: 'You',
          channel: false,
        });
        return;
      }

      if (!invoker.permissionsIn(channel).has(options.guild.userRequiredChannelPermissions)) {
        await ResponseBuilder.pcheck({
          framework,
          interaction,
          permissions: options.guild.userRequiredChannelPermissions,
          origin: 'You',
          channel: true,
        });

        return;
      }

      if (!bot.permissions.has(options.guild.botRequiredGuildPermissions)) {
        await ResponseBuilder.pcheck({
          framework,
          interaction,
          permissions: options.guild.botRequiredGuildPermissions,
          origin: 'I',
          channel: false,
        });
        return;
      }

      if (!bot.permissionsIn(channel).has(options.guild.botRequiredChannelPermissions)) {
        await ResponseBuilder.pcheck({
          framework,
          interaction,
          permissions: options.guild.botRequiredChannelPermissions,
          origin: 'I',
          channel: true,
        });
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
    }),
  );
}
