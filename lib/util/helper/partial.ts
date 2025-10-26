import type { Channel, GuildMember, Message, MessageReaction, User } from 'discord.js';
import type { DiscordFramework } from '../../../mod.ts';
/**
 * Resolves Discord.js partial objects to their complete forms by fetching them if necessary.
 *
 * This utility is intended for use with Discord.js structures that may be partial (i.e., missing data until fetched).
 * All methods return `null` if the input is `null` or if fetching fails. If the object is not partial, it is returned as-is.
 *
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Partial}
 * @see {@link https://discord.js.org/#/docs/main/stable/class/User}
 * @see {@link https://discord.js.org/#/docs/main/stable/class/GuildMember}
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Channel}
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Message}
 * @see {@link https://discord.js.org/#/docs/main/stable/class/MessageReaction}
 *
 * @example
 * ```ts
 * const resolver = new Partial(framework);
 * const user = await resolver.user(someUser);
 * ```
 *
 * @category Utilities
 */
export class Partial {
  /**
   * The framework instance for logging and context.
   * @private
   */
  private framework: DiscordFramework;

  /**
   * Constructs a new Partial resolver.
   * @param framework - The DiscordFramework instance for logging warnings.
   */
  public constructor(framework: DiscordFramework) {
    this.framework = framework;
  }

  /**
   * Resolves a possibly-partial User to a full User object.
   * @param user The User or partial User instance.
   * @returns The full User, or null if not found or fetch fails.
   * @see {@link https://discord.js.org/#/docs/main/stable/class/User}
   */
  public async user(user: User | null): Promise<User | null> {
    if (user === null) return null;
    if (user.partial) {
      user = await user.fetch().catch((e) => {
        this.framework.ledger.warning(`Failed to fetch a partial user.`, {
          error: e,
          id: user!.id,
        });
        return null;
      });
    }
    return user;
  }

  /**
   * Resolves a possibly-partial GuildMember to a full GuildMember object.
   * @param member The GuildMember or partial GuildMember instance.
   * @returns The full GuildMember, or null if not found or fetch fails.
   * @see {@link https://discord.js.org/#/docs/main/stable/class/GuildMember}
   */
  public async member(member: GuildMember | null): Promise<GuildMember | null> {
    if (member === null) return null;
    if (member.partial) {
      member = await member.fetch().catch((e) => {
        this.framework.ledger.warning(`Failed to fetch a partial guild member.`, {
          error: e,
          id: member!.id,
        });
        return null;
      });
    }
    return member;
  }

  /**
   * Resolves a possibly-partial Channel to a full Channel object.
   * @param channel The Channel or partial Channel instance.
   * @returns The full Channel, or null if not found or fetch fails.
   * @see {@link https://discord.js.org/#/docs/main/stable/class/Channel}
   */
  public async channel(channel: Channel | null): Promise<Channel | null> {
    if (channel === null) return null;
    if (channel.partial) {
      channel = await channel.fetch().catch((e) => {
        this.framework.ledger.warning(`Failed to fetch a partial channel.`, {
          error: e,
          id: channel!.id,
        });
        return null;
      });
    }
    return channel;
  }

  /**
   * Resolves a possibly-partial Message to a full Message object.
   * @param message The Message or partial Message instance.
   * @returns The full Message, or null if not found or fetch fails.
   * @see {@link https://discord.js.org/#/docs/main/stable/class/Message}
   */
  public async message(message: Message | null): Promise<Message | null> {
    if (message === null) return null;
    if (message.partial) {
      message = await message.fetch().catch((e) => {
        this.framework.ledger.warning(`Failed to fetch a partial message.`, {
          error: e,
          id: message!.id,
        });
        return null;
      });
    }
    return message;
  }

  /**
   * Resolves a possibly-partial MessageReaction to a full MessageReaction object.
   * @param reaction The MessageReaction or partial MessageReaction instance.
   * @returns The full MessageReaction, or null if not found or fetch fails.
   * @see {@link https://discord.js.org/#/docs/main/stable/class/MessageReaction}
   */
  public async reaction(reaction: MessageReaction | null): Promise<MessageReaction | null> {
    if (reaction === null) return null;
    if (reaction.partial) {
      reaction = await reaction.fetch().catch((e) => {
        this.framework.ledger.warning(`Failed to fetch a partial reaction for message.`, {
          error: e,
        });
        return null;
      });
    }
    return reaction;
  }
}
