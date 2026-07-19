import type { MessageContextMenuCommandInteraction, RESTPostAPIContextMenuApplicationCommandsJSONBody, UserContextMenuCommandInteraction } from 'discord.js';

/**
 * Defines the structure of a context menu.
 */
export type ContextMenu = {
    /**
     * The data for the context menu
     */
    data: RESTPostAPIContextMenuApplicationCommandsJSONBody;
    /**
     * The function to execute when the context menu is called
     *
     * @param interaction - The interaction of the context menu
     */
    execute(interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction): Promise<void> | void;
};