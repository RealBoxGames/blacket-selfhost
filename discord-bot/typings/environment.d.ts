declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BOT_DISCORD_TOKEN: string;
            BOT_CLIENT_ID: string;
            BOT_GUILD_ID: string;
            SERVER_BASE_URL: string;
            SERVER_PORT: string;
            SERVER_DATABASE_HOST: string;
            SERVER_DATABASE_PASSWORD: string;
            SERVER_DATABASE_NAME: string;
            SERVER_DATABASE_URL: string;
            environment: "dev" | "prod" | "debug";
        }
    }
}



export { };