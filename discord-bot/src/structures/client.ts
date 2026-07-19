import { Client, Collection, GatewayIntentBits } from 'discord.js';

import { loadStructures } from '../misc/util';

import type { Command } from './command';
import type { Event } from './event';
import { PrismaInstance } from '../database/prisma';
import path, { join } from 'node:path';
import { readdir } from 'node:fs';
import { GlobalFonts } from '@napi-rs/canvas';
import { ContextMenu } from './contextMenu';
import { SelectMenu } from './selectMenu';
import { RedisInstance } from '../redis/redis';
import { AutoComplete } from './autoComplete';

export class ExtendedClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
            ],
            failIfNotExists: false,
            rest: {
                retries: 3,
                timeout: 15_000
            },
        });
        this.commands = new Collection<string, Command>();
        this.autoCompletes = new Collection<string, AutoComplete>();
        this.contextMenus = new Collection<string, ContextMenu>();
        this.selectMenus = new Collection<string, SelectMenu>();
        this.cooldown = new Collection<string, Collection<string, number>>();
        this.prisma = new PrismaInstance();
        this.redis = new RedisInstance();
    };

    /**
     * Loads all commands and events from their respective folders.
     */
    private async loadModules() {

        // Command handling
        const commandFolderPath = path.join(__dirname, '../commands');
        const commandFiles: Command[] = await loadStructures(commandFolderPath, ['data', 'execute']);

        for (const command of commandFiles) {
            this.commands.set(command.data.name, command);
            console.log(`Loaded command ${command.data.name}`)
        }

        // Autocomplete handling
        const autoCompleteFolderPath = path.join(__dirname, '../autocomplete');
        const autoCompleteFiles: AutoComplete[] = await loadStructures(autoCompleteFolderPath, ['data', 'execute']);

        for (const autoComplete of autoCompleteFiles) {
            this.autoCompletes.set(autoComplete.data.name, autoComplete);
            console.log(`Loaded autocomplete ${autoComplete.data.name}`)
        }

        // Context Menu handling
        const contextMenuFolderPath = path.join(__dirname, '../contextmenu');
        const contextMenuFiles: ContextMenu[] = await loadStructures(contextMenuFolderPath, ['data', 'execute']);

        for (const contextMenu of contextMenuFiles) {
            this.contextMenus.set(contextMenu.data.name, contextMenu);
            console.log(`Loaded context menu ${contextMenu.data.name}`)
        }

        // Select Menu handling
        const selectMenuFolderPath = path.join(__dirname, '../selectmenu');
        const selectMenuFiles: SelectMenu[] = await loadStructures(selectMenuFolderPath, ['data', 'execute']);

        for (const selectMenu of selectMenuFiles) {
            this.selectMenus.set(selectMenu.data.custom_id, selectMenu);
            console.log(`Loaded select menu ${selectMenu.data.custom_id}`)
        }

        // Event handling
        const eventFolderPath = path.join(__dirname, '../events');
        const eventFiles: Event[] = await loadStructures(eventFolderPath, ['name', 'execute']);

        for (const event of eventFiles) {
            this[event.once ? 'once' : 'on'](event.name, async (...args) => event.execute(...args));
            console.log(`Loaded event ${event.name}`)
        }

        // Load Fonts
        GlobalFonts.registerFromPath(join(__dirname, '..', '..', '/assets/Nunito-Bold.ttf'), 'Nunito');
        GlobalFonts.registerFromPath(join(__dirname, '..', '..', '/assets/TitanOne-Regular.ttf'), 'Titan One');
    }

    /**
     * This is used to log into the Discord API with loading all commands and events.
     */
    start() {
        this.loadModules();
        this.login(process.env.BOT_DISCORD_TOKEN);
    };
};