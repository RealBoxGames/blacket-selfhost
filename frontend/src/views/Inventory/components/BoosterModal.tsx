// TODO: make this pretty
import { useState } from "react";
import { Button, Modal } from "@components/index";
import { useModal } from "@stores/ModalStore/index";
import { useItem } from "@controllers/inventory/useItem";
import { BoosterModalProps } from "../inventory.d";

export default function BoosterModal({ booster, userItem }: BoosterModalProps) {
    const { closeModal } = useModal();
    const { useInventoryItem } = useItem();
    const [usingBooster, setUsingBooster] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const duration = formatBoosterDuration(booster.boosterDuration ?? 0);
    const multiplier = booster.boosterMultiplier ?? 3;
    const scope = booster.name.toLowerCase().includes("personal") ? "personal" : "global";
    const target = getBoosterTarget(booster.name);

    const handleUse = () => {
        setUsingBooster(true);
        setError(null);

        useInventoryItem({ userItemId: userItem.id })
            .then(closeModal)
            .catch((err) => setError(err?.data?.message || "Failed to use booster."))
            .finally(() => setUsingBooster(false));
    };

    return (
        <>
            <Modal.ModalHeader>
                {booster.name}
            </Modal.ModalHeader>

            <Modal.ModalBody>
                This will activate a {scope} {multiplier}x {target} booster
                {duration ? ` for ${duration}.` : "."}
                {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
            </Modal.ModalBody>

            <Modal.ModalButtonContainer>
                <Button.GenericButton onClick={usingBooster ? undefined : handleUse}>
                    {usingBooster ? "Using..." : "Use"}
                </Button.GenericButton>
                <Button.GenericButton onClick={closeModal}>Cancel</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}

function formatBoosterDuration(durationSeconds: number) {
    const totalMinutes = Math.floor(durationSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours} hour${hours === 1 ? "" : "s"} and ${minutes} minute${minutes === 1 ? "" : "s"}`;
    if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`;

    return "";
}

function getBoosterTarget(name: string) {
    const normalizedName = name.toLowerCase();

    if (normalizedName === "1 hour booster") return "chance and shiny";
    if (normalizedName.includes("shiny")) return "shiny";

    return "chance";
}
