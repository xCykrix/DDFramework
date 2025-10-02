import { DDCacheProxy, Discordeno } from '../../deps.ts';
import type { DDFrameworkDesiredProperties } from '../desired.ts';

export type BotWithCacheProxy<T extends DDFrameworkDesiredProperties> = DDCacheProxy.BotWithProxyCache<
  DDCacheProxy.ProxyCacheTypes<T, Discordeno.DesiredPropertiesBehavior.RemoveKey>,
  T,
  Discordeno.DesiredPropertiesBehavior.RemoveKey,
  Discordeno.Bot<T, Discordeno.DesiredPropertiesBehavior.RemoveKey>,
  DDCacheProxy.CreateProxyCacheOptions<
    DDCacheProxy.ProxyCacheTypes<T, Discordeno.DesiredPropertiesBehavior.RemoveKey>,
    T,
    Discordeno.DesiredPropertiesBehavior.RemoveKey
  >
>;

export class ClientGenerator<T extends DDFrameworkDesiredProperties> {
  private make(
    bot: Discordeno.Bot<T, Discordeno.DesiredPropertiesBehavior.RemoveKey>,
  ): BotWithCacheProxy<T> {
    return DDCacheProxy.createProxyCache<
      T,
      Discordeno.DesiredPropertiesBehavior.RemoveKey,
      Discordeno.Bot<T, Discordeno.DesiredPropertiesBehavior.RemoveKey>
    >(bot, {
      cacheInMemory: {
        user: true,
        guild: true,
        role: true,
        channel: true,
        member: true,
        default: true,
      },
      cacheOutsideMemory: {
        default: false,
      },
    });
  }

  public create(token: string, desiredProperties: T): ReturnType<typeof this.make> {
    return this.make(
      Discordeno.createBot<T, Discordeno.DesiredPropertiesBehavior.RemoveKey>({
        token,
        intents: Discordeno.GatewayIntents.Guilds |
          Discordeno.GatewayIntents.GuildModeration |
          Discordeno.GatewayIntents.GuildMembers |
          Discordeno.GatewayIntents.GuildIntegrations |
          Discordeno.GatewayIntents.GuildWebhooks |
          Discordeno.GatewayIntents.GuildMessages |
          Discordeno.GatewayIntents.GuildMessageReactions |
          Discordeno.GatewayIntents.MessageContent,
        desiredPropertiesBehavior: Discordeno.DesiredPropertiesBehavior.RemoveKey,
        desiredProperties,
      }),
    );
  }
}
