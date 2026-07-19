import { type AutocompleteInteraction } from 'discord.js';
import { AutoComplete } from '../../structures/autoComplete';
import { fuzzySearch } from '../../misc/fuzzySearch';

export default {
    data: {
        name: 'user',
    },
    async execute(interaction: AutocompleteInteraction<'cached'>) {
		const focusedValue = interaction.options.getFocused()

		const allUsernames = (await interaction.client.prisma.user.findMany({
			select: {
				username: true
			}
		})).map(user => user.username);

		const results = fuzzySearch(allUsernames, focusedValue);

		await interaction.respond(results.map(result => ({ name: result, value: result })));
    }
} satisfies AutoComplete;