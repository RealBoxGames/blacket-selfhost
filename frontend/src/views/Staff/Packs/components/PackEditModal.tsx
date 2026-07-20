import { useState } from "react";
import { useModal } from "@stores/ModalStore/index";
import { Modal, Input, Button, ErrorContainer, Dropdown, Toggle } from "@components/index";

import { Blook, Pack } from "@blacket/types";

import { useCreatePack } from "@controllers/staff/useCreatePack";
import { useUpdatePack } from "@controllers/staff/useUpdatePack";
import { useDeletePack } from "@controllers/staff/useDeletePack";
import { useCreateResource } from "@controllers/staff/useCreateResource";
import { useSetBlookPack } from "@controllers/staff/useSetBlookPack";

export default function PackEditModal({ pack, allBlooks, onSaved, onDeleted }: {
    pack?: Pack;
    allBlooks: Blook[];
    onSaved: (pack: Pack) => void;
    onDeleted?: (id: number) => void;
}) {
    const { closeModal } = useModal();

    const { createPack } = useCreatePack();
    const { updatePack } = useUpdatePack();
    const { deletePack } = useDeletePack();
    const { createResource } = useCreateResource();
    const { setBlookPack } = useSetBlookPack();

    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [deleteConfirming, setDeleteConfirming] = useState<boolean>(false);

    const [name, setName] = useState<string>(pack?.name ?? "");
    const [price, setPrice] = useState<string>(pack ? String(pack.price) : "0");
    const [imagePath, setImagePath] = useState<string>("");
    const [iconPath, setIconPath] = useState<string>("");
    const [backgroundPath, setBackgroundPath] = useState<string>("");
    const [enabled, setEnabled] = useState<boolean>(pack?.enabled ?? true);

    const [packBlooks, setPackBlooks] = useState<{ id: number; name: string }[]>(pack?.blook?.map((b) => ({ id: b.id, name: b.name })) ?? []);
    const [addBlookId, setAddBlookId] = useState<number | null>(null);

    const resolveResourceId = async (path: string): Promise<number | undefined> => {
        if (path.trim() === "") return undefined;

        const res = await createResource(path.trim());

        return res.data.id;
    };

    const submit = async () => {
        if (name.trim() === "") return setError("Name is required.");
        if (!pack && imagePath.trim() === "") return setError("An image path is required.");
        if (!pack && iconPath.trim() === "") return setError("An icon path is required.");
        if (!pack && backgroundPath.trim() === "") return setError("A background path is required.");

        setLoading(true);
        setError("");

        try {
            const imageId = await resolveResourceId(imagePath);
            const iconId = await resolveResourceId(iconPath);
            const backgroundId = await resolveResourceId(backgroundPath);

            const payload = {
                name,
                price: Number(price),
                ...(imageId !== undefined ? { imageId } : {}),
                ...(iconId !== undefined ? { iconId } : {}),
                ...(backgroundId !== undefined ? { backgroundId } : {}),
                enabled
            };

            const res = pack
                ? await updatePack(pack.id, payload)
                : await createPack(payload as any);

            onSaved(res.data);
            closeModal();
        } catch (res: any) {
            setError(res?.data?.message ?? "Failed to save pack.");
        } finally {
            setLoading(false);
        }
    };

    const submitDelete = () => {
        if (!pack) return;
        if (!deleteConfirming) return setDeleteConfirming(true);

        setLoading(true);
        setError("");

        deletePack(pack.id)
            .then(() => {
                onDeleted?.(pack.id);
                closeModal();
            })
            .catch((res) => setError(res.data?.message ?? "Failed to delete pack. Remove its blooks first."))
            .finally(() => setLoading(false));
    };

    const addBlook = () => {
        if (!pack || addBlookId === null) return;

        setLoading(true);
        setError("");

        setBlookPack(addBlookId, pack.id)
            .then((res) => setPackBlooks((current) => [...current, { id: res.data.id, name: res.data.name }]))
            .catch((res) => setError(res.data?.message ?? "Failed to add blook to pack."))
            .finally(() => setLoading(false));
    };

    const removeBlook = (blookId: number) => {
        setLoading(true);
        setError("");

        setBlookPack(blookId, null)
            .then(() => setPackBlooks((current) => current.filter((b) => b.id !== blookId)))
            .catch((res) => setError(res.data?.message ?? "Failed to remove blook from pack."))
            .finally(() => setLoading(false));
    };

    const availableBlooks = allBlooks.filter((b) => !packBlooks.some((pb) => pb.id === b.id));

    return (
        <>
            <Modal.ModalHeader>{pack ? `Edit ${pack.name}` : "Create Pack"}</Modal.ModalHeader>

            <Modal.ModalBody>
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />

                <Input placeholder={pack ? "New image path (leave blank to keep current)" : "Image path, e.g. {cdn}/content/packs/Foo.png"} value={imagePath} onChange={(e) => setImagePath(e.target.value)} />
                <Input placeholder={pack ? "New icon path (leave blank to keep current)" : "Icon path"} value={iconPath} onChange={(e) => setIconPath(e.target.value)} />
                <Input placeholder={pack ? "New background path (leave blank to keep current)" : "Background path"} value={backgroundPath} onChange={(e) => setBackgroundPath(e.target.value)} />

                <Toggle checked={enabled} onClick={() => setEnabled((s) => !s)}>Enabled</Toggle>
            </Modal.ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer loading={loading}>
                <Button.GenericButton onClick={submit}>{pack ? "Save" : "Create"}</Button.GenericButton>
                {pack && <Button.GenericButton onClick={submitDelete}>{deleteConfirming ? "Confirm Delete" : "Delete"}</Button.GenericButton>}
                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>

            {pack && <>
                <Modal.ModalBody>
                    <div style={{ fontWeight: "bold", marginBottom: 5 }}>Blooks in this pack</div>

                    {packBlooks.map((b) => <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span>{b.name}</span>
                        <Button.GenericButton onClick={() => removeBlook(b.id)}>Remove</Button.GenericButton>
                    </div>)}

                    <Dropdown options={availableBlooks.map((b) => ({ label: b.name, value: b.id }))} onChange={(value) => setAddBlookId(value)} />
                </Modal.ModalBody>

                <Modal.ModalButtonContainer loading={loading}>
                    <Button.GenericButton onClick={addBlook}>Add Blook to Pack</Button.GenericButton>
                </Modal.ModalButtonContainer>
            </>}
        </>
    );
}
