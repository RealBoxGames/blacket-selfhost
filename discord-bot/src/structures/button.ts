import type { PermissionType } from '@blacket/types';
import type { CommandInteraction, InteractionButtonComponentData } from 'discord.js';

/**
 * Defines the structure of a command.
 */
export type Button = {
	/**
	 * The data for the command
	 */
	data: InteractionButtonComponentData;
	/**
	 * The function to execute when the command is called
	 *
	 * @param interaction - The interaction of the command
	 */
	execute(interaction: CommandInteraction): Promise<void> | void;
};