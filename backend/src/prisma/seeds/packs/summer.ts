import type { PackSeed } from "../types";

export const summerPack: PackSeed = {
    name: "Summer",
    price: 25,
    imageReference: "PACK_SUMMER",
    imagePath: "{cdn}/content/packs/Summer.png",
    iconReference: "PACK_SUMMER_ICON",
    iconPath: "{cdn}/content/packs/icons/MiningTiled.png",
    backgroundReference: "PACK_SUMMER_BACKGROUND",
    backgroundPath: "{cdn}/content/blooks/backgrounds/Summer.png",
    blooks: [
        { name: "Sand Bucket", rarity: "Uncommon", price: 5, chance: 14.5 },
        { name: "Beach Ball", rarity: "Uncommon", price: 5, chance: 14.5 },
        { name: "Toy Shovel", rarity: "Uncommon", price: 5, chance: 14.5 },
        { name: "Popsicle", rarity: "Uncommon", price: 5, chance: 14.5 },
        { name: "Life Float", rarity: "Rare", price: 20, chance: 8 },
        { name: "Conch Shell", rarity: "Rare", price: 20, chance: 8 },
        { name: "Surfboard", rarity: "Epic", price: 75, chance: 3.1 },
        { name: "Sand Castle", rarity: "Legendary", price: 200, chance: 0.4 },
        {
            name: "Coconut Cocktail",
            rarity: "Supreme",
            price: 350,
            chance: 0.03
        },
        {
            name: "Tropical Pig",
            rarity: "Mythical",
            price: 1000,
            chance: 0.004
        }
    ]
};
