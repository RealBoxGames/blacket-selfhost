import { type AutocompleteInteraction } from 'discord.js';
import { AutoComplete } from '../../structures/autoComplete';
import { fuzzySearch } from '../../misc/fuzzySearch';

export default {
    data: {
        name: 'pack',
    },
    async execute(interaction: AutocompleteInteraction<'cached'>) {
		const focusedValue = interaction.options.getFocused()

		const allPackNames = (await interaction.client.prisma.pack.findMany({
			select: {
				name: true
			}
		})).map(pack => pack.name);

		const results = fuzzySearch(allPackNames, focusedValue);

		await interaction.respond(results.map(result => ({ name: result, value: result })));
    }
} satisfies AutoComplete;