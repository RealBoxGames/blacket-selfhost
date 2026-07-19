import { Inject, Injectable, forwardRef } from "@nestjs/common";
import type { Prisma, Resource } from "@blacket/core";
import { BlacketLoggerService } from "src/core/logger/logger.service";
import { groups } from "./seeds/groups";
import {
    initialBanner,
    initialBlook,
    initialFonts,
    initialItem,
    initialRarities,
    initialResources,
    initialRooms,
    initialTitle
} from "./seeds/initial";
import { items } from "./seeds/items";
import { packAmbiences, packs } from "./seeds/packs";
import { products } from "./seeds/products";
import { stores } from "./seeds/stores";
import { subscriptions } from "./seeds/subscriptions";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaSeedService {
    constructor(
        @Inject(forwardRef(() => PrismaService))
        private readonly prisma: PrismaService,
        private readonly blacketLogger: BlacketLoggerService
    ) {}

    async dev(): Promise<void> {
        await this.seedPacks();
        await this.seedPackAmbiences();
        await this.seedGroups();
        await this.seedItems();
        await this.seedStores();
        await this.seedProducts();
        await this.seedSubscriptions();
    }

    async seedDatabase(): Promise<void> {
        const seeded = await this.prisma.resource.findFirst({
            where: { reference: "DEFAULT_BLOOK" }
        });

        if (seeded) {
            this.blacketLogger.info("Database has already been seeded, skipping initial seeding.", "Database", "Blacket");
            return;
        }

        this.blacketLogger.info("Seeding database with initial data...", "Database", "Blacket");

        try {
            await this.prisma.$transaction(async (tx) => {
                const resources = new Map<string, Resource>();

                for (const seed of initialResources) {
                    const resource = await tx.resource.create({
                        data: {
                            path: seed.path,
                            reference: seed.reference
                        }
                    });

                    resources.set(seed.reference, resource);
                }

                const getResource = (reference: string): Resource => {
                    const resource = resources.get(reference);

                    if (!resource) {
                        throw new Error(`Missing initial resource "${reference}" while seeding database.`);
                    }

                    return resource;
                };

                await tx.room.createMany({
                    data: [...initialRooms]
                });

                const rarities = new Map<string, { id: number }>();

                for (const seed of initialRarities) {
                    const rarity = await tx.rarity.create({
                        data: {
                            name: seed.name,
                            color: seed.color,
                            experience: seed.experience,
                            animationType: seed.animationType,
                            imageId: getResource(seed.imageReference).id,
                            priority: seed.priority
                        }
                    });

                    rarities.set(seed.name, rarity);
                }

                const getRarity = (name: string): { id: number } => {
                    const rarity = rarities.get(name);

                    if (!rarity) {
                        throw new Error(`Missing initial rarity "${name}" while seeding database.`);
                    }

                    return rarity;
                };

                await tx.banner.create({
                    data: {
                        name: initialBanner.name,
                        image: {
                            connect: { id: getResource(initialBanner.resourceReference).id }
                        },
                        default: initialBanner.default
                    }
                });

                await tx.blook.create({
                    data: {
                        name: initialBlook.name,
                        chance: initialBlook.chance,
                        price: initialBlook.price,
                        rarity: {
                            connect: { id: getRarity(initialBlook.rarity).id }
                        },
                        background: {
                            connect: { id: getResource(initialBlook.backgroundReference).id }
                        },
                        image: {
                            connect: { id: getResource(initialBlook.imageReference).id }
                        }
                    }
                });

                const fonts = new Map<string, { id: number }>();

                for (const seed of initialFonts) {
                    const font = await tx.font.create({
                        data: {
                            name: seed.name,
                            resourceId: getResource(seed.resourceReference).id,
                            default: seed.default,
                            priority: seed.priority
                        }
                    });

                    fonts.set(seed.name, font);
                }

                const titleFont = fonts.get(initialTitle.font);

                if (!titleFont) {
                    throw new Error(`Missing initial font "${initialTitle.font}" while seeding database.`);
                }

                await tx.title.create({
                    data: {
                        name: initialTitle.name,
                        fontId: titleFont.id,
                        default: initialTitle.default
                    }
                });

                await tx.item.create({
                    data: {
                        name: initialItem.name,
                        description: initialItem.description,
                        rarityId: getRarity(initialItem.rarity).id,
                        imageId: getResource(initialItem.imageReference).id,
                        canUse: initialItem.canUse,
                        type: initialItem.type,
                        priority: initialItem.priority
                    }
                });
            });
        } catch (error) {
            this.blacketLogger.error(`Failed to seed database: ${(error as Error).message}`, undefined, "Database", "Blacket");
            process.exit(1);
        }

        this.blacketLogger.info("Database has been seeded with initial data!", "Database", "Blacket");
    }

    private async seedPacks(): Promise<void> {
        for (const pack of packs) {
            await this.upsertResource(pack.imageReference, pack.imagePath);
            await this.upsertResource(pack.iconReference, pack.iconPath);
            await this.upsertResource(pack.backgroundReference, pack.backgroundPath);

            for (const [priority, blook] of pack.blooks.entries()) {
                const imageReference = this.nameToReference(blook.name, "BLOOK");
                let videoCreate;
                let videoUpdate;

                await this.upsertResource(imageReference, `{cdn}/content/blooks/${blook.name}.png`);

                if (blook.video) {
                    await this.upsertResource(blook.video.reference, blook.video.path);

                    videoCreate = {
                        create: {
                            length: blook.video.length,
                            resource: {
                                connect: { reference: blook.video.reference }
                            }
                        }
                    };

                    videoUpdate = {
                        upsert: {
                            create: {
                                length: blook.video.length,
                                resource: {
                                    connect: { reference: blook.video.reference }
                                }
                            },
                            update: {
                                length: blook.video.length,
                                resource: {
                                    connect: { reference: blook.video.reference }
                                }
                            }
                        }
                    };
                }

                await this.prisma.blook.upsert({
                    where: { name: blook.name },
                    update: {
                        price: blook.price,
                        chance: blook.chance,
                        image: { connect: { reference: imageReference } },
                        background: {
                            connect: { reference: pack.backgroundReference }
                        },
                        rarity: { connect: { name: blook.rarity } },
                        video: videoUpdate,
                        priority,
                        isBig: blook.isBig ?? false
                    },
                    create: {
                        name: blook.name,
                        price: blook.price,
                        chance: blook.chance,
                        image: { connect: { reference: imageReference } },
                        background: {
                            connect: { reference: pack.backgroundReference }
                        },
                        rarity: { connect: { name: blook.rarity } },
                        video: videoCreate,
                        priority,
                        isBig: blook.isBig ?? false
                    }
                });
            }

            await this.prisma.pack.upsert({
                where: { name: pack.name },
                update: {
                    price: pack.price,
                    image: { connect: { reference: pack.imageReference } },
                    icon: { connect: { reference: pack.iconReference } },
                    background: {
                        connect: { reference: pack.backgroundReference }
                    },
                    blook: {
                        set: [],
                        connect: pack.blooks.map((blook) => ({ name: blook.name }))
                    }
                },
                create: {
                    name: pack.name,
                    price: pack.price,
                    image: { connect: { reference: pack.imageReference } },
                    icon: { connect: { reference: pack.iconReference } },
                    background: {
                        connect: { reference: pack.backgroundReference }
                    },
                    blook: {
                        connect: pack.blooks.map((blook) => ({ name: blook.name }))
                    }
                }
            });
        }
    }

    private async seedPackAmbiences(): Promise<void> {
        for (const ambience of packAmbiences) {
            const path = `{cdn}/content/packs/ambiences/${ambience}`;
            const packName = ambience.replace(".mp3", "");
            const pack = await this.prisma.pack.findUnique({
                where: { name: packName }
            });

            if (!pack) continue;

            let resource = await this.prisma.resource.findFirst({
                where: { path }
            });

            if (!resource) {
                resource = await this.prisma.resource.create({
                    data: { path }
                });
            }

            await this.prisma.pack.update({
                where: { name: packName },
                data: { ambienceId: resource.id }
            });
        }
    }

    private async seedGroups(): Promise<void> {
        for (const group of groups) {
            const reference = this.nameToReference(group.name, "GROUP");

            await this.prisma.group.upsert({
                where: { name: group.name },
                update: {
                    permissions: { set: group.permissions },
                    priority: group.priority,
                    image: {
                        upsert: {
                            create: {
                                path: group.image,
                                reference
                            },
                            update: {
                                path: group.image,
                                reference
                            }
                        }
                    }
                },
                create: {
                    name: group.name,
                    permissions: { set: group.permissions },
                    priority: group.priority,
                    image: {
                        create: {
                            path: group.image,
                            reference
                        }
                    }
                }
            });

            this.blacketLogger.info(`Seeded group: ${group.name}`, "Database", "Blacket");
        }
    }

    private async seedItems(): Promise<void> {
        for (const item of items) {
            const rarity = await this.prisma.rarity.findUnique({
                where: { name: item.rarity }
            });

            if (!rarity) {
                this.blacketLogger.warn(`Skipping item "${item.name}" because rarity "${item.rarity}" does not exist.`, "Database", "Blacket");
                continue;
            }

            const image = await this.upsertResource(this.nameToReference(item.name, "ITEM"), item.image);
            const itemData = {
                description: item.description,
                rarityId: rarity.id,
                imageId: image.id,
                canUse: item.canUse,
                canTrade: item.canTrade,
                canAuction: item.canAuction,
                type: item.type,
                boosterDuration: item.boosterDuration,
                boosterMultiplier: item.boosterMultiplier
            };

            await this.prisma.item.upsert({
                where: { name: item.name },
                update: itemData as unknown as Prisma.ItemUncheckedUpdateInput,
                create: {
                    name: item.name,
                    ...itemData
                } as unknown as Prisma.ItemUncheckedCreateInput
            });
        }
    }

    private async seedStores(): Promise<void> {
        for (const store of stores) {
            await this.prisma.store.upsert({
                where: { name: store.name },
                update: {
                    description: store.description,
                    priority: store.priority
                },
                create: store
            });
        }
    }

    private async seedProducts(): Promise<void> {
        for (const product of products) {
            const existingProduct = await this.prisma.product.findFirst({
                where: { name: product.name }
            });
            const imageReference = this.nameToReference(product.name, "PRODUCT");
            const reward = {
                type: product.rewards.type,
                quantity: product.rewards.quantity
            };

            if (product.rewards.blook) {
                Object.assign(reward, {
                    blook: {
                        connect: { name: product.rewards.blook }
                    }
                });
            }

            await this.prisma.product.upsert({
                where: { id: existingProduct?.id ?? 0 },
                update: {
                    name: product.name,
                    price: product.price,
                    color1: product.color1,
                    color2: product.color2,
                    isQuantityCapped: product.isQuantityCapped,
                    isPriceUsingCrystals: product.isPriceUsingCrystals ?? false,
                    subname: product.subname,
                    tag: product.tag,
                    subtag: product.subtag,
                    stores: {
                        connect: { name: product.store }
                    },
                    image: {
                        upsert: {
                            create: {
                                path: product.image,
                                reference: imageReference
                            },
                            update: {
                                path: product.image,
                                reference: imageReference
                            }
                        }
                    }
                },
                create: {
                    name: product.name,
                    price: product.price,
                    color1: product.color1,
                    color2: product.color2,
                    isQuantityCapped: product.isQuantityCapped,
                    isPriceUsingCrystals: product.isPriceUsingCrystals ?? false,
                    subname: product.subname,
                    tag: product.tag,
                    subtag: product.subtag,
                    stores: {
                        connect: { name: product.store }
                    },
                    image: {
                        create: {
                            path: product.image,
                            reference: imageReference
                        }
                    },
                    rewards: {
                        create: reward
                    }
                }
            });
        }
    }

    private async seedSubscriptions(): Promise<void> {
        for (const subscription of subscriptions) {
            const group = await this.prisma.group.findUnique({
                where: { name: subscription.group }
            });

            if (!group) {
                this.blacketLogger.warn(`Skipping subscription "${subscription.name}" because group "${subscription.group}" does not exist.`, "Database", "Blacket");
                continue;
            }

            const imageReference = this.nameToReference(subscription.name, "SUBSCRIPTION");

            await this.prisma.subscription.upsert({
                where: { stripeProductId: subscription.stripeProductId },
                update: {
                    name: subscription.name,
                    shortDescription: subscription.shortDescription,
                    stripeProductId: subscription.stripeProductId,
                    description: subscription.description,
                    monthlyPriceId: subscription.monthlyPriceId,
                    yearlyPriceId: subscription.yearlyPriceId,
                    lifetimePrice: subscription.lifetimePrice,
                    color1: subscription.color1,
                    color2: subscription.color2,
                    priority: subscription.priority,
                    group: { connect: { id: group.id } },
                    image: {
                        upsert: {
                            create: {
                                path: subscription.image,
                                reference: imageReference
                            },
                            update: {
                                path: subscription.image,
                                reference: imageReference
                            }
                        }
                    }
                },
                create: {
                    name: subscription.name,
                    stripeProductId: subscription.stripeProductId,
                    shortDescription: subscription.shortDescription,
                    description: subscription.description,
                    monthlyPriceId: subscription.monthlyPriceId,
                    yearlyPriceId: subscription.yearlyPriceId,
                    lifetimePrice: subscription.lifetimePrice,
                    color1: subscription.color1,
                    color2: subscription.color2,
                    priority: subscription.priority,
                    group: { connect: { id: group.id } },
                    image: {
                        create: {
                            path: subscription.image,
                            reference: imageReference
                        }
                    }
                }
            });
        }
    }

    private async upsertResource(reference: string, path: string) {
        return this.prisma.resource.upsert({
            where: { reference },
            update: { path },
            create: { reference, path }
        });
    }

    private nameToReference(name: string, type: string): string {
        return `${type.toUpperCase()}_${name.toUpperCase().replace(/ /g, "_")}`;
    }
}
