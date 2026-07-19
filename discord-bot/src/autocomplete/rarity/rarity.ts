import { type AutocompleteInteraction } from 'discord.js';
import { AutoComplete } from '../../structures/autoComplete';
import { fuzzySearch } from '../../misc/fuzzySearch';

export default {
    data: {
        name: 'rarity',
    },
    async execute(interaction: AutocompleteInteraction<'cached'>) {
        const focusedValue = interaction.options.getFocused()

        const allRarityNames = (await interaction.client.prisma.rarity.findMany({
            select: {
                name: true
            }
        })).map(pack => pack.name);

        const results = fuzzySearch(allRarityNames, focusedValue);

        await interaction.respond(results.map(result => ({ name: result, value: result })));
    }
} satisfies AutoComplete;
