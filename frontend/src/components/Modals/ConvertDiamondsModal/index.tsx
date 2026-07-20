import { useState } from "react";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useConvertDiamonds } from "@controllers/market/useConvertDiamonds";
import { Input, ErrorContainer } from "@components/index";
import ModalHeader from "../ModalHeader";
import ModalBody from "../ModalBody";
import ModalButtonContainer from "../ModalButtonContainer";
import { GenericButton } from "@components/Buttons";
import styles from "./convertDiamondsModal.module.scss";

const DIAMONDS_PER_CRYSTAL = 100;
const TOKENS_PER_DIAMOND = 3;

function getErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "data" in err) {
        return (err as { data?: { message?: string } }).data?.message ?? "Something went wrong.";
    }

    return "Something went wrong.";
}

export default function ConvertDiamondsModal() {
    const { user } = useUser();
    const { closeModal } = useModal();
    const { convertToTokens, convertToCrystals } = useConvertDiamonds();

    const [amount, setAmount] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    if (!user) return null;

    const parsedAmount = parseInt(amount) || 0;

    const convert = (fn: (dto: { amount: number }) => Promise<unknown>) => {
        if (parsedAmount < 1) return setError("Enter an amount of diamonds to convert.");
        if (parsedAmount > user.diamonds) return setError("You do not have that many diamonds.");

        setLoading(true);
        setError("");

        fn({ amount: parsedAmount })
            .then(() => closeModal())
            .catch((err) => {
                setError(getErrorMessage(err));
                setLoading(false);
            });
    };

    return (
        <>
            <ModalHeader>Convert Diamonds</ModalHeader>

            <ModalBody style={{ flexDirection: "column", gap: 10 }}>
                <div>You have {user.diamonds.toLocaleString()} diamonds.</div>

                <Input
                    value={amount}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value !== "" && value.match(/[^0-9]/)) return;

                        setAmount(value);
                        setError("");
                    }}
                    placeholder="Amount of diamonds"
                    autoComplete="off"
                />

                <div className={styles.previewRow}>
                    <span>= {(parsedAmount * TOKENS_PER_DIAMOND).toLocaleString()} tokens</span>
                    <span>= {Math.floor(parsedAmount / DIAMONDS_PER_CRYSTAL).toLocaleString()} crystals</span>
                </div>
            </ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <ModalButtonContainer loading={loading}>
                <GenericButton onClick={() => convert(convertToTokens)}>Convert to Tokens</GenericButton>
                <GenericButton onClick={() => convert(convertToCrystals)}>Convert to Crystals</GenericButton>
                <GenericButton onClick={closeModal}>Cancel</GenericButton>
            </ModalButtonContainer>
        </>
    );
}
