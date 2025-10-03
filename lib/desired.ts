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

// Make all desired properties optional at the type level
type OptionalDesiredProperties<T> = {
  [K in keyof T]?: T[K] extends Discordeno.TransformersDesiredProperties ? OptionalDesiredProperties<T[K]> : T[K];
};

// Utility function to merge user properties with required ones
export function createDDFrameworkProperties<T extends Discordeno.TransformersDesiredProperties>(
  userProperties: OptionalDesiredProperties<T>,
): T & typeof desiredPropertiesMinimal {
  const result = {
    ...desiredPropertiesMinimal,
    ...userProperties,
  } as T & typeof desiredPropertiesMinimal;

  // Automatically merge all first-level objects from desiredPropertiesMinimal
  const minimalKeys = Object.keys(desiredPropertiesMinimal) as (keyof typeof desiredPropertiesMinimal)[];

  for (const key of minimalKeys) {
    const minimalValue = desiredPropertiesMinimal[key];
    const userValue = (userProperties as Record<string | symbol, unknown>)[key];

    if (typeof minimalValue === 'object' && minimalValue !== null) {
      (result as Record<string | symbol, unknown>)[key] = {
        ...minimalValue,
        ...(typeof userValue === 'object' && userValue !== null ? userValue : {}),
      };
    }
  }

  return result;
}

// Type alias for the minimal properties for easier use
export type MinimalDesiredProperties = typeof desiredPropertiesMinimal;

// Type that ensures T includes the minimal properties
export type DDFrameworkDesiredProperties<T extends Discordeno.TransformersDesiredProperties = MinimalDesiredProperties> = T & MinimalDesiredProperties;
