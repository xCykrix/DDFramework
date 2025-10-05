import { Discordeno, uFuzzy } from '../../deps.ts';
import type { DDFramework } from '../../mod.ts';
import type { DDFrameworkOptions } from '../../mod.types.ts';
import type { DDFrameworkDesiredProperties } from '../desired.ts';
import { getFirstPathOfApplicationCommand } from '../util/object/getFirstPathOfApplicationCommand.ts';
import { getFocusedOption } from '../util/object/getFocusedOption.ts';

/**
 * Registers the DDFramework autocomplete handler and wires it into the framework event bus.
 *
 * @param framework - The DDFramework instance with linked command metadata.
 * @param fwoptions - Global framework options (error handling, developer list, etc.).
 */
export function injectAutoCompleteHandler(
  framework: DDFramework<DDFrameworkDesiredProperties>,
  fwoptions: DDFrameworkOptions,
): void {
  framework.events.add('interactionCreate', async (interaction) => {
    if (interaction.type !== Discordeno.InteractionTypes.ApplicationCommandAutocomplete) return;

    const path = getFirstPathOfApplicationCommand(interaction);
    if (!path) return;

    if (interaction.data?.name !== path.split('.')[0]) return;

    const linkedOptions = framework.leaf.linkedOptions.get(path);
    if (!linkedOptions) {
      fwoptions.errorHandler(
        new Deno.errors.NotFound(`[DDFramework:AutoCompleteHandler] No linked options found for path: ${path}`),
      );
      return;
    }

    const dynamicHandler = framework.leaf.linkedDynamics.get(path);
    if (!dynamicHandler?.autocomplete) {
      fwoptions.errorHandler(
        new Deno.errors.NotFound(`[DDFramework:AutoCompleteHandler] No autocomplete handler found for path: ${path}`),
      );
      return;
    }

    const focused = getFocusedOption(interaction.data?.options) ?? null;
    if (focused === null) return;

    const generated = await dynamicHandler.autocomplete({
      interaction,
      focused,
    });
    if (generated === null) return;

    if (generated.results.length === 0) {
      await interaction.respond({
        choices: [{
          name: 'Search returned no results. Please try again with a different query.',
          value: 'null',
        }],
      });
      return;
    }

    const valueLookback = new Map<string, string>();
    for (const result of generated.results) {
      valueLookback.set(result.name, `${result.value ?? result.name}`);
    }

    const haystack = generated.results.map((result) => result.name);
    const needle = `${focused.value ?? ''}`;
    const uf = new uFuzzy.default();

    const choices: Discordeno.ApplicationCommandOptionChoice[] = [];

    if (needle === '' && generated.allowEmptySearch) {
      choices.push(...generated.results);
    } else {
      const idxs = uf.filter(haystack, needle);

      if (idxs === null || idxs.length === 0) {
        await interaction.respond({
          choices: [{
            name: 'Search returned no results. Please try again with a different query.',
            value: 'null',
          }],
        });
        return;
      }

      if (idxs.length <= 500) {
        const info = uf.info(idxs, haystack, needle);
        const order = uf.sort(info, haystack, needle);
        const limit = Math.min(order.length, generated.perPage ?? 10, 10);

        for (let i = 0; i < limit; i++) {
          const name = haystack[info.idx[order[i]]];
          choices.push({
            name,
            value: valueLookback.get(name) ?? name,
          });
        }
      } else {
        await interaction.respond({
          choices: [{
            name: 'Search returned too many results (over 500). Please refine your search.',
            value: 'null',
          }],
        });
        return;
      }
    }

    await interaction.respond({
      choices: choices.slice(0, 10),
    });
  });
}

// DO NOT EDIT PAST THIS LINE!

/**
 * Placeholder for future DDFramework autocomplete handler logic.
 *
 * This file is intentionally left empty.
 *
 * import { type ApplicationCommandOptionChoice, InteractionTypes } from '@discordeno';
import * as uFuzzy from 'ufuzzy';
import { EventManager } from '../../event.ts';
import { Register } from '../../register.ts';
import { getFirstInteractionPath } from '../../util/helper/interaction/getFirstInteractionPath.ts';
import { getFocusedOption } from '../../util/helper/interaction/getFocusedOption.ts';
import { Optic } from '../../util/optic.ts';
import { AsyncInitializable } from '../../util/typeHelper/asyncInitializable.ts';

export default class extends AsyncInitializable {
  // deno-lint-ignore require-await
  public override async initialize(): Promise<void> {
    EventManager.add('interactionCreate', async (interaction) => {
      // Validate State
      if (interaction.type !== InteractionTypes.ApplicationCommandAutocomplete) return;

      // Path Extraction
      const path = getFirstInteractionPath(interaction) ?? null;
      if (path === null) return;

      // Late Validate State
      if (interaction.data?.name !== path.split('.')[0]) return;

      // Extract Options
      const options = Register.options.get(path);

      // Verify Options is Configured
      if (options === undefined) {
        Optic.incident({
          moduleId: 'runtime.event.autocomplete.missingOptions',
          message: `Failed to find options associated to '${path}'.`,
          dispatch: true,
        });
        return;
      }

      // Extract Handler and Parse Arguments for Processing
      const handler = Register.handlers.get(path);

      if (handler === undefined) {
        Optic.incident({
          moduleId: 'runtime.event.autocomplete.missingHandler',
          message: `Failed to find handler associated to '${path}'.`,
          dispatch: true,
        });
        return;
      }
      if (handler?.autocomplete === undefined) {
        Optic.incident({
          moduleId: 'runtime.event.autocomplete.missingAutocomplete',
          message: `Handler for '${path}' does not have an autocomplete callback defined, but attempted to process an autocomplete interaction.`,
          dispatch: true,
        });
        return;
      }

      // Find Focused Option
      const focused = getFocusedOption(interaction.data.options);
      if (!focused) return;

      // Run Autocomplete Generator
      const generate = await handler.autocomplete({
        interaction,
        focused,
      });

      if (generate === null) return;
      if (generate.results.length === 0) {
        await interaction.respond({
          choices: [{
            name: 'Search returned no results. Please try again with a different query.',
            value: 'null',
          }],
        });
        return;
      }
      const valueLookback = new Map<string, string>();
      for (const generated of generate.results) {
        valueLookback.set(generated.name, `${generated.value ?? generated.name}`);
      }

      // Fuzzy match generated results to focused input.
      const haystack = generate.results.map((result) => result.name);
      const needle = `${focused.value}`;
      const uf = new uFuzzy.default();

      // List of Choices
      const choices: ApplicationCommandOptionChoice[] = [];

      // Passthrough if needle is empty.
      if (needle === '' && generate.allowEmptySearch) {
        choices.push(...generate.results);
      } else {
        // Pre-filter Needles
        const idxs = uf.filter(haystack, needle);

        if (idxs === null || idxs.length <= 0) {
          await interaction.respond({
            choices: [{
              name: 'Search returned no results. Please try again with a different query.',
              value: 'null',
            }],
          });
          return;
        }

        if (idxs.length <= 500) {
          const info = uf.info(idxs, haystack, needle);
          const order = uf.sort(info, haystack, needle);
          for (let i = 0; i < (order.length >= (generate.perPage ?? 10) ? 10 : order.length); i++) {
            choices.push({
              name: haystack[info.idx[order[i]]],
              value: valueLookback.get(haystack[info.idx[order[i]]]) ?? haystack[info.idx[order[i]]],
            });
          }
        } else {
          await interaction.respond({
            choices: [{
              name: 'Search returned too many results (over 500). Please refine your search results.',
              value: 'null',
            }],
          });
          return;
        }
      }

      // Respond with Choices
      await interaction.respond({
        choices: choices.slice(0, 10),
      });
    });
  }
}

 */
