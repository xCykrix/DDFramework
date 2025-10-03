import { createDDFrameworkProperties } from './lib/desired.ts';
import { DDFramework } from './mod.ts';

const ddfw = DDFramework.create(
  {
    applicationId: Deno.env.get('APPLICATION_ID') ?? '',
    publicKey: Deno.env.get('PUBLIC_KEY') ?? '',
    clientId: Deno.env.get('CLIENT_ID_OAUTH2') ?? '',
    clientSecret: Deno.env.get('CLIENT_SECRET_OAUTH2') ?? '',
    token: Deno.env.get('BOT_TOKEN') ?? '',
    errorHandler: (error) => {
      console.error('[DDFramework] Captured Internal Error\n', error);
    },
  },
  createDDFrameworkProperties({}),
);

await ddfw.start();
