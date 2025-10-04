import { DDCacheProxy, Discordeno } from '../../deps.ts';
import type { DDFrameworkDesiredProperties } from '../desired.ts';

/**
 * A bot instance with integrated caching capabilities.
 */
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

/**
 * Client Generator for creating bot instances with caching.
 */
export class ClientGenerator<T extends DDFrameworkDesiredProperties> {
  /**
   * Create a bot instance with caching capabilities.
   */
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

  /**
   * Create and return a bot instance with the specified token and desired properties.
   *
   * @param token The bot token.
   * @param desiredProperties The desired properties for the bot instance.
   * @returns A bot instance with caching capabilities.
   */
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
