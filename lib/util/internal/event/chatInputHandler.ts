import { Discordeno } from '../../../../deps.ts';
import type { DDFramework } from '../../../../mod.ts';
import type { DDFrameworkDesiredProperties } from '../../../desired.ts';
import type { ChatInputCommandJSON, DynamicInjectedHandler, HandlerOptions } from '../../../manager/leaf.types.ts';
import type { DDFrameworkOptions } from '../../../options.ts';
import { QuickResponse } from '../../message/quickResponse.ts';
import { getFirstPathOfApplicationCommand } from '../../object/getFirstPathOfApplicationCommand.ts';

type LinkedDefinition = {
  options: HandlerOptions;
  handler: DynamicInjectedHandler<ChatInputCommandJSON>;
};

type CacheTypes = DDFramework<DDFrameworkDesiredProperties>['internal']['cache']['$inferredTypes'];

type GuildContext = {
  guild: CacheTypes['guild'];
  member: CacheTypes['member'];
  channel: CacheTypes['channel'];
  botMember: CacheTypes['member'];
};

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

    const linked = await resolveLinkedDefinition(framework, fwoptions, interaction, path);
    if (!linked) return;

    const { options, handler } = linked;
    const requireGuild = options.guild?.required ?? false;

    if (!(await validateChannelRequirements(interaction, options, fwoptions))) return;

    // Enforce Guild Requirement
    if (requireGuild && interaction.guildId === undefined) {
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

    const guildContext = requireGuild ? await resolveGuildContext(framework, interaction, fwoptions) : undefined;

    if (requireGuild && !guildContext) return;

    const guildOptions = options.guild;

    // Enforce Permissions [guild?.required === true]
    if (requireGuild && guildContext && guildOptions?.required) {
      const { guild, member, channel, botMember } = guildContext;

      if (
        guildOptions.userRequiredGuildPermissions.length > 0 &&
        !framework.helpers.permissions.hasGuildPermissions(guild, member, guildOptions.userRequiredGuildPermissions)
      ) {
        await interaction.respond(
          QuickResponse.PERMISSIONS_CHECK_FAILED(
            fwoptions,
            'User',
            guildOptions.userRequiredGuildPermissions,
          ),
        );
        return;
      }

      if (
        guildOptions.userRequiredChannelPermissions.length > 0 &&
        !framework.helpers.permissions.hasChannelPermissions(guild, channel.id, member, guildOptions.userRequiredChannelPermissions)
      ) {
        await interaction.respond(
          QuickResponse.PERMISSIONS_CHECK_FAILED(
            fwoptions,
            'User',
            guildOptions.userRequiredChannelPermissions,
          ),
        );
        return;
      }

      if (
        guildOptions.botRequiredGuildPermissions.length > 0 &&
        !framework.helpers.permissions.hasGuildPermissions(guild, botMember, guildOptions.botRequiredGuildPermissions)
      ) {
        await interaction.respond(
          QuickResponse.PERMISSIONS_CHECK_FAILED(
            fwoptions,
            'Bot',
            guildOptions.botRequiredGuildPermissions,
          ),
        );
        return;
      }

      if (
        guildOptions.botRequiredChannelPermissions.length > 0 &&
        !framework.helpers.permissions.hasChannelPermissions(guild, channel.id, botMember, guildOptions.botRequiredChannelPermissions)
      ) {
        await interaction.respond(
          QuickResponse.PERMISSIONS_CHECK_FAILED(
            fwoptions,
            'Bot',
            guildOptions.botRequiredChannelPermissions,
          ),
        );
        return;
      }
    }

    await handler.callback({
      framework,
      interaction,
      guild: guildContext?.guild,
      member: guildContext?.member,
      botMember: guildContext?.botMember,
      // deno-lint-ignore no-explicit-any -- Dynamic typing based on extracted types at runtime.
      args: Discordeno.commandOptionsParser(interaction) as any,
    });
  });
}

async function resolveLinkedDefinition(
  framework: DDFramework<DDFrameworkDesiredProperties>,
  options: DDFrameworkOptions,
  interaction: DDFramework<DDFrameworkDesiredProperties>['internal']['transformers']['$inferredTypes']['interaction'],
  path: string,
): Promise<LinkedDefinition | undefined> {
  const linkedOptions = framework.leaf.linkedOptions.get(path);
  if (!linkedOptions) {
    options.errorHandler(
      new Deno.errors.InvalidData(`[DDFramework:InternalError] No linked options found for path: ${path}`),
    );
    await interaction.respond(QuickResponse.INTERNAL_REJECT(
      options,
      'This action is not correctly configured. Please report this issue to the bot developer. (LINKED_OPTIONS_MISSING)',
    ));
    return undefined;
  }

  const handler = framework.leaf.linkedDynamics.get(path);
  if (!handler) {
    options.errorHandler(
      new Deno.errors.InvalidData(`[DDFramework:InternalError] No linked handler found for path: ${path}`),
    );
    await interaction.respond(QuickResponse.INTERNAL_REJECT(
      options,
      'This action is not correctly configured. Please report this issue to the bot developer. (LINKED_HANDLER_MISSING)',
    ));
    return undefined;
  }

  return { options: linkedOptions, handler };
}

async function validateChannelRequirements(
  interaction: DDFramework<DDFrameworkDesiredProperties>['internal']['transformers']['$inferredTypes']['interaction'],
  options: HandlerOptions,
  fwoptions: DDFrameworkOptions,
): Promise<boolean> {
  const requiredTypes = options.channelTypesRequired;
  if (requiredTypes.length === 0) {
    await interaction.respond(QuickResponse.INTERNAL_REJECT(
      fwoptions,
      'This action is not correctly configured to access channel types. Please report this issue to the bot developer.',
    ));
    return false;
  }

  const channelType = interaction.channel?.type;
  if (channelType === undefined || !(requiredTypes as Discordeno.ChannelTypes[]).includes(channelType)) {
    const channelName = Object.entries(Discordeno.ChannelTypes).find(([, value]) => value === channelType)?.[0] ?? 'Unknown';
    await interaction.respond(QuickResponse.INTERNAL_REJECT(
      fwoptions,
      `This action is not configured to access '${channelName}' types. Please report this issue to the bot developer if you believe this is an error.`,
    ));
    return false;
  }

  return true;
}

async function resolveGuildContext(
  framework: DDFramework<DDFrameworkDesiredProperties>,
  interaction: DDFramework<DDFrameworkDesiredProperties>['internal']['transformers']['$inferredTypes']['interaction'],
  fwoptions: DDFrameworkOptions,
): Promise<GuildContext | undefined> {
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;

  if (!guildId || !channelId) {
    await interaction.respond(QuickResponse.INTERNAL_REJECT(
      fwoptions,
      'This action was not able to access the required guild data. Please report this issue to the bot developer if this issue persists. (GUILD_DATA_MISSING/MULTI_CACHE_MISS)',
    ));
    return undefined;
  }

  const [guild, member, channel] = await Promise.all([
    framework.internal.cache.guilds.get(guildId),
    framework.internal.cache.members.get(interaction.user.id, guildId),
    framework.internal.cache.channels.get(channelId),
  ]);

  if (!guild || !member || !channel) {
    fwoptions.errorHandler(
      new Deno.errors.InvalidData(`[DDFramework:InternalError] Cache data for interaction '${interaction.id}' was missing. GID:${guildId}/CA${guild?.id}, UID:${interaction.user.id}/CA${member?.id}, CID:${channelId}/CA${channel?.id}`),
    );
    await interaction.respond(QuickResponse.INTERNAL_REJECT(
      fwoptions,
      'This action was not able to access the required guild data. Please report this issue to the bot developer if this issue persists. (GUILD_DATA_MISSING/MULTI_CACHE_MISS)',
    ));
    return undefined;
  }

  let botMember = await framework.internal.cache.members.get(framework.internal.id, guildId);
  if (!botMember) {
    await framework.internal.helpers.getMember(guildId, framework.internal.id);
    botMember = await framework.internal.cache.members.get(framework.internal.id, guildId);
  }

  if (!botMember) {
    fwoptions.errorHandler(
      new Deno.errors.InvalidData(`[DDFramework:InternalError] Bot cache data for interaction '${interaction.id}' was missing. GID:${guildId}/CA${guild.id}, UID:${framework.internal.id}/CA${undefined}, CID:${channelId}/CA${channel.id}`),
    );
    await interaction.respond(QuickResponse.INTERNAL_REJECT(
      fwoptions,
      'This action was not able to access the required guild data. Please report this issue to the bot developer if this issue persists. (GUILD_DATA_MISSING/BOT_MEMBER_CACHE_MISS)',
    ));
    return undefined;
  }

  return { guild, member, channel, botMember };
}
