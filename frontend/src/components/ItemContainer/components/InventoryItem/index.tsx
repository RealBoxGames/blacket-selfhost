import { useResource } from "@stores/ResourceStore/index";
import { useData } from "@stores/DataStore/index";
import Blook from "../../../Blook/index";
import stylesNormal from "./inventoryItem.module.scss";
import stylesVh from "./inventoryItemVh.module.scss";

import { InventoryItemProps } from "./inventoryItem.d";

export default function InventoryItem({ blook, item, shiny = false, locked = false, amount = 0, selectable = true, useVhStyles = false, ...props }: InventoryItemProps) {
    const { resourceIdToPath } = useResource();
    const { blooks, items, rarities } = useData();

    if (!blook && !item) return null;

    const data = blook ? blooks.find((b) => b.id === blook.blookId) : items.find((i) => i.id === item?.itemId);
    if (!data) return null;

    const rarity = rarities.find((r) => r.id === data.rarityId);
    if (!rarity) return null;

    const styles = useVhStyles ? stylesVh : stylesNormal;

    return (
        <div
            data-locked={locked}
            data-selectable={selectable}
            className={styles.blook}
            data-square={!!item}
            {...props}
        >
            {!item ? <Blook
                className={styles.blookImage}
                src={resourceIdToPath(data.imageId)}
                alt={data.name}
                data-locked={locked}
                draggable={false}
                shiny={shiny}
                objectFit={"contain"}
            /> : <img
                src={resourceIdToPath(data.imageId)}
                className={styles.itemImage}
                alt={data.name}
                draggable={false}
            />}

            {!item ?
                (!locked && amount > 0 && <div
                    className={styles.blookQuantity}
                    style={{
                        backgroundColor: rarity.color
                    }}
                >
                    {rarity.color === "rainbow" && <div
                        className="rainbowOverlay"
                        style={{
                            maskImage: rarity.imageId ? `url(${resourceIdToPath(rarity.imageId)})` : undefined,
                            maskSize: "cover",
                            width: useVhStyles ? "2vh" : 20,
                            height: useVhStyles ? "2vh" : 20,
                            zIndex: 2
                        }}
                    />}
                    {rarity.imageId && <img
                        src={resourceIdToPath(rarity.imageId)}
                        className={styles.blookQuantityImage}
                    />}

                    <div className={styles.blookQuantityText}>{amount >= 99 ? "99+" : amount.toLocaleString()}</div>
                </div>
                ) : <div
                    className={styles.itemQuantity}
                >
                    x{amount.toLocaleString()}
                </div>
            }

            {item && <div className={styles.itemBackground}>
                <div
                    className={styles.itemBackgroundOverlay}
                    style={{
                        background:
                            rarity.color === "rainbow"
                                ? "linear-gradient(140deg, red, orange, yellow, green, blue, indigo, violet)"
                                : rarity.color,
                        maskImage: `url(${window.constructCDNUrl("/content/rarity-background.png")})`,
                        WebkitMaskImage: `url(${window.constructCDNUrl("/content/rarity-background.png")})`
                    }}
                />
            </div>}

            {locked && <i className={`${styles.blookLock} fas fa-lock`} />}
        </div>
    );
}
