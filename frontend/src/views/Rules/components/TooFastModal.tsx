import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "@components/index";
import { useModal } from "@stores/ModalStore/index";
import { formatTimePassed } from "@functions/blacket/formatTime";

import { TooFastModalProps } from "../rules.d";

export default function TooFastModal({ startedReading, submitCallback }: TooFastModalProps) {
    const { closeModal } = useModal();

    const [timeRemainingString, setTimeRemainingString] = useState<string>("");
    const [canProceed, setCanProceed] = useState(false);

    useEffect(() => {
        let active = true;

        const tick = () => {
            if (!active) return;

            setTimeRemainingString(formatTimePassed(startedReading));

            setTimeout(tick, 1000);
        };

        tick();

        return () => {
            active = false;
        };
    }, [startedReading]);

    useEffect(() => {
        const timer = setTimeout(() => setCanProceed(true), 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Modal.ModalHeader>Too Fast</Modal.ModalHeader>

            <Modal.ModalBody>
                You've only read the rules for {timeRemainingString}. Are you sure?
                <br />
                <br />
                Violating these rules even unknowingly can result in a permanent ban.
                <br />
                Please make sure you understand what you're agreeing to.
            </Modal.ModalBody>

            {<Modal.ModalButtonContainer>
                <Button.GenericButton
                    style={{
                        pointerEvents: !canProceed ? "none" : undefined,
                        opacity: !canProceed ? 0.5 : 1
                    }}
                    onClick={() => {
                        submitCallback();
                        closeModal();
                    }}
                >
                    I Agree
                </Button.GenericButton>
                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>}
        </>
    );
}
