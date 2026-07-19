import type { PackSeed } from "../types";

export const spacePack: PackSeed = {
    name: "Space",
    price: 25,
    imageReference: "PACK_SPACE",
    imagePath: "{cdn}/content/packs/Space.png",
    iconReference: "PACK_SPACE_ICON",
    iconPath: "{cdn}/content/packs/icons/MiningTiled.png",
    backgroundReference: "PACK_SPACE_BACKGROUND",
    backgroundPath: "{cdn}/content/blooks/backgrounds/Space.png",
    blooks: [
        { name: "Earth", rarity: "Uncommon", price: 5, chance: 18.75 },
        { name: "Meteor", rarity: "Uncommon", price: 5, chance: 18.75 },
        { name: "Stars", rarity: "Uncommon", price: 5, chance: 18.75 },
        { name: "Alien", rarity: "Uncommon", price: 5, chance: 18.75 },
        { name: "Planet", rarity: "Rare", price: 20, chance: 10 },
        { name: "UFO", rarity: "Rare", price: 20, chance: 10 },
        { name: "Spaceship", rarity: "Epic", price: 75, chance: 4.5 },
        { name: "Astronaut", rarity: "Legendary", price: 200, chance: 0.45 },
        { name: "Pink Astronaut", rarity: "Chroma", price: 300, chance: 0.05 },
        { name: "Red Astronaut", rarity: "Chroma", price: 300, chance: 0.05 },
        {
            name: "Orange Astronaut",
            rarity: "Chroma",
            price: 300,
            chance: 0.05
        },
        {
            name: "Yellow Astronaut",
            rarity: "Chroma",
            price: 300,
            chance: 0.05
        },
        { name: "Lime Astronaut", rarity: "Chroma", price: 300, chance: 0.05 },
        { name: "Green Astronaut", rarity: "Chroma", price: 300, chance: 0.05 },
        { name: "Cyan Astronaut", rarity: "Chroma", price: 300, chance: 0.05 },
        { name: "Blue Astronaut", rarity: "Chroma", price: 300, chance: 0.05 },
        {
            name: "Purple Astronaut",
            rarity: "Chroma",
            price: 300,
            chance: 0.05
        },
        { name: "Brown Astronaut", rarity: "Chroma", price: 300, chance: 0.05 },
        { name: "Black Astronaut", rarity: "Chroma", price: 300, chance: 0.05 },
        { name: "Moon", rarity: "Supreme", price: 350, chance: 0.02 },
        { name: "Space Terminal", rarity: "Supreme", price: 350, chance: 0.01 },
        {
            name: "Tim the Alien",
            rarity: "Mythical",
            price: 1000,
            chance: 0.005
        },
        {
            name: "Supernova",
            rarity: "Iridescent",
            price: 250000,
            chance: 0.0001,
            isBig: true,
            video: {
                reference: "VIDEO_SUPERNOVA",
                path: "{cdn}/content/video/black-hole.mp4",
                length: 54000
            }
        },
        { name: "Balloon Cat", rarity: "Unique", price: 500, chance: 0 }
    ]
};
