import { PrismaClient } from "@blacket/core";

export class PrismaInstance extends PrismaClient {
	constructor() {
		super({
			datasources: {
				db: {
					url: `postgresql://${process.env.SERVER_DATABASE_USER}:${process.env.SERVER_DATABASE_PASSWORD}@${process.env.SERVER_DATABASE_HOST}:${process.env.SERVER_DATABASE_PORT??5432}/${process.env.SERVER_DATABASE_NAME}?schema=public`,
				}
			}
		})
	}
}
