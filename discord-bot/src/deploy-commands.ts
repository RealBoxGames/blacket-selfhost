import {
    REST,
    type RESTPostAPIApplicationCommandsJSONBody,
    type RESTPostAPIApplicationGuildCommandsJSONBody,
    type RESTPutAPIApplicationCommandsJSONBody,
    type RESTPutAPIApplicationGuildCommandsJSONBody,
    Routes,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';

import { loadStructures } from './misc/util.js';

import type { Command } from './structures/command.js';
import path from 'node:path';
import 'dotenv/config'

// and deploy your commands!
(async () => {
    const commands: RESTPostAPIApplicationCommandsJSONBody[] | RESTPostAPIApplicationGuildCommandsJSONBody[] | RESTPostAPIApplicationCommandsJSONBody[] | RESTPostAPIApplicationGuildCommandsJSONBody[] = [];

    const commandFolderPath = path.join(__dirname, 'commands');
    const commandFiles: Command[] = await loadStructures(commandFolderPath, ['data', 'execute']);

    // Grab the output of each command for deployment
    for (const command of commandFiles) {
        commands.push(command.data);
    }

    // Grab the output of each context menu for deployment
    const contextMenuFolderPath = path.join(__dirname, 'contextmenu');
    const contextMenuFiles: Command[] = await loadStructures(contextMenuFolderPath, ['data', 'execute']);

    for (const contextMenu of contextMenuFiles) {
        commands.push(contextMenu.data);
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(process.env.BOT_DISCORD_TOKEN);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        let data: RESTPutAPIApplicationCommandsJSONBody[] | RESTPutAPIApplicationGuildCommandsJSONBody[] = [];

        if (process.env.BOT_GUILD_ID) {
            // The put method is used to fully refresh all commands in a guild with the current set
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.BOT_CLIENT_ID, process.env.BOT_GUILD_ID),
                { body: commands },
            ) as RESTPutAPIApplicationGuildCommandsJSONBody[];
        } else {
            // The put method is used to fully refresh all commands in all guilds with the current set
            data = await rest.put(
                Routes.applicationCommands(process.env.BOT_CLIENT_ID),
                { body: commands },
            ) as RESTPutAPIApplicationCommandsJSONBody[];

            // rest.put(Routes.applicationGuildCommands(process.env.BOT_CLIENT_ID, "1015037282551615518"), { body: [] })
            //     .then(() => console.log('Successfully deleted all guild commands.'))
            //     .catch(console.error);

            // rest.put(Routes.applicationCommands(process.env.BOT_CLIENT_ID), { body: [] })
            //     .then(() => console.log('Successfully deleted all application commands.'))
            //     .catch(console.error);
        };

        console.log(`Successfully reloaded ${data.length} application (/) commands ${process.env.BOT_GUILD_ID ? `in guild ${process.env.BOT_GUILD_ID}` : ''}`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    };
})();
