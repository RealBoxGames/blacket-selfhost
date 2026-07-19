import { useModal } from "@stores/ModalStore/index";
import { Button, Modal } from "@components/index";
import { FriendsContainer } from ".";
import styles from "../dashboard.module.scss";

import { MobileFriendsModalProps } from "../dashboard.d";

export default function MobileFriendsModal({ onFriendClick }: MobileFriendsModalProps) {
    const { closeModal } = useModal();

    return (
        <>
            <Modal.ModalHeader>
                Friends

                <Button.GenericButton onClick={closeModal} className={styles.cosmeticsCloseButton}>
                    <i className="fas fa-times" />
                </Button.GenericButton>
            </Modal.ModalHeader>

            <div className={styles.mobileFriendsModalBody}>
                <FriendsContainer
                    isMobile={true}
                    onFriendClick={async (friend) => {
                        if (onFriendClick) onFriendClick(friend);
                        closeModal();
                    }}
                />
            </div>
        </>
    );
}
