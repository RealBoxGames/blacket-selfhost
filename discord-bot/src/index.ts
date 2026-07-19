import { ExtendedClient } from './structures/client';
import { config } from 'dotenv'

config({ path: '../.env' })

const client = new ExtendedClient();
client.start();
