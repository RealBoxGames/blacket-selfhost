import { useState } from "react";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useBuyFromItemShop } from "@controllers/market/useBuyFromItemShop";
import { Modal, Button, ErrorContainer, ImageOrVideo } from "@components/index";

import { ItemShopItemTypeEnum, ItemShop } from "@blacket/types";

function getErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "data" in err) {
        return (err as { data?: { message?: string } }).data?.message ?? "Something went wrong.";
    }

    return "Something went wrong.";
}

export default function PurchaseItemShopModal({ itemShop }: { itemShop: ItemShop }) {
    const { user, setUser } = useUser();
    const { items, blooks, banners, titles, fonts } = useData();
    const { resourceIdToPath } = useResource();
    const { closeModal } = useModal();
    const { buyFromItemShop } = useBuyFromItemShop();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    if (!user) return null;

    let normalItem;
    let textItem;

    switch (itemShop.type) {
        case ItemShopItemTypeEnum.ITEM:
            normalItem = items.find((item) => item.id === itemShop.itemId);
            break;
        case ItemShopItemTypeEnum.BLOOK:
            normalItem = blooks.find((blook) => blook.id === itemShop.blookId);
            break;
        case ItemShopItemTypeEnum.BANNER:
            normalItem = banners.find((banner) => banner.id === itemShop.bannerId);
            break;
        case ItemShopItemTypeEnum.TITLE:
            textItem = titles.find((title) => title.id === itemShop.titleId);
            break;
        case ItemShopItemTypeEnum.FONT:
            textItem = fonts.find((font) => font.id === itemShop.fontId);
            break;
    }

    const itemName = normalItem?.name ?? textItem?.name ?? "Item";
    const canAfford = user.tokens >= itemShop.price;

    const purchase = () => {
        if (!canAfford) return setError("You don't have enough tokens for this.");

        setLoading(true);
        setError("");

        buyFromItemShop(itemShop.id)
            .then(() => {
                setUser({ ...user, tokens: user.tokens - itemShop.price });
                closeModal();
            })
            .catch((err) => {
                setError(getErrorMessage(err));
                setLoading(false);
            });
    };

    return (
        <>
            <Modal.ModalHeader>Purchase {itemName}</Modal.ModalHeader>

            <Modal.ModalBody style={{ flexDirection: "column", gap: 10, alignItems: "center" }}>
                {normalItem && <ImageOrVideo src={resourceIdToPath(normalItem.imageId)} style={{ width: 80, height: 80, objectFit: "contain" }} />}

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <img src={window.constructCDNUrl("/content/token.png")} style={{ width: 18, height: 18 }} />
                    {itemShop.price.toLocaleString()} tokens
                </div>

                {!canAfford && <div style={{ color: "var(--error-color, #F54242)" }}>You don't have enough tokens for this yet.</div>}
            </Modal.ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer loading={loading}>
                <Button.GenericButton onClick={purchase} disabled={!canAfford || loading}>Confirm Purchase</Button.GenericButton>
                <Button.GenericButton onClick={closeModal}>Cancel</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}
