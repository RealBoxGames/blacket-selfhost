import { RarityAnimationType } from "@blacket/core";

export const initialRarities = [
    {
        name: "Common",
        color: "#ffffff",
        experience: 0,
        animationType: RarityAnimationType.COMMON,
        imageReference: "COMMON_ICON",
        priority: 0
    },
    {
        name: "Uncommon",
        color: "#29e629",
        experience: 1,
        animationType: RarityAnimationType.COMMON,
        imageReference: "UNCOMMON_ICON",
        priority: 1
    },
    {
        name: "Rare",
        color: "#0000ff",
        experience: 5,
        animationType: RarityAnimationType.RARE,
        imageReference: "RARE_ICON",
        priority: 2
    },
    {
        name: "Epic",
        color: "#8000ff",
        experience: 25,
        animationType: RarityAnimationType.EPIC,
        imageReference: "EPIC_ICON",
        priority: 3
    },
    {
        name: "Legendary",
        color: "#ffaf0f",
        experience: 100,
        animationType: RarityAnimationType.LEGENDARY,
        imageReference: "LEGENDARY_ICON",
        priority: 4
    },
    {
        name: "Chroma",
        color: "#00ccff",
        experience: 250,
        animationType: RarityAnimationType.CHROMA,
        imageReference: "CHROMA_ICON",
        priority: 5
    },
    {
        name: "Supreme",
        color: "#be0000",
        experience: 250,
        animationType: RarityAnimationType.CHROMA,
        imageReference: "SUPREME_ICON",
        priority: 6
    },
    {
        name: "Unique",
        color: "#008080",
        experience: 250,
        animationType: RarityAnimationType.CHROMA,
        imageReference: "UNIQUE_ICON",
        priority: 7
    },
    {
        name: "Mythical",
        color: "#ff75ff",
        experience: 1000,
        animationType: RarityAnimationType.MYTHICAL,
        imageReference: "MYTHICAL_ICON",
        priority: 8
    },
    {
        name: "Secret",
        color: "#000000",
        experience: 5000,
        animationType: RarityAnimationType.MYTHICAL,
        imageReference: "SECRET_ICON",
        priority: 9
    },
    {
        name: "Iridescent",
        color: "rainbow",
        experience: 100000,
        animationType: RarityAnimationType.MYTHICAL,
        imageReference: "IRIDESCENT_ICON",
        priority: 10
    }
];
