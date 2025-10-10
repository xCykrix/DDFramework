import { Discordeno } from '../deps.ts';

/**
 * Type utility to overwrite all keys in User that exist in Base with the type from Base,
 * but keep all other keys from User.
 */
export type Overwrite<Base, User> =
  & {
    [K in keyof Base]: Base[K];
  }
  & {
    [K in Exclude<keyof User, keyof Base>]: User[K];
  };

/**
 * Recursively merges user-supplied desired properties with the framework's minimal set.
 * All keys in Base will overwrite those in User, but all other user keys are preserved.
 *
 * @param user User-supplied desired properties (can be partial or full)
 * @param base The framework's minimal desired properties
 * @returns The merged desired properties object
 */
export function mergeDesiredProperties<Base extends object, User extends object>(
  user: User,
  base: Base,
): Overwrite<Base, User> {
  const result: Record<string, unknown> = { ...(user as Record<string, unknown>) };
  for (const key in base) {
    if (
      typeof base[key] === 'object' &&
      base[key] !== null &&
      !Array.isArray(base[key])
    ) {
      result[key] = mergeDesiredProperties(
        (user as Record<string, unknown>)[key] ?? {},
        base[key] as object,
      );
    } else {
      result[key] = base[key];
    }
  }
  return result as Overwrite<Base, User>;
}

/**
 * Minimal desired properties for DDFramework.
 *
 * This object defines the default set of properties that will be available on all entities
 * unless explicitly overridden in user configuration. Properties not specified will inherit these defaults.
 *
 * @remarks
 * Used as the base for merging with user-specified desired properties. All unspecified keys inherit these defaults.
 */
export const desiredPropertiesMinimal = Discordeno.createDesiredPropertiesObject(
  {
    channel: {
      id: true,
      parentId: true,
      guildId: true,
      type: true,
      position: true,
      name: true,
      permissions: true,
      permissionOverwrites: true,
      flags: true,
    },
    component: {
      id: true,
      customId: true,
      type: true,
      channelTypes: true,
      options: true,
      name: true,
      description: true,
      content: true,
      required: true,
      disabled: true,
      value: true,
      values: true,
      placeholder: true,
      label: true,
      defaultValues: true,
      component: true,
      components: true,
      minLength: true,
      maxLength: true,
      minValues: true,
      maxValues: true,
      divider: true,
      spacing: true,
      style: true,
      accentColor: true,
    },
    defaultReactionEmoji: {},
    guild: {
      id: true,
      ownerId: true,
      toggles: true,
      channels: true,
      members: true,
      roles: true,
      permissions: true,
    },
    interaction: {
      id: true,
      applicationId: true,
      type: true,
      guild: true,
      guildId: true,
      channel: true,
      channelId: true,
      member: true,
      user: true,
      token: true,
      message: true,
      data: true,
      appPermissions: true,
      context: true,
    },
    interactionCallbackResponse: {
      interaction: true,
      resource: true,
    },
    interactionCallback: {
      id: true,
      type: true,
    },
    interactionResource: {
      type: true,
      message: true,
    },
    member: {
      id: true,
      toggles: true,
      guildId: true,
      user: true,
      roles: true,
      permissions: true,
    },
    message: {
      id: true,
      guildId: true,
      channelId: true,
      author: true,
      member: true,
      content: true,
      components: true,
      embeds: true,
      interactionMetadata: true,
      nonce: true,
      type: true,
    },
    role: {
      id: true,
      guildId: true,
      toggles: true,
      permissions: true,
      name: true,
      position: true,
    },
    user: {
      id: true,
      flags: true,
      toggles: true,
    },
  } as const,
);
