import { Discordeno, DiscordJSBuilders, ulid } from '../../../deps.ts';
import type { DDFrameworkOptions } from '../../../mod.types.ts';
import { fastComponentV2 } from './componentHelpers.ts';

/**
 * Utility class for generating quick Discord interaction responses for errors and permission checks.
 */
export class QuickResponse {
  /**
   * Generates a Discord interaction response for internal rejection/errors.
   *
   * @param options - The DDFramework options (for error handler).
   * @param reason - Optional reason for rejection.
   * @returns A Discordeno InteractionCallbackData payload for the error.
   */
  public static INTERNAL_REJECT(options: DDFrameworkOptions, reason?: string): Discordeno.InteractionCallbackData {
    const supportId = ulid();
    options.errorHandler(new Deno.errors.PermissionDenied(`[DDFramework] Interaction Rejected: ${reason} | Support ID: ${supportId}`));

    return fastComponentV2(
      new DiscordJSBuilders.ContainerBuilder()
        .setAccentColor(0xD21F3C)
        .addTextDisplayComponents((b) =>
          b.setContent([
            'This request was not processed due to a internal exception or security violation. Please try again later or report an issue if this persists.',
            '',
            `**Technical Details**: ${reason ?? 'Unspecified Exception has occurred. Please report an issue if this persists.'}`,
          ].join('\n'))
        )
        .addSeparatorComponents((b) => b.setSpacing(Discordeno.SeparatorSpacingSize.Small))
        .addTextDisplayComponents((b) =>
          b.setContent([
            `-# <t:${Math.floor(Date.now() / 1000)}:F> | Support ID: ${supportId}`,
          ].join('\n'))
        ),
    );
  }

  /**
   * Generates a Discord interaction response for failed permissions checks.
   *
   * @param options - The DDFramework options (for error handler).
   * @param userType - Whether the check is for 'User' or 'Bot'.
   * @param requiredPermissions - Array of required permission strings.
   * @returns A Discordeno InteractionCallbackData payload for the permission error.
   */
  public static PERMISSIONS_CHECK_FAILED(options: DDFrameworkOptions, userType: 'User' | 'Bot', requiredPermissions: Discordeno.PermissionStrings[]): Discordeno.InteractionCallbackData {
    const supportId = ulid();
    options.errorHandler(new Deno.errors.PermissionDenied(`[DDFramework] Permissions Check Failed: ${userType} is missing one of the required permissions. (${requiredPermissions.join(', ')}) . Support ID: ${supportId}`));

    return fastComponentV2(
      new DiscordJSBuilders.ContainerBuilder()
        .setAccentColor(0xD21F3C)
        .addTextDisplayComponents((b) =>
          b.setContent([
            'This request was not processed due to a missing permissions. Please try again later or report an issue if this persists.',
            '',
            `**Details**: ${userType} is missing: ${requiredPermissions.join(', ')}`,
          ].join('\n'))
        )
        .addSeparatorComponents((b) => b.setSpacing(Discordeno.SeparatorSpacingSize.Small))
        .addTextDisplayComponents((b) =>
          b.setContent([
            `-# <t:${Math.floor(Date.now() / 1000)}:F> | Support ID: ${supportId}`,
          ].join('\n'))
        ),
    );
  }
}
