import { Session } from "src/core/guard";

enum ServerType {
    DEV = "DEV",
    STAGING = "STAGING",
    PROD = "PROD"
}

declare global {
    namespace Express {
        interface Request {
            session: Session | undefined;
        }

        interface File {
            fieldname: string;
            originalname: string;
            encoding: string;
            mimetype: string;
            size: number;

            destination?: string;
            filename?: string;
            path?: string;

            buffer?: Buffer;
        }
    }

    namespace NodeJS {
        interface ProcessEnv {
            SERVER_PORT: number;

            SERVER_TYPE: ServerType;

            SERVER_BASE_URL: string;

            SERVER_DATABASE_HOST: string;
            SERVER_DATABASE_PORT: number;
            SERVER_DATABASE_USER: string;
            SERVER_DATABASE_PASSWORD: string;
            SERVER_DATABASE_NAME: string;
            SERVER_DATABASE_URL: string;

            SERVER_MAIL_HOST: string;
            SERVER_MAIL_PORT: number;
            SERVER_MAIL_USER: string;
            SERVER_MAIL_PASSWORD: string;
            SERVER_MAIL_FROM: string;

            SERVER_REDIS_HOST: string;
            SERVER_REDIS_PORT: number;
            SERVER_REDIS_PASSWORD: string;

            SERVER_STRIPE_SECRET_KEY: string;
            SERVER_STRIPE_WEBHOOK_SECRET_KEY: string;

            SERVER_S3_ACCESS_KEY: string;
            SERVER_S3_SECRET_KEY: string;
            SERVER_S3_BUCKET: string;
            SERVER_S3_REGION: string;

            SERVER_TURNSTILE_SECRET_KEY: string;

            SERVER_DISCORD_CLIENT_SECRET: string;
            SERVER_DISCORD_PURCHASE_WEBHOOK_URL: string;
            SERVER_DISCORD_INVOICE_WEBHOOK_URL: string;

            SERVER_BLOCK_PROXIES: boolean;
            SERVER_ALLOW_MULTIPLE_ACCOUNTS: boolean;
            SERVER_REGISTRATION_ENABLED: boolean;
            SERVER_REGISTRATION_BYPASS_PASSWORD: string;

            BOT_DISCORD_TOKEN: string;
            BOT_GUILD_ID: string;
            BOT_CLIENT_ID: string;

            VITE_BACKEND_URL: string;

            VITE_ALLOWED_ORIGINS: string;

            VITE_MEDIA_URL: string;
            VITE_MEDIA_BACKUP_URL: string;

            VITE_CDN_URL: string;
            VITE_CDN_BACKUP_URL: string;

            VITE_STRIPE_PUBLIC_KEY: string;
            VITE_TURNSTILE_SITE_KEY: string;

            VITE_INFORMATION_NAME: string;
            VITE_INFORMATION_PRONUNCIATION: string;
            VITE_INFORMATION_DISCORD_INVITE: string;
            VITE_INFORMATION_VERSION: string;

            VITE_DISCORD_CLIENT_ID: string;

            VITE_LEVEL_DIFFICULTY: number;
        }
    }
}

declare module "socket.io" {
    interface Socket {
        session: Session | undefined;
        ping: number;

        inRoom: (room: string) => boolean;
    }
}

export { };
