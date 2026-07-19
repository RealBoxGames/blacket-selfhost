import type { APISelectMenuComponent, AnySelectMenuInteraction } from 'discord.js';

/**
 * Defines the structure of a select menu.
 */
export type SelectMenu = {
    /**
     * The data for the select menu
     */
    data: Omit<APISelectMenuComponent, "options">;
    /**
     * The function to execute when the select menu is called
     *
     * @param interaction - The interaction of the select menu
     */
    execute(interaction: AnySelectMenuInteraction): Promise<void> | void;
};