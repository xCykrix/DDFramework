import { Discordeno } from '../../../deps.ts';
import type { DDFramework, DDFrameworkInternal } from '../../../mod.ts';
import type { DDFrameworkDesiredProperties } from '../../desired.ts';
import type { BotWithCacheProxy } from '../client.ts';

export class Permissions<T extends DDFrameworkDesiredProperties> {
  private framework!: DDFramework<DDFrameworkDesiredProperties>;

  public constructor(framework: DDFramework<T>) {
    // Cast to general DDFramework type to access internal structures
    this.framework = framework as unknown as DDFrameworkInternal;
  }

  /**
   * Calculates the base permissions for a member in a guild.
   * @param guild The guild.
   * @param member The member.
   * @returns The base permissions.
   */
  public calculateBasePermissions(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
  ): bigint {
    if (!guild || !member) return 0n;

    let permissions = BigInt(
      [guild.id, ...member.roles]
        .map((id) => guild.roles?.get(id)?.permissions?.bitfield ?? 0n)
        .reduce((acc, perm) => acc | perm, 0n),
    );

    if (guild.ownerId === member.id) {
      permissions |= BigInt(Discordeno.BitwisePermissionFlags.ADMINISTRATOR);
    }
    return permissions;
  }

  /**
   * Calculates the channel overwrites for a member in a channel.
   * @param guild The guild.
   * @param channelId The channel ID.
   * @param member The member.
   * @returns The channel overwrites.
   */
  public calculateCachedChannelOverwrites(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    channelId: bigint,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
  ): bigint {
    const channel = guild.channels?.get(channelId);
    if (!channel) return 0n;

    const isThread = [Discordeno.ChannelTypes.AnnouncementThread, Discordeno.ChannelTypes.PrivateThread, Discordeno.ChannelTypes.PublicThread].includes(channel.type);
    const parentChannel = isThread ? guild.channels?.get(channel.parentId!) : channel;
    if (!parentChannel) return 0n;

    let permissions = this.calculateBasePermissions(guild, member);

    const overwrites = parentChannel.internalOverwrites ?? [];

    const everyoneOverwrite = overwrites.find((overwrite) => Discordeno.separateOverwrites(overwrite)[1] === parentChannel.guildId);
    if (everyoneOverwrite) {
      const [, , allow, deny] = Discordeno.separateOverwrites(everyoneOverwrite);
      permissions = (permissions & ~deny) | allow;
    }

    let allow = 0n;
    let deny = 0n;
    for (const overwrite of overwrites) {
      const [, id, allowBits, denyBits] = Discordeno.separateOverwrites(overwrite);
      if (member.roles?.includes(id)) {
        deny |= denyBits;
        allow |= allowBits;
      }
    }
    permissions = (permissions & ~deny) | allow;

    const memberOverwrite = overwrites.find((overwrite) => Discordeno.separateOverwrites(overwrite)[1] === member.id);
    if (memberOverwrite) {
      const [, , allowBits, denyBits] = Discordeno.separateOverwrites(memberOverwrite);
      permissions = (permissions & ~denyBits) | allowBits;
    }

    if (isThread && (permissions & BigInt(Discordeno.BitwisePermissionFlags.SEND_MESSAGES_IN_THREADS))) {
      permissions |= BigInt(Discordeno.BitwisePermissionFlags.SEND_MESSAGES);
    }

    return permissions;
  }

  /**
   * Calculates the channel overwrites for a role in a channel.
   * @param guild The guild.
   * @param channelId The channel ID.
   * @param roleId The role ID.
   * @returns The channel overwrites for the role.
   */
  public calculateCachedChannelOverwritesForRole(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    channelId: bigint,
    roleId: bigint,
  ): bigint {
    const channel = guild.channels?.get(channelId);
    if (!channel) return 0n;

    const isThread = [Discordeno.ChannelTypes.AnnouncementThread, Discordeno.ChannelTypes.PrivateThread, Discordeno.ChannelTypes.PublicThread].includes(channel.type);
    const parentChannel = isThread ? guild.channels?.get(channel.parentId!) : channel;
    if (!parentChannel) return 0n;

    const role = guild.roles?.get(roleId);
    if (!role) return 0n;

    let permissions = role.permissions.bitfield;
    const overwrites = parentChannel.internalOverwrites ?? [];

    const everyoneOverwrite = overwrites.find((overwrite) => Discordeno.separateOverwrites(overwrite)[1] === parentChannel.guildId);
    if (everyoneOverwrite) {
      const [, , allow, deny] = Discordeno.separateOverwrites(everyoneOverwrite);
      permissions = (permissions & ~deny) | allow;
    }

    let allow = 0n;
    let deny = 0n;
    for (const overwrite of overwrites) {
      const [, id, allowBits, denyBits] = Discordeno.separateOverwrites(overwrite);
      if (id === roleId) {
        deny |= denyBits;
        allow |= allowBits;
      }
    }
    permissions = (permissions & ~deny) | allow;

    const roleOverwrite = overwrites.find((overwrite) => Discordeno.separateOverwrites(overwrite)[1] === roleId);
    if (roleOverwrite) {
      const [, , allowBits, denyBits] = Discordeno.separateOverwrites(roleOverwrite);
      permissions = (permissions & ~denyBits) | allowBits;
    }

    if (isThread && (permissions & BigInt(Discordeno.BitwisePermissionFlags.SEND_MESSAGES_IN_THREADS))) {
      permissions |= BigInt(Discordeno.BitwisePermissionFlags.SEND_MESSAGES);
    }

    return permissions;
  }

  /**
   * Gets the missing permissions from a set of permission bits.
   * @param permissionBits The permission bits.
   * @param permissions The permissions to check.
   * @returns An array of missing permissions.
   */
  public getMissingPerms(permissionBits: bigint, permissions: Discordeno.PermissionStrings[]): string[] {
    if (permissionBits & BigInt(Discordeno.BitwisePermissionFlags.ADMINISTRATOR)) return [];
    const missingPermissions: string[] = [];
    for (const permission of permissions) {
      if (!(permissionBits & BigInt(Discordeno.BitwisePermissionFlags[permission]))) {
        missingPermissions.push(permission);
      }
    }
    return missingPermissions;
  }

  /**
   * Validates if the given permission bits match the given permissions.
   * @param permissionBits The permission bits.
   * @param permissions The permissions to validate.
   * @returns True if the permissions are valid, false otherwise.
   */
  public validatePermissions(permissionBits: bigint, permissions: Discordeno.PermissionStrings[]): boolean {
    if (permissionBits & BigInt(Discordeno.BitwisePermissionFlags.ADMINISTRATOR)) return true;
    for (const permission of permissions) {
      if (!(permissionBits & BigInt(Discordeno.BitwisePermissionFlags[permission]))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if a member has the specified permissions in a guild.
   * @param guild The guild.
   * @param member The member.
   * @param permissions The permissions to check.
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
   * @param guild The guild.
   * @param channelId The channel ID.
   * @param member The member.
   * @param permissions The permissions to check.
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
   * @param guild The guild.
   * @param member The member.
   * @param permissions The permissions to check.
   * @returns An array of missing permissions.
   */
  public getMissingGuildPermissions<T extends Discordeno.PermissionStrings>(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
    permissions: T[],
  ): Discordeno.PermissionStrings[] {
    const permissionBits = this.calculateBasePermissions(guild, member);
    return this.missingPermissions<T>(permissionBits, permissions);
  }

  /**
   * Gets the missing permissions from a member in a channel.
   * @param guild The guild.
   * @param channelId The channel ID.
   * @param member The member.
   * @param permissions The permissions to check.
   * @returns An array of missing permissions.
   */
  public getMissingChannelPermissions<T extends Discordeno.PermissionStrings>(
    guild: typeof this.framework.internal.cache.$inferredTypes.guild,
    channelId: bigint,
    member: typeof this.framework.internal.cache.$inferredTypes.member | typeof this.framework.internal.transformers.$inferredTypes.member,
    permissions: T[],
  ): Discordeno.PermissionStrings[] {
    const permissionBits = this.calculateCachedChannelOverwrites(guild, channelId, member);
    return this.missingPermissions<T>(permissionBits, permissions);
  }

  /**
   * Returns the permissions that are not in the given permissionBits
   */
  public missingPermissions<T extends Discordeno.PermissionStrings>(permissionBits: bigint, permissions: T[]): Discordeno.PermissionStrings[] {
    if (permissionBits & 8n) return [];

    return permissions.filter((permission) => !(permissionBits & BigInt(Discordeno.BitwisePermissionFlags[permission])));
  }

  /**
   * Converts a bitwise string to an array of permission strings.
   * @param permissionBits The bitwise string.
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
   * @param permissions The array of permission strings.
   * @returns The bitwise string.
   */
  public calculateBits(permissions: Discordeno.PermissionStrings[]): string {
    return permissions.reduce((bits, perm) => bits | BigInt(Discordeno.BitwisePermissionFlags[perm] ?? 0), 0n).toString();
  }

  /**
   * Gets the highest role of a member in a guild.
   * @param guild The guild.
   * @param member The member.
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
   * @param guild The guild.
   * @param roleId The ID of the first role.
   * @param otherRoleId The ID of the second role.
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
   * @param guild The guild.
   * @param member The member.
   * @param compareRoleId The role ID to compare with.
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
}
