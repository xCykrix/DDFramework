import { Discordeno } from '../../../deps.ts';
import type { DDFramework } from '../../../mod.ts';
import type { BotWithCacheProxy } from '../../client.ts';
import { desiredPropertiesMinimal, Overwrite } from '../../desired.ts';

/**
 * Set of Discord channel types that are considered threads.
 * Used for thread-specific permission calculations, e.g. SEND_MESSAGES_IN_THREADS.
 *
 * @internal
 */
const THREAD_CHANNEL_TYPES = new Set([
  Discordeno.ChannelTypes.AnnouncementThread,
  Discordeno.ChannelTypes.PrivateThread,
  Discordeno.ChannelTypes.PublicThread,
]);

/**
 * Tuple type returned by Discordeno.separateOverwrites.
 * Used for permission overwrite calculations in channel context.
 *
 * @internal
 */
type OverwriteTuple = ReturnType<typeof Discordeno.separateOverwrites>;

/**
 * Context object for channel permission calculations.
 * Contains overwrites, guild ID, and thread status.
 * Used internally for resolving permission overwrites in channels and threads.
 *
 * @internal
 */
interface ChannelPermissionContext {
  overwrites: OverwriteTuple[];
  guildId: bigint;
  isThread: boolean;
}

/**
 * Permissions utility class for calculating and validating Discord permissions in DDFramework.
 *
 * @typeParam T - The desired properties type for the bot instance.
 */
export class Permissions<T extends Overwrite<T, typeof desiredPropertiesMinimal>> {
  private framework!: DDFramework<T>;

  /**
   * Create an instance of Permissions utility.
   *
   * @param framework - The DDFramework instance to use for permission calculations.
   */
  public constructor(framework: DDFramework<T>) {
    // Cast to general DDFramework type to access internal structures
    this.framework = framework;
  }

  /**
   * Calculates the base permissions for a member in a guild.
   *
   * @param guild - The guild.
   * @param member - The member.
   * @returns The base permissions as a bigint bitfield.
   */
  public calculateBasePermissions(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
  ): bigint {
    if (!guild || !member) return 0n;

    const memberRoles = member.roles ?? [];
    let permissions = guild.roles?.get(guild.id)?.permissions?.bitfield ?? 0n;

    for (const roleId of memberRoles) {
      permissions |= guild.roles?.get(roleId)?.permissions?.bitfield ?? 0n;
    }

    if (guild.ownerId === member.id) {
      permissions |= BigInt(Discordeno.BitwisePermissionFlags.ADMINISTRATOR);
    }
    return permissions;
  }

  /**
   * Calculates the channel overwrites for a member in a channel.
   *
   * @param guild - The guild.
   * @param channelId - The channel ID.
   * @param member - The member.
   * @returns The channel overwrites as a bigint bitfield.
   */
  public calculateCachedChannelOverwrites(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    channelId: bigint,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
  ): bigint {
    const context = this.resolveChannelContext(guild, channelId);
    if (!context) return 0n;

    const basePermissions = this.calculateBasePermissions(guild, member);
    return this.applyChannelOverwrites(basePermissions, context, member.roles ?? [], member.id);
  }

  /**
   * Calculates the channel overwrites for a role in a channel.
   *
   * @param guild - The guild.
   * @param channelId - The channel ID.
   * @param roleId - The role ID.
   * @returns The channel overwrites for the role as a bigint bitfield.
   */
  public calculateCachedChannelOverwritesForRole(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    channelId: bigint,
    roleId: bigint,
  ): bigint {
    const role = guild.roles?.get(roleId);
    if (!role) return 0n;
    const context = this.resolveChannelContext(guild, channelId);
    if (!context) return 0n;

    return this.applyChannelOverwrites(role.permissions.bitfield, context, [roleId], roleId);
  }

  /**
   * Gets the missing permissions from a set of permission bits.
   *
   * @param permissionBits - The permission bits as a bigint bitfield.
   * @param permissions - The permissions to check.
   * @returns An array of missing permission strings.
   */
  public getMissingPerms(permissionBits: bigint, permissions: Discordeno.PermissionStrings[]): string[] {
    return this.missingPermissions(permissionBits, permissions);
  }

  /**
   * Validates if the given permission bits match the given permissions.
   *
   * @param permissionBits - The permission bits as a bigint bitfield.
   * @param permissions - The permissions to validate.
   * @returns True if the permissions are valid, false otherwise.
   */
  public validatePermissions(permissionBits: bigint, permissions: Discordeno.PermissionStrings[]): boolean {
    return this.missingPermissions(permissionBits, permissions).length === 0;
  }

  /**
   * Checks if a member has the specified permissions in a guild.
   *
   * @param guild - The guild.
   * @param member - The member.
   * @param permissions - The permissions to check.
   * @returns True if the member has the permissions, false otherwise.
   */
  public hasGuildPermissions(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
    permissions: Discordeno.PermissionStrings[],
  ): boolean {
    const basePermissions = this.calculateBasePermissions(guild, member);
    return this.validatePermissions(basePermissions, permissions);
  }

  /**
   * Checks if a member has the specified permissions in a channel.
   *
   * @param guild - The guild.
   * @param channelId - The channel ID.
   * @param member - The member.
   * @param permissions - The permissions to check.
   * @returns True if the member has the permissions, false otherwise.
   */
  public hasChannelPermissions(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    channelId: bigint,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
    permissions: Discordeno.PermissionStrings[],
  ): boolean {
    const channelOverwrites = this.calculateCachedChannelOverwrites(guild, channelId, member);
    return this.validatePermissions(channelOverwrites, permissions);
  }

  /**
   * Gets the missing permissions from a member in a guild.
   *
   * @param guild - The guild.
   * @param member - The member.
   * @param permissions - The permissions to check.
   * @returns An array of missing permission strings.
   */
  public getMissingGuildPermissions<T extends Discordeno.PermissionStrings>(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
    permissions: T[],
  ): T[] {
    const permissionBits = this.calculateBasePermissions(guild, member);
    return this.missingPermissions<T>(permissionBits, permissions);
  }

  /**
   * Gets the missing permissions from a member in a channel.
   *
   * @param guild - The guild.
   * @param channelId - The channel ID.
   * @param member - The member.
   * @param permissions - The permissions to check.
   * @returns An array of missing permission strings.
   */
  public getMissingChannelPermissions<T extends Discordeno.PermissionStrings>(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    channelId: bigint,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
    permissions: T[],
  ): T[] {
    const permissionBits = this.calculateCachedChannelOverwrites(guild, channelId, member);
    return this.missingPermissions<T>(permissionBits, permissions);
  }

  /**
   * Returns the permissions that are not present in the given permissionBits.
   *
   * @param permissionBits - The permission bits as a bigint bitfield.
   * @param permissions - The permissions to check.
   * @returns An array of missing permission strings.
   */
  public missingPermissions<T extends Discordeno.PermissionStrings>(permissionBits: bigint, permissions: T[]): T[] {
    const adminFlag = BigInt(Discordeno.BitwisePermissionFlags.ADMINISTRATOR);
    if (permissionBits & adminFlag) return [];

    return permissions.filter((permission) => !(permissionBits & BigInt(Discordeno.BitwisePermissionFlags[permission])));
  }

  /**
   * Converts a bitwise permission bits value to an array of permission strings.
   *
   * @param permissionBits - The permission bits as a bigint bitfield.
   * @returns An array of permission strings.
   */
  public calculatePermissions(permissionBits: bigint): string[] {
    const permissions: string[] = [];
    for (const [permission, flag] of Object.entries(Discordeno.BitwisePermissionFlags)) {
      if (typeof flag === 'number' && (permissionBits & BigInt(flag))) {
        permissions.push(permission);
      }
    }
    return permissions;
  }

  /**
   * Converts an array of permission strings to a bitwise string.
   *
   * @param permissions - The array of permission strings.
   * @returns The bitwise string representation.
   */
  public calculateBits(permissions: Discordeno.PermissionStrings[]): string {
    return permissions.reduce((bits, perm) => bits | BigInt(Discordeno.BitwisePermissionFlags[perm] ?? 0), 0n).toString();
  }

  /**
   * Gets the highest role of a member in a guild.
   *
   * @param guild - The guild.
   * @param member - The member.
   * @returns The highest role or undefined if the member has no roles.
   */
  public highestRole(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
  ): typeof this.framework.internal.cache.$inferredTypes.role | typeof this.framework.internal.transformers.$inferredTypes.role | undefined {
    const memberRoles = member.roles;
    if (!memberRoles?.length) {
      return guild.roles?.get(guild.id);
    }

    let highestRole: { id: bigint; position: number } | undefined;
    for (const roleId of memberRoles) {
      const role = guild.roles?.get(roleId);
      if (!role) continue;

      if (highestRole === undefined || role.position > highestRole.position || (role.position === highestRole.position && role.id < highestRole.id)) {
        highestRole = role;
      }
    }
    return highestRole as unknown as BotWithCacheProxy<DDFrameworkDesiredProperties>['cache']['$inferredTypes']['role'] | BotWithCacheProxy<DDFrameworkDesiredProperties>['transformers']['$inferredTypes']['role'] | undefined;
  }

  /**
   * Checks if the first role has a higher position than the second role.
   *
   * @param guild - The guild.
   * @param roleId - The ID of the first role.
   * @param otherRoleId - The ID of the second role.
   * @returns True if the first role is higher, false otherwise.
   */
  public higherRolePosition(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    roleId: bigint,
    otherRoleId: bigint,
  ): boolean {
    const role = guild.roles?.get(roleId);
    const otherRole = guild.roles?.get(otherRoleId);

    if (!role || !otherRole) return false;

    return role.position > otherRole.position || (role.position === otherRole.position && role.id < otherRole.id);
  }

  /**
   * Checks if a member has a higher role position than the given role ID.
   *
   * @param guild - The guild.
   * @param member - The member.
   * @param compareRoleId - The role ID to compare with.
   * @returns True if the member has a higher role position, false otherwise.
   */
  public isHigherPosition(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
    compareRoleId: bigint,
  ): boolean {
    if (guild.ownerId === member.id) return true;
    const memberHighestRole = this.highestRole(guild, member);
    return this.higherRolePosition(guild, memberHighestRole?.id ?? 0n, compareRoleId);
  }

  /**
   * Resolves the permission context for a channel, including overwrites and thread status.
   * Used internally for permission calculations in channels and threads.
   *
   * @param guild - The guild.
   * @param channelId - The channel ID.
   * @returns ChannelPermissionContext or undefined if channel not found.
   * @internal
   */
  private resolveChannelContext(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    channelId: bigint,
  ): ChannelPermissionContext | undefined {
    const channel = guild.channels?.get(channelId);
    if (!channel) return undefined;

    const isThread = THREAD_CHANNEL_TYPES.has(channel.type);
    const parentChannel = isThread ? guild.channels?.get(channel.parentId!) : channel;
    if (!parentChannel) return undefined;

    const overwrites = parentChannel.internalOverwrites?.map((overwrite) => Discordeno.separateOverwrites(overwrite)) ?? [];
    const guildId = parentChannel.guildId ?? guild.id;

    return { overwrites, guildId, isThread };
  }

  /**
   * Applies channel overwrites to a permission bitfield for a member or role.
   * Used internally for merging permission overwrites from everyone, roles, and target.
   *
   * @param permissionBits - The starting permission bits.
   * @param context - The channel permission context.
   * @param roleIds - The role IDs to consider for overwrites.
   * @param targetId - The target ID (member or role).
   * @returns The updated permission bits after applying overwrites.
   * @internal
   */
  private applyChannelOverwrites(
    permissionBits: bigint,
    context: ChannelPermissionContext,
    roleIds: readonly bigint[] | undefined,
    targetId: bigint,
  ): bigint {
    const { overwrites, guildId, isThread } = context;

    const everyoneOverwrite = overwrites.find(([, id]) => id === guildId);
    if (everyoneOverwrite) {
      const [, , allowBits, denyBits] = everyoneOverwrite;
      permissionBits = (permissionBits & ~denyBits) | allowBits;
    }

    if (roleIds && roleIds.length) {
      const roleSet = new Set(roleIds);
      let allow = 0n;
      let deny = 0n;
      for (const [, id, allowBits, denyBits] of overwrites) {
        if (roleSet.has(id)) {
          deny |= denyBits;
          allow |= allowBits;
        }
      }
      permissionBits = (permissionBits & ~deny) | allow;
    }

    const targetOverwrite = overwrites.find(([, id]) => id === targetId);
    if (targetOverwrite) {
      const [, , allowBits, denyBits] = targetOverwrite;
      permissionBits = (permissionBits & ~denyBits) | allowBits;
    }

    if (isThread && (permissionBits & BigInt(Discordeno.BitwisePermissionFlags.SEND_MESSAGES_IN_THREADS))) {
      permissionBits |= BigInt(Discordeno.BitwisePermissionFlags.SEND_MESSAGES);
    }

    return permissionBits;
  }
}
