import { Discordeno } from '../deps.ts';

// Define the minimum required properties your framework needs
export const desiredPropertiesMinimal = Discordeno.createDesiredPropertiesObject({
  guild: {
    afkChannelId: false,
    afkTimeout: false,
    applicationId: true,
    approximateMemberCount: true,
    approximatePresenceCount: false,
    banner: false,
    channels: true,
    defaultMessageNotifications: false,
    description: false,
    discoverySplash: false,
    emojis: true,
    explicitContentFilter: false,
    icon: false,
    iconHash: false,
    id: true,
    incidentsData: false,
    joinedAt: false,
    large: false,
    maxMembers: false,
    maxPresences: false,
    maxStageVideoChannelUsers: false,
    maxVideoChannelUsers: false,
    memberCount: false,
    members: true,
    mfaLevel: false,
    name: true,
    nsfwLevel: false,
    owner: true,
    ownerId: true,
    permissions: true,
    preferredLocale: false,
    premiumProgressBarEnabled: false,
    premiumSubscriptionCount: false,
    premiumTier: false,
    presences: false,
    publicUpdatesChannelId: true,
    roles: true,
    rulesChannelId: false,
    safetyAlertsChannelId: true,
    shardId: true,
    splash: false,
    stageInstances: false,
    stickers: false,
    systemChannelFlags: true,
    systemChannelId: true,
    toggles: true,
    unavailable: true,
    vanityUrlCode: false,
    verificationLevel: false,
    voiceStates: false,
    welcomeScreen: false,
    widgetChannelId: false,
    widgetEnabled: false,
  },
  interaction: {
    // Add required interaction properties here
  },
  interactionCallback: {
    // Add required interactionCallback properties here
  },
  interactionCallbackResponse: {
    // Add required interactionCallbackResponse properties here
  },
});

// Utility function to merge user properties with required ones
export function createDDFrameworkProperties<T extends Discordeno.TransformersDesiredProperties>(
  userProperties: T,
): T & typeof desiredPropertiesMinimal {
  const result = {
    ...desiredPropertiesMinimal,
    ...userProperties,
  } as T & typeof desiredPropertiesMinimal;

  // Automatically merge all first-level objects from desiredPropertiesMinimal
  const minimalKeys = Object.keys(desiredPropertiesMinimal) as (keyof typeof desiredPropertiesMinimal)[];

  for (const key of minimalKeys) {
    const minimalValue = desiredPropertiesMinimal[key];
    const userValue = (userProperties as Record<string, unknown>)[key];

    if (typeof minimalValue === 'object' && minimalValue !== null) {
      (result as Record<string, unknown>)[key] = {
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
