import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaSeedService } from "./prisma-seed.service";

import { PrismaClient } from "@blacket/core";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor(private readonly configService: ConfigService,
        private readonly prismaSeedService: PrismaSeedService,) {
        super({
            datasources: {
                db: {
                    url: `postgresql://${configService.get("SERVER_DATABASE_USER")}:${configService.get("SERVER_DATABASE_PASSWORD")}@${configService.get("SERVER_DATABASE_HOST")}:${configService.get("SERVER_DATABASE_PORT") ?? 5432}/${configService.get("SERVER_DATABASE_NAME")}?schema=public`
                }
            }
        });
    }

    async onModuleInit() {
        await this.prismaSeedService.seedDatabase();

        if (this.configService.get<string>("NODE_ENV") !== "production") await this.prismaSeedService.dev();
    }
}
