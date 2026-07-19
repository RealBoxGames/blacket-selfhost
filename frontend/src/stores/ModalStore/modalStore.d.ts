import { CSSProperties, ReactNode } from "react";

export interface ModalExtraProps {
    outsideModal?: ReactNode;
    fullscreen?: boolean;
    containerStyles?: CSSProperties;
}

export interface Modals {
    id: string;
    modal: ReactNode;
    props?: ModalExtraProps;
}

export interface ModalStore {
    modals: Modals[];
    setModals: (modals: Modals[]) => void;
    createModal: (modal: ReactNode, props?: ModalExtraProps) => string;
    closeModal: () => void;
    closing: boolean;
    setClosing: (closing: boolean) => void;
}
