import { Discordeno, DiscordJSBuilders } from '../../../deps.ts';

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

export function fastGenericComponentV2(
  parts: {
    title?: string;
    content: string;
    color?: number;
  } | {
    title: string;
    content?: string;
    color?: number;
  },
): {
  flags: Discordeno.MessageFlags.IsComponentsV2;
  components: Discordeno.MessageComponents;
} {
  const builder = new DiscordJSBuilders.ContainerBuilder()
    .setAccentColor(parts.color ?? 0x5865F2); // #5865F2
  if (parts.title !== undefined) {
    builder.addTextDisplayComponents((b) => b.setContent(parts.title ?? 'Invalid Title (Report to Developer)'));
    builder.addSeparatorComponents((b) => b.setSpacing(Discordeno.SeparatorSpacingSize.Small));
  }
  if (parts.content !== undefined) {
    builder.addTextDisplayComponents((b) => b.setContent(parts.content ?? 'Invalid Response (Report to Developer)'));
    builder.addSeparatorComponents((b) => b.setSpacing(Discordeno.SeparatorSpacingSize.Small));
  }
  builder
    .addSeparatorComponents((b) => b.setSpacing(Discordeno.SeparatorSpacingSize.Small))
    .addTextDisplayComponents((b) => b.setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F>`));

  return fastComponentV2(
    builder,
  );
}
