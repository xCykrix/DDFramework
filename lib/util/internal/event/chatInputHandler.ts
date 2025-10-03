import type { DDFramework } from '../../../../mod.ts';
import type { DDFrameworkDesiredProperties } from '../../../desired.ts';
import type { DDFrameworkOptions } from '../../../options.ts';

export function injectChatInputHandler(framework: DDFramework<DDFrameworkDesiredProperties>, options: DDFrameworkOptions): void {
  framework.events.add('messageCreate', async (message) => {
    console.info('proc message test');
  });
}
