import { Discordeno } from '../../deps.ts';
import { BotWithCacheProxy } from '../util/client.ts';

export class LeafManager<Z extends Discordeno.TransformersDesiredProperties, T extends BotWithCacheProxy<Z>> {
  private bot: T;

  public constructor(bot: T) {
    this.bot = bot;
  }

  public add(): void {
  }
}
