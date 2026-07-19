import type { AutocompleteInteraction } from 'discord.js';

/**
 * Defines the structure of a command.
 */
export type AutoComplete = {
	data: {
		name: string;
	}
    /**
     * The function to execute when the command is called
     *
     * @param interaction - The interaction of the command
     */
    execute(interaction: AutocompleteInteraction): Promise<void> | void;
};