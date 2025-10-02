/**
 * An instance of the DDFramework client.
 */

import { FWClient } from './client.ts';

async function mod(): Promise<void> {
  FWClient.events.add('ready', async () => {
    console.log('Bot is online!');
  });
  FWClient.start();
}
