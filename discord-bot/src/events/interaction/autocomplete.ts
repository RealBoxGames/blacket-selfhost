import { Events } from 'discord.js';

import type { Event } from '../../structures/event.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isAutocomplete()) return;

		const focusedName = interaction.options.getFocused(true).name;

		if (!focusedName) {
			console.error(`No focused name was found for ${interaction.commandName}.`);
			return;
		}

        const autoComplete = interaction.client.autoCompletes.get(focusedName);

        if (!autoComplete?.data) {
            console.error(`No autocomplete matching ${focusedName} was found.`);
            return;
        };

		try {
			await autoComplete.execute(interaction);
		} catch (error) {
			console.error(error);
		}
    }
} satisfies Event<Events.InteractionCreate>;