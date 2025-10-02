import { Discordeno } from '../deps.ts';
import { DDFramework } from '../mod.ts';

export const FWClient = DDFramework.create(
  {
    applicationId: 'your-application-id',
    publicKey: 'your-public-key',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    token: 'your-bot-token',

    errorHandler: (error) => {
      console.error('[DDFramework] Internal Error\n', error);
    },
  },
  Discordeno.createDesiredPropertiesObject({
    guild: {
      id: true,
      roles: true,
      name: true,
    },
  }),
);
