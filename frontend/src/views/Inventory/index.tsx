import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Textfit from "react-textfit";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useLocalStorageState } from "@functions/core/hooks/useLocalStorageState";
import { useExistCount } from "@controllers/inventory/useExistCount/index";
import { useRecentAveragePrice } from "@controllers/inventory/useRecentAveragePrice/index";
import { Blook, Button, ItemContainer, Markdown, PageHeader, RarityLabel, SearchBox } from "@components/index";
import { Info, SellBlooksModal, AuctionModal, BoosterModal } from "./components/index";
import styles from "./inventory.module.scss";

import { SelectedTypeEnum, SortDirection, SortField } from "@components/ItemContainer/itemContainer.d";
import { AuctionTypeEnum, Blook as BlookType, Item as ItemType, ItemTypeEnum, Rarity, UserBlook, UserItem } from "@blacket/types";

// TODO: make sure this caches
type InventoryFilter = "all" | "blooks" | "items";

export default function Inventory() {
    const { user, getBlookAmount } = useUser();
    if (!user) return <Navigate to="/login" />;

    const { blooks, items, rarities } = useData();
    const { resourceIdToPath } = useResource();
    const { createModal } = useModal();
    const { getExistCount } = useExistCount();
    const { getRecentAveragePrice } = useRecentAveragePrice();

    const [selectedType, setSelectedType] = useState<SelectedTypeEnum | null>(null);
    const [selected, setSelected] = useState<UserBlook | UserItem | null>(null);

    const [showLocked, setShowLocked] = useLocalStorageState<boolean>("inventory:showLocked", false);
    const [searchQuery, setSearchQuery] = useLocalStorageState<string>("inventory:searchQuery", "");
    const [filter, setFilter] = useLocalStorageState<InventoryFilter>("inventory:filter", "all");

    const [blook, setBlook] = useState<BlookType | null>(null);
    const [item, setItem] = useState<ItemType | null>(null);
    const [rarity, setRarity] = useState<Rarity | null>(null);
    const [description, setDescription] = useState<string>("");
    const [existCount, setExistCount] = useState<number | null | undefined>(undefined);
    const [recentAveragePrice, setRecentAveragePrice] = useState<number | null | undefined>(undefined);

    useEffect(() => {
        switch (selectedType) {
            case SelectedTypeEnum.BLOOK:
                const blook = blooks.find((b) => b.id === (selected as UserBlook)?.blookId);
                if (!blook) return setBlook(null);

                const rarityOfBlook = rarities.find((r) => r.id === blook?.rarityId) || null;
                if (!rarityOfBlook) return setBlook(null);

                setBlook(blook);
                setRarity(rarityOfBlook);
                setDescription(blook?.description || "No description available for this blook.");
                break;
            case SelectedTypeEnum.ITEM:
                const item = items.find((i) => i.id === (selected as UserItem)?.itemId);
                if (!item) return setItem(null);

                const rarityOfItem = rarities.find((r) => r.id === item?.rarityId) || null;
                if (!rarityOfItem) return setItem(null);

                setItem(item);
                setRarity(rarityOfItem);
                setDescription(item?.description || "No description available for this item.");
                break;
            default:
                setBlook(null);
                setItem(null);
                setRarity(null);
                setDescription("");
        }
    }, [selected]);

    useEffect(() => {
        if (!selected) {
            setExistCount(undefined);
            return;
        }

        let isCurrentSelection = true;

        const countPromise = selectedType === SelectedTypeEnum.BLOOK && blook
            ? getExistCount("BLOOK", blook.id, (selected as UserBlook).shiny)
            : selectedType === SelectedTypeEnum.ITEM && item
                ? getExistCount("ITEM", item.id)
                : null;

        if (!countPromise) {
            setExistCount(undefined);
            return;
        }

        setExistCount(undefined);
        countPromise
            .then((res) => {
                if (isCurrentSelection) setExistCount(res.data.count);
            })
            .catch(() => {
                if (isCurrentSelection) setExistCount(null);
            });

        return () => {
            isCurrentSelection = false;
        };
    }, [blook, item, selected, selectedType]);

    useEffect(() => {
        if (!selected) {
            setRecentAveragePrice(undefined);
            return;
        }

        let isCurrentSelection = true;

        const pricePromise = selectedType === SelectedTypeEnum.BLOOK && blook
            ? getRecentAveragePrice({
                type: AuctionTypeEnum.BLOOK,
                blookId: blook.id,
                shiny: (selected as UserBlook).shiny
            })
            : selectedType === SelectedTypeEnum.ITEM && item
                ? getRecentAveragePrice({
                    type: AuctionTypeEnum.ITEM,
                    itemId: item.id
                })
                : null;

        if (!pricePromise) {
            setRecentAveragePrice(undefined);
            return;
        }

        setRecentAveragePrice(undefined);
        pricePromise
            .then((res) => {
                if (isCurrentSelection) setRecentAveragePrice(res.data.averagePrice);
            })
            .catch(() => {
                if (isCurrentSelection) setRecentAveragePrice(null);
            });

        return () => {
            isCurrentSelection = false;
        };
    }, [blook, item, selected, selectedType]);

    const getLowestSerialBlook = (blookId: number, shiny: boolean): number | null => {
        const blooks = user.blooks
            .filter((b) => b.blookId === blookId && b.shiny === shiny)
            .sort((a, b) => (a.serial ?? 0) - (b.serial ?? 0));
        if (blooks.length === 0) return null;

        if (blooks[0].serial === null) return null;
        else return blooks[0].serial;
    };

    const getHighestSerialBlook = (blookId: number, shiny: boolean): number | null => {
        const blooks = user.blooks
            .filter((b) => b.blookId === blookId && b.shiny === shiny)
            .sort((a, b) => (b.serial ?? 0) - (a.serial ?? 0));
        if (blooks.length === 0) return null;

        if (blooks[0].serial === null) return null;
        else return blooks[0].serial;
    };

    const getExistCountLabel = (): string => {
        if (existCount === undefined) return "Loading...";

        return existCount?.toLocaleString() ?? "N/A";
    };

    const getRecentAveragePriceLabel = (): string => {
        if (recentAveragePrice === undefined) return "Loading...";

        return recentAveragePrice?.toLocaleString() ?? "N/A";
    };

    return (
        <>
            {window.innerWidth > 768 && <PageHeader>Inventory</PageHeader>}

            <div
                className={styles.leftSide}
            >
                <SearchBox
                    noPadding={true}
                    placeholder={`Search ${filter === "all" ? "inventory" : filter}...`}
                    value={searchQuery}
                    buttons={[
                        {
                            icon: filter === "all" ? "fas fa-layer-group" : filter === "blooks" ? "fas fa-user" : "fas fa-box",
                            tooltip: filter === "all" ? "Showing All" : filter === "blooks" ? "Showing Blooks" : "Showing Items",
                            onClick: () => {
                                if (filter === "all") setFilter("blooks");
                                else if (filter === "blooks") setFilter("items");
                                else setFilter("all");
                            }
                        },
                        {
                            icon: showLocked ? "fas fa-lock-open" : "fas fa-lock",
                            tooltip: "Show Locked Items",
                            onClick: () => setShowLocked(!showLocked)
                        },
                        {
                            icon: "fas fa-times",
                            tooltip: "Reset Search",
                            onClick: () => setSearchQuery("")
                        }
                    ]}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <ItemContainer
                    user={user}
                    options={{
                        showItems: filter !== "blooks",
                        showBlooks: filter !== "items",
                        showShiny: true,
                        showLocked: showLocked,
                        showPacks: true,

                        searchQuery: searchQuery
                    }}
                    onClick={(item) => {
                        if (item.type !== selectedType) {
                            setBlook(null);
                            setItem(null);
                            setRarity(null);
                            setDescription("");
                        }

                        setSelectedType(item.type);
                        setSelected(item.item || null);
                    }}
                />
            </div>

            {selected && (blook || item) && rarity && <div className={styles.rightSide}>
                <div className={styles.backgroundImageM}>
                    <img
                        src={
                            selectedType === SelectedTypeEnum.BLOOK
                                ? resourceIdToPath(blook?.backgroundId)
                                : window.constructCDNUrl("/content/blooks/backgrounds/Default.png")
                        }
                        draggable={false}
                    />
                </div>

                <div className={styles.top}>
                    <div className={styles.topBackgroundImage}>
                        <img
                            src={
                                selectedType === SelectedTypeEnum.BLOOK
                                    ? resourceIdToPath(blook?.backgroundId)
                                    : window.constructCDNUrl("/content/blooks/backgrounds/Default.png")
                            }
                            draggable={false}
                        />
                    </div>

                    <div className={styles.itemContainerM}>
                        <div className={styles.basicInfoM}>
                            <Textfit className={styles.itemNameM} mode="single" min={0} max={40}>
                                {selectedType === SelectedTypeEnum.BLOOK
                                    ? `${(selected as UserBlook).shiny ? "Shiny " : ""}${blook?.name}`
                                    : item?.name
                                }
                            </Textfit>

                            <Textfit className={styles.itemDescriptionM} mode="multi" min={0} max={20}>
                                <Markdown>
                                    {description}
                                </Markdown>
                            </Textfit>
                        </div>

                        <div className={styles.itemImageContainerM}>
                            <Blook
                                src={
                                    selectedType === SelectedTypeEnum.BLOOK
                                        ? resourceIdToPath(blook?.imageId)
                                        : resourceIdToPath(item?.imageId)
                                }
                                className={styles.itemImageM}
                                shiny={selectedType === SelectedTypeEnum.BLOOK && (selected as UserBlook).shiny}
                                big={selectedType === SelectedTypeEnum.BLOOK ? blook?.isBig : false}
                            />
                        </div>
                    </div>

                    <div className={styles.itemContainer}>
                        <div className={styles.itemImageContainer}>
                            <Blook
                                src={
                                    selectedType === SelectedTypeEnum.BLOOK
                                        ? resourceIdToPath(blook?.imageId)
                                        : resourceIdToPath(item?.imageId)
                                }
                                className={styles.itemImage}
                                shiny={selectedType === SelectedTypeEnum.BLOOK && (selected as UserBlook).shiny}
                                big={selectedType === SelectedTypeEnum.BLOOK ? blook?.isBig : false}
                            />
                        </div>

                        <div className={styles.basicInfo}>
                            <Textfit className={styles.itemName} mode="single" min={0} max={1000}>
                                {selectedType === SelectedTypeEnum.BLOOK
                                    ? blook?.name
                                    : item?.name
                                }
                            </Textfit>

                            <div className={styles.rarityLabelContainer}>
                                <div className={styles.rarityLabel}>
                                    <RarityLabel text={rarity.name} backgroundColor={rarity.color} />
                                </div>
                                {(selected as UserBlook).shiny && <>
                                    <div className={styles.rarityDivider} />

                                    <div className={styles.rarityLabel}>
                                        <RarityLabel text={"Shiny"} backgroundColor={"shiny"} />
                                    </div>
                                </>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <Textfit className={styles.description} mode="multi" min={0} max={1000}>
                        <Markdown>
                            {description}
                        </Markdown>
                    </Textfit>

                    <div className={styles.infoContainer}>

                        {blook && selectedType === SelectedTypeEnum.BLOOK ? <Info
                            name="Amount"
                            icon="fas fa-hashtag"
                        >
                            {getBlookAmount(blook.id, (selected as UserBlook).shiny)}
                        </Info> : item && <Info
                            name="Uses Left"
                            icon="fas fa-hashtag"
                        >
                            {(selected as UserItem).usesLeft}
                        </Info>}

                        {item && selectedType === SelectedTypeEnum.ITEM && <>
                            <Info
                                name="Usable"
                                icon="fas fa-hand-pointer"
                            >
                                {item.canUse ? "Yes" : "No"}
                            </Info>

                            <Info
                                name="Tradable"
                                icon="fas fa-scale-balanced"
                            >
                                {item.canTrade ? "Yes" : "No"}
                            </Info>

                            <Info
                                name="Auctionable"
                                icon="fas fa-building-columns"
                            >
                                {item.canAuction ? "Yes" : "No"}
                            </Info>
                        </>}

                        {blook && selectedType === SelectedTypeEnum.BLOOK && <Info
                            name="Chance"
                            icon="fas fa-percentage"
                        >
                            {blook.chance / ((selected as UserBlook).shiny ? 100 : 1)}%
                        </Info>}

                        {blook && selectedType === SelectedTypeEnum.BLOOK && <Info
                            name="Sell Price"
                            icon="fas fa-dollar-sign"
                        >
                            {blook.price * ((selected as UserBlook).shiny ? 10 : 1)}
                        </Info>}

                        {blook && selectedType === SelectedTypeEnum.BLOOK && <Info
                            name="Lowest Serial"
                            icon="fas fa-arrow-down-1-9"
                        >
                            {
                                getLowestSerialBlook(blook.id, (selected as UserBlook).shiny) !== null
                                    ? `#${getLowestSerialBlook(blook.id, (selected as UserBlook).shiny)}`
                                    : "V2 Blook (N/A)"
                            }
                        </Info>}
                        {blook && selectedType === SelectedTypeEnum.BLOOK && <Info
                            name="Highest Serial"
                            icon="fas fa-arrow-up-1-9"
                        >
                            {
                                getHighestSerialBlook(blook.id, (selected as UserBlook).shiny) !== null
                                    ? `#${getHighestSerialBlook(blook.id, (selected as UserBlook).shiny)}`
                                    : "V2 Blook (N/A)"
                            }
                        </Info>}

                        <Info
                            name="Recent Average Price"
                            icon="fas fa-gem"
                        >
                            {getRecentAveragePriceLabel()}
                        </Info>
                        <Info
                            name="Exist Count"
                            icon="fas fa-database"
                        >
                            {getExistCountLabel()}
                        </Info>

                    </div>

                    <div className={styles.actionsContainer}>
                        <div className={styles.actions}>
                            {selectedType === SelectedTypeEnum.BLOOK && <Button.GenericButton onClick={() => {
                                if (blook && selectedType === SelectedTypeEnum.BLOOK) {
                                    createModal(<SellBlooksModal blook={blook} shiny={(selected as UserBlook).shiny} />);
                                }
                            }}
                                icon="fas fa-gem"
                            >
                                Sell
                            </Button.GenericButton>}

                            {selectedType === SelectedTypeEnum.ITEM && item?.canUse && item.type === ItemTypeEnum.BOOSTER && <Button.GenericButton onClick={() => {
                                createModal(<BoosterModal booster={item} userItem={selected as UserItem} />);
                            }}
                                icon="fas fa-bolt"
                            >
                                Use
                            </Button.GenericButton>}

                            <Button.GenericButton onClick={() => {
                                if (blook && selectedType === SelectedTypeEnum.BLOOK) {
                                    createModal(<AuctionModal type={AuctionTypeEnum.BLOOK} blook={blook} shiny={(selected as UserBlook).shiny} />);
                                }
                                else if (item && selectedType === SelectedTypeEnum.ITEM) {
                                    createModal(<AuctionModal type={AuctionTypeEnum.ITEM} item={item} />);
                                }
                            }}
                                icon="fas fa-building-columns"
                            >
                                Auction
                            </Button.GenericButton>
                        </div>
                    </div>
                </div>
            </div>}
        </>
    );
}
