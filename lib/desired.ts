import { Discordeno } from '../deps.ts';

// Define the minimum required properties your framework needs
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

// Utility function to merge user properties with required ones
// Recursively fill missing keys with false
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


// Make all desired properties optional at the type level
type OptionalDesiredProperties<T> = {
  [K in keyof T]?: T[K] extends object ? OptionalDesiredProperties<T[K]> : T[K];
};

export function createDDFrameworkProperties<T extends object>(
  userProperties: OptionalDesiredProperties<T>,
): T & typeof desiredPropertiesMinimal {
  // Fill missing keys with false, using desiredPropertiesMinimal as the schema
  return fillDefaults(userProperties, desiredPropertiesMinimal) as T & typeof desiredPropertiesMinimal;
}

// Type alias for the minimal properties for easier use
export type MinimalDesiredProperties = typeof desiredPropertiesMinimal;

// Type that ensures T includes the minimal properties
export type DDFrameworkDesiredProperties<T extends Discordeno.TransformersDesiredProperties = MinimalDesiredProperties> = T & MinimalDesiredProperties;
