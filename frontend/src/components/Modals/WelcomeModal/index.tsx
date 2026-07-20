import { useState } from "react";
import { useModal } from "@stores/ModalStore/index";
import { Button } from "@components/index";
import ModalHeader from "../ModalHeader";
import ModalBody from "../ModalBody";
import ModalButtonContainer from "../ModalButtonContainer";

const STEPS = [
    {
        title: "Welcome!",
        body: `Welcome to ${import.meta.env.VITE_INFORMATION_NAME}! Before you dive in, a few quick things worth knowing.`
    },
    {
        title: "This is a self-hosted instance",
        body: "This is a self-hosted, fan-run copy of the game, set up independently. It's not the official site."
    },
    {
        title: "Not affiliated, not for profit",
        body: "We make no money from this instance, and we're not affiliated with, endorsed by, or working with the official Blacket team in any way."
    }
];

export default function WelcomeModal() {
    const { closeModal } = useModal();
    const [step, setStep] = useState<number>(0);

    const current = STEPS[step];
    const isLastStep = step === STEPS.length - 1;

    return (
        <>
            <ModalHeader>{current.title}</ModalHeader>
            <ModalBody>{current.body}</ModalBody>

            <ModalButtonContainer>
                {isLastStep
                    ? <Button.GenericButton onClick={closeModal}>Get Started</Button.GenericButton>
                    : <Button.GenericButton onClick={() => setStep((s) => s + 1)}>Next</Button.GenericButton>
                }
            </ModalButtonContainer>
        </>
    );
}
