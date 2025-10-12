import { DiscordJS, Ledger } from './deps.ts';
import { Partial } from './lib/partial.ts';
/**
 * Main entry point for the DiscordFramework, providing configuration, logging, and Discord.js client integration.
 *
 * This class manages the Discord.js client lifecycle, logging via Ledger, and exposes helpers for resolving partial structures.
 *
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Client}
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Partial}
 * @see {@link https://jsr.io/@ledger/console-handler}
 *
 * @example
 * ```ts
 * const framework = new DiscordFramework({ tenantId: 'my-tenant', token: 'my-token' });
 * await framework.start();
 * ```
 *
 * @category Core
 */
export class DiscordFramework {
  /**
   * The Ledger instance for logging and diagnostics.
   */
  public ledger: Ledger;

  /**
   * The options used to configure the framework instance.
   */
  public options: FrameworkOptions;

  /**
   * The Discord.js client instance managed by the framework.
   */
  public djs: DiscordJS.Client;

  /**
   * Helper for resolving Discord.js partial structures.
   * @see {@link Partial}
   */
  public partial: Partial = new Partial(this);

  /**
   * Creates a new DiscordFramework instance.
   *
   * @param options Configuration options for the framework.
   */
  public constructor(options: FrameworkOptions) {
    this.options = options;
    this.ledger = new Ledger({
      service: this.options.tenantId,
      useAsyncDispatchQueue: true,
    });
    this.ledger.register({
      definition: 'jsr:@ledger/console-handler@0.0.4',
    });
    this.djs = new DiscordJS.Client({
      intents: [
        DiscordJS.GatewayIntentBits.Guilds |
        DiscordJS.GatewayIntentBits.GuildModeration |
        DiscordJS.GatewayIntentBits.AutoModerationExecution |
        DiscordJS.GatewayIntentBits.GuildMembers |
        DiscordJS.GatewayIntentBits.GuildIntegrations |
        DiscordJS.GatewayIntentBits.GuildWebhooks |
        DiscordJS.GatewayIntentBits.GuildMessages |
        DiscordJS.GatewayIntentBits.DirectMessages |
        DiscordJS.GatewayIntentBits.GuildMessageReactions |
        DiscordJS.GatewayIntentBits.DirectMessageReactions,
      ],
      partials: [
        DiscordJS.Partials.User,
        DiscordJS.Partials.GuildMember,
        DiscordJS.Partials.Channel,
        DiscordJS.Partials.Message,
        DiscordJS.Partials.Reaction,
      ],
    });
  }

  /**
   * Starts the Discord.js client and logs in using the provided token.
   *
   * @returns Promise that resolves when the client is ready and logged in.
   */
  public async start(): Promise<void> {
    // Await the Logger to come online.
    await this.ledger.alive();

    // Print Client Connection
    this.djs.once(DiscordJS.Events.ClientReady, (client) => {
      this.ledger.information(`[${client.user.id}] '${client.user.tag}' is connected to Discord.`);
    });

    // Start Discord Login
    await this.djs.login(this.options.token);
  }
}

/**
 * Options for configuring the DiscordFramework instance.
 */
export interface FrameworkOptions {
  tenantId: string;
  token: string;
}
