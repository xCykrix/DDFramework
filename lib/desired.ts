import { Discordeno } from '../deps.ts';

/**
 * Minimal desired properties for DDFramework.
 *
 * This object defines the default set of properties that will be available on all entities
 * unless explicitly overridden in user configuration. Properties not specified will default to `false`.
 *
 * @remarks
 * Used as the base for merging with user-specified desired properties. All unspecified keys default to `false`.
 */
export const desiredPropertiesMinimal = Discordeno.createDesiredPropertiesObject({
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
  component: {},
  defaultReactionEmoji: {},
  guild: {
    id: true,
    ownerId: true,
    toggles: true,
    permissions: true,
    roles: true,
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
});
/**
 * Interface representing the minimal desired properties required by DDFramework.
 *
 * Extends all keys in `desiredPropertiesMinimal` as required.
 */
export interface DDBotDesiredMinimalProperties extends Required<typeof desiredPropertiesMinimal> {}

/**
 * Recursively fills missing keys in the user-provided desired properties object with defaults from the minimal desired properties.
 *
 * Any unspecified key will be set to `false`.
 *
 * @param userProps - The user-specified desired properties (may be partial).
 * @param allProps - The schema of all possible properties (usually `desiredPropertiesMinimal`).
 * @returns The merged properties object with all missing keys set to `false`.
 */
function fillDefaults<T extends object>(userProps: T, allProps: Record<string, unknown>): T & Record<string, false> {
  const result: Record<string, unknown> = {};
  for (const key in allProps) {
    if (!Object.prototype.hasOwnProperty.call(allProps, key)) continue;
    const userValue = (userProps as Record<string, unknown>)[key];
    const allValue = allProps[key];
    if (typeof allValue === 'object' && allValue !== null && !Array.isArray(allValue)) {
      result[key] = fillDefaults(
        typeof userValue === 'object' && userValue !== null ? userValue : {},
        allValue as Record<string, unknown>,
      );
    } else {
      result[key] = key in userProps ? userValue : false;
    }
  }
  // Also copy any user keys not in allProps
  for (const key in userProps as Record<string, unknown>) {
    if (!Object.prototype.hasOwnProperty.call(userProps, key)) continue;
    if (!(key in result)) {
      result[key] = (userProps as Record<string, unknown>)[key];
    }
  }
  return result as T & Record<string, false>;
}

/**
 * Type representing the desired properties for DDFramework.
 *
 * All properties are optional and default to `false` if not specified.
 * This type is recursively applied to nested objects.
 *
 * @template T - The base properties type to make optional.
 */
type OptionalDesiredProperties<T> = {
  [K in keyof T]?: T[K] extends object ? OptionalDesiredProperties<T[K]> : T[K];
};

/**
 * Creates the desired properties object for DDFramework by merging user config with minimal defaults.
 *
 * All unspecified keys will default to `false`.
 *
 * @param userProperties - The user-specified desired properties (may be partial).
 * @returns The merged desired properties object with all keys present and missing keys set to `false`.
 */
export function createDDFrameworkProperties<T extends object>(
  userProperties: OptionalDesiredProperties<T>,
): T & typeof desiredPropertiesMinimal {
  // Fill missing keys with false, using desiredPropertiesMinimal as the schema
  return fillDefaults(userProperties, desiredPropertiesMinimal) as T & typeof desiredPropertiesMinimal;
}

/**
 * Type alias for the minimal desired properties for easier use.
 *
 * @see desiredPropertiesMinimal
 */
export type MinimalDesiredProperties = typeof desiredPropertiesMinimal;

/**
 * Type that ensures T includes the minimal properties required by DDFramework.
 *
 * This type is used to guarantee that user-specified properties always include the framework's defaults.
 *
 * @template T - The user-specified desired properties type.
 */
export type DDFrameworkDesiredProperties<T extends Discordeno.TransformersDesiredProperties = MinimalDesiredProperties> = T & MinimalDesiredProperties;
