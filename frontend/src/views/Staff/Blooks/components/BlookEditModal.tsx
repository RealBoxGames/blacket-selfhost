import { useState } from "react";
import { useModal } from "@stores/ModalStore/index";
import { Modal, Input, Button, ErrorContainer, Dropdown, Toggle } from "@components/index";

import { Blook, Pack, Rarity } from "@blacket/types";

import { useCreateBlook } from "@controllers/staff/useCreateBlook";
import { useUpdateBlook } from "@controllers/staff/useUpdateBlook";
import { useDeleteBlook } from "@controllers/staff/useDeleteBlook";
import { useCreateResource } from "@controllers/staff/useCreateResource";

export default function BlookEditModal({ blook, rarities, packs, onSaved, onDeleted }: {
    blook?: Blook;
    rarities: Rarity[];
    packs: Pack[];
    onSaved: (blook: Blook) => void;
    onDeleted?: (id: number) => void;
}) {
    const { closeModal } = useModal();

    const { createBlook } = useCreateBlook();
    const { updateBlook } = useUpdateBlook();
    const { deleteBlook } = useDeleteBlook();
    const { createResource } = useCreateResource();

    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [deleteConfirming, setDeleteConfirming] = useState<boolean>(false);

    const [name, setName] = useState<string>(blook?.name ?? "");
    const [description, setDescription] = useState<string>(blook?.description ?? "");
    const [rarityId, setRarityId] = useState<number | null>(blook?.rarityId ?? null);
    const [chance, setChance] = useState<string>(blook ? String(blook.chance) : "");
    const [price, setPrice] = useState<string>(blook ? String(blook.price) : "0");
    const [imagePath, setImagePath] = useState<string>("");
    const [backgroundPath, setBackgroundPath] = useState<string>("");
    const [packId, setPackId] = useState<number | null>(blook?.packId ?? null);
    const [isBig, setIsBig] = useState<boolean>(blook?.isBig ?? false);
    const [canSell, setCanSell] = useState<boolean>(blook?.canSell ?? true);
    const [canTrade, setCanTrade] = useState<boolean>(blook?.canTrade ?? true);
    const [canAuction, setCanAuction] = useState<boolean>(blook?.canAuction ?? true);

    const rarityOptions = rarities.map((r) => ({ label: r.name, value: r.id }));
    const packOptions = [{ label: "None", value: -1 }, ...packs.map((p) => ({ label: p.name, value: p.id }))];

    const resolveResourceId = async (path: string): Promise<number | undefined> => {
        if (path.trim() === "") return undefined;

        const res = await createResource(path.trim());

        return res.data.id;
    };

    const submit = async () => {
        if (name.trim() === "") return setError("Name is required.");
        if (rarityId === null) return setError("Pick a rarity.");
        if (!blook && imagePath.trim() === "") return setError("An image path is required.");
        if (!blook && backgroundPath.trim() === "") return setError("A background path is required.");

        setLoading(true);
        setError("");

        try {
            const imageId = await resolveResourceId(imagePath);
            const backgroundId = await resolveResourceId(backgroundPath);

            const payload = {
                name,
                description: description || undefined,
                chance: Number(chance),
                price: Number(price),
                rarityId,
                ...(imageId !== undefined ? { imageId } : {}),
                ...(backgroundId !== undefined ? { backgroundId } : {}),
                packId: packId ?? undefined,
                isBig,
                canSell,
                canTrade,
                canAuction
            };

            const res = blook
                ? await updateBlook(blook.id, payload)
                : await createBlook(payload as any);

            onSaved(res.data);
            closeModal();
        } catch (res: any) {
            setError(res?.data?.message ?? "Failed to save blook.");
        } finally {
            setLoading(false);
        }
    };

    const submitDelete = () => {
        if (!blook) return;
        if (!deleteConfirming) return setDeleteConfirming(true);

        setLoading(true);
        setError("");

        deleteBlook(blook.id)
            .then(() => {
                onDeleted?.(blook.id);
                closeModal();
            })
            .catch((res) => setError(res.data?.message ?? "Failed to delete blook."))
            .finally(() => setLoading(false));
    };

    return (
        <>
            <Modal.ModalHeader>{blook ? `Edit ${blook.name}` : "Create Blook"}</Modal.ModalHeader>

            <Modal.ModalBody>
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

                <Dropdown options={rarityOptions} onChange={(value) => setRarityId(value)} />

                <Input type="number" placeholder="Chance" value={chance} onChange={(e) => setChance(e.target.value)} />
                <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />

                <Input placeholder={blook ? "New image path (leave blank to keep current)" : "Image path, e.g. {cdn}/content/blooks/Foo.png"} value={imagePath} onChange={(e) => setImagePath(e.target.value)} />
                <Input placeholder={blook ? "New background path (leave blank to keep current)" : "Background path"} value={backgroundPath} onChange={(e) => setBackgroundPath(e.target.value)} />

                <Dropdown options={packOptions} onChange={(value) => setPackId(value === -1 ? null : value)} />

                <Toggle checked={isBig} onClick={() => setIsBig((s) => !s)}>Big</Toggle>
                <Toggle checked={canSell} onClick={() => setCanSell((s) => !s)}>Can Sell</Toggle>
                <Toggle checked={canTrade} onClick={() => setCanTrade((s) => !s)}>Can Trade</Toggle>
                <Toggle checked={canAuction} onClick={() => setCanAuction((s) => !s)}>Can Auction</Toggle>
            </Modal.ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer loading={loading}>
                <Button.GenericButton onClick={submit}>{blook ? "Save" : "Create"}</Button.GenericButton>
                {blook && <Button.GenericButton onClick={submitDelete}>{deleteConfirming ? "Confirm Delete" : "Delete"}</Button.GenericButton>}
                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}
