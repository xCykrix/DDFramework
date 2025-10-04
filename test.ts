import { Discordeno } from './deps.ts';
import { createDDFrameworkProperties } from './lib/desired.ts';
import { DDFramework } from './mod.ts';

const framework = DDFramework.create(
  {
    applicationId: Deno.env.get('APPLICATION_ID') ?? '',
    publicKey: Deno.env.get('PUBLIC_KEY') ?? '',
    clientId: Deno.env.get('CLIENT_ID_OAUTH2') ?? '',
    clientSecret: Deno.env.get('CLIENT_SECRET_OAUTH2') ?? '',
    token: Deno.env.get('BOT_TOKEN') ?? '',
    developers: [],
    errorHandler: (error) => {
      console.error('[DDFramework] Captured Internal Error\n', error);
    },
  },
  createDDFrameworkProperties({}),
);

framework.leaf.linkLeaf({
  schema: {
    name: 'ping',
    description: 'Ping Command!',
    type: Discordeno.ApplicationCommandTypes.ChatInput,
    options: [
      {
        name: 'check',
        description: 'Check the bot latency',
        type: Discordeno.ApplicationCommandOptionTypes.SubCommand,
      },
    ],
  },
  options: {
    guild: {
      required: true,
      botRequiredGuildPermissions: [],
      userRequiredGuildPermissions: [],
      botRequiredChannelPermissions: [],
      userRequiredChannelPermissions: [],
    },
    developerRequired: true,
    channelTypesRequired: [Discordeno.ChannelTypes.GuildText],
    components: {
      acceptedBaseCustomIds: [''],
      requireStatePacket: true,
      restrictToAuthor: true,
    },
  },
  handler: {
    callback: async ({ interaction }) => {
      await interaction.respond({ content: 'Pong!' }, {
        isPrivate: true,
      });
    },
  },
});

await framework.start();
