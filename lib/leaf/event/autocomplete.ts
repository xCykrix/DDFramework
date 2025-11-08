import type { DiscordFramework } from '@amethyst/ddframework';
import uFuzzy from '@ufuzzy';
import type { APIApplicationCommandOptionChoice } from 'discord.js';
import { getFirstPathOfApplicationCommand } from '../../util/internal/getFirstPathOfApplicationCommand.ts';
import { intercept } from '../intercept.ts';

/**
 * Injects a handler for Discord.js autocomplete interactions into the framework.
 *
 * This function listens for 'interactionCreate' events, filters for autocomplete interactions,
 * validates the interaction, retrieves state and handler, and invokes the autocomplete callback.
 *
 * All errors and invalid states are handled with warnings or are logged via the framework's ledger.
 *
 * @param framework - The DiscordFramework instance to inject the handler into.
 */
export function injectAutoCompleteHandler(framework: DiscordFramework): void {
  framework.djs.on(
    'interactionCreate',
    intercept('interactionCreate', framework, 'leaf/event/autocomplete', async (interaction) => {
      // Verify Interaction is Processable by Handler.
      if (!interaction.isAutocomplete()) return;

      // Extract Path
      const path = getFirstPathOfApplicationCommand(interaction);
      if (path === null) return;
      if (interaction.commandName !== path?.split('.')[0]) return;

      // Get Linked Options or Reject Interaction.
      const linkedOptions = framework.leaf.linkedOptions.get(path);
      if (!linkedOptions) {
        framework.ledger.warning(`[Autocomplete] Missing linked options for path: ${path}`);
        return;
      }

      // Check Linked Handler
      const linkedHandler = framework.leaf.linkedDynamics.get(path);
      if (linkedHandler === undefined || linkedHandler.autocomplete === undefined) {
        framework.ledger.warning(`[Autocomplete] Missing linked handler for path: ${path}`);
        return;
      }

      // Get Focused Argument
      const focused = interaction.options.getFocused();

      // Execute Callback to Component.
      const autocompleted = await linkedHandler.autocomplete({
        framework,
        interaction,
        focused,
      }).catch((e) => {
        framework.ledger.severe(`[Autocomplete] Error in autocomplete handler for path: ${path}`, {
          err: e,
        });
        return null;
      });
      if (autocompleted === null) return;

      // Respond with no results message if no results found.
      if (autocompleted.results.length === 0) {
        await interaction.respond([{
          name: 'Search returned no results with the current inquiry.',
          value: 'null',
        }]);
        return;
      }

      // Prepare value lookback map for fuzzy search.
      const valueLookback = new Map<string, string>();
      for (const result of autocompleted.results) {
        valueLookback.set(result.name, `${result.value ?? result.name}`);
      }

      // Prepare haystack for fuzzy search.
      const haystack = autocompleted.results.map((result) => result.name);
      const needle = `${focused.value ?? ''}`.trim();
      const uf = new uFuzzy();
      const choices: APIApplicationCommandOptionChoice[] = [];

      // Perform fuzzy search and respond with filtered choices.
      if (needle === '' && autocompleted.allowEmptySearch) {
        choices.push(...autocompleted.results);
      } else {
        const idxs = uf.filter(haystack, needle);

        if (idxs === null || idxs.length === 0) {
          await interaction.respond([{
            name: 'Search returned no results with the current inquiry.',
            value: 'null',
          }]);
          return;
        }

        if (idxs.length <= 500) {
          const info = uf.info(idxs, haystack, needle);
          const order = uf.sort(info, haystack, needle);
          const limit = Math.min(order.length, autocompleted.perPage ?? 10, 10);

          for (let i = 0; i < limit; i++) {
            const name = haystack[info.idx[order[i]]];
            choices.push({
              name,
              value: valueLookback.get(name) ?? name,
            });
          }
        } else {
          await interaction.respond([{
            name: 'Search returned too many results (over 500). Please refine your search first.',
            value: 'null',
          }]);
          return;
        }
      }

      // Respond with filtered choices.
      await interaction.respond(choices);
    }),
  );
}
