import { Discordeno, type DiscordJSBuilders } from '../../../deps.ts';

/**
 * Coerces a DiscordJSBuilders ContainerBuilder into Discordeno MessageComponents.
 *
 * @param builder - The DiscordJSBuilders ContainerBuilder instance.
 * @returns The coerced Discordeno MessageComponents array.
 */
export function coerce(builder: DiscordJSBuilders.ContainerBuilder): Discordeno.MessageComponents {
  return [builder.toJSON()] as unknown as Discordeno.MessageComponents;
}

/**
 * Converts Discordeno MessageComponents or a DiscordJSBuilders ContainerBuilder to a V2 component payload.
 *
 * @param components - The components to convert (either Discordeno MessageComponents or a ContainerBuilder).
 * @returns An object containing V2 flags and the converted components array.
 */
export function fastComponentV2(components: Discordeno.MessageComponents | DiscordJSBuilders.ContainerBuilder): {
  flags: Discordeno.MessageFlags.IsComponentsV2;
  components: Discordeno.MessageComponents;
} {
  if ('toJSON' in components && typeof components.toJSON === 'function') {
    return {
      flags: Discordeno.MessageFlags.IsComponentsV2,
      components: coerce(components as DiscordJSBuilders.ContainerBuilder),
    };
  }
  return {
    flags: Discordeno.MessageFlags.IsComponentsV2,
    components: components as Discordeno.MessageComponents,
  };
}
