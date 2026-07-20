import { useState } from "react";
import { useResource } from "@stores/ResourceStore/index";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { Button, Markdown, Modal, Textfit } from "@components/index";
import styles from "./subscription.module.scss";

import { UserSubscriptionStatusEnum } from "@blacket/types";
import { SubscriptionProps } from "../../store.d";

function getErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "data" in err) {
        return (err as { data?: { message?: string } }).data?.message ?? "Something went wrong.";
    }

    return "Something went wrong.";
}

function CurrencyPrice({ subscription }: { subscription: SubscriptionProps["subscription"] }) {
    return (
        <div className={styles.currencyPrice}>
            <span><img src={window.constructCDNUrl("/content/token.png")} /> {subscription.tokenPrice?.toLocaleString()}</span>
            <span><img src={window.constructCDNUrl("/content/diamond.png")} /> {subscription.diamondPrice?.toLocaleString()}</span>
            <span><img src={window.constructCDNUrl("/content/crystal.png")} /> {subscription.crystalPrice?.toLocaleString()}</span>
        </div>
    );
}

export default function Subscription({ subscription }: SubscriptionProps) {
    const { resourceIdToPath } = useResource();
    const { user, setUser } = useUser();
    const { createModal, closeModal } = useModal();
    const [purchasing, setPurchasing] = useState<boolean>(false);

    if (!user) return null;
    if (!subscription.tokenPrice || !subscription.diamondPrice || !subscription.crystalPrice) return null;

    const GRADIENT = {
        normal: `linear-gradient(${subscription.color1} 0%, ${subscription.color2} 100%)`,
        reverse: `linear-gradient(${subscription.color2} 0%, ${subscription.color1} 100%)`
    };

    const activeSubscription = user.subscriptions
        .find((userSubscription) =>
            [UserSubscriptionStatusEnum.ACTIVE, UserSubscriptionStatusEnum.PENDING_CANCELLATION].includes(userSubscription.status as UserSubscriptionStatusEnum) &&
            (!userSubscription.expiresAt || new Date(userSubscription.expiresAt) > new Date())
        );
    const isCurrentPlan = activeSubscription?.subscriptionId === subscription.id;

    const canAfford = user.tokens >= subscription.tokenPrice && user.diamonds >= subscription.diamondPrice && user.crystals >= subscription.crystalPrice;

    const purchase = () => {
        setPurchasing(true);

        window.fetch2.post(`/api/stripe/purchase-subscription-with-currency/${subscription.id}`, {})
            .then((res) => {
                setUser({
                    ...user,
                    tokens: user.tokens - subscription.tokenPrice!,
                    diamonds: user.diamonds - subscription.diamondPrice!,
                    crystals: user.crystals - subscription.crystalPrice!,
                    subscriptions: [
                        ...user.subscriptions.filter((s) => s.id !== activeSubscription?.id),
                        res.data.subscription
                    ]
                });

                closeModal();

                createModal(
                    <>
                        <Modal.ModalHeader>🎉 Purchase Successful!</Modal.ModalHeader>
                        <Modal.ModalBody>
                            You are now a {subscription.name} member. Enjoy your new perks!
                        </Modal.ModalBody>
                        <Modal.ModalButtonContainer>
                            <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
                        </Modal.ModalButtonContainer>
                    </>
                );
            })
            .catch((err) => {
                setPurchasing(false);

                createModal(<Modal.ErrorModal>{getErrorMessage(err)}</Modal.ErrorModal>);
            });
    };

    const openConfirmModal = () => {
        if (isCurrentPlan) return;

        createModal(
            <>
                <Modal.ModalHeader>{activeSubscription ? `Switch to ${subscription.name}` : `Purchase ${subscription.name}`}</Modal.ModalHeader>

                <Modal.ModalBody style={{ flexDirection: "column", gap: 10 }}>
                    {activeSubscription && <div>This will replace your current plan.</div>}

                    <div>This will permanently deduct the following from your balance:</div>

                    <CurrencyPrice subscription={subscription} />

                    {!canAfford && <div style={{ color: "var(--error-color, #F54242)" }}>You don't have enough currency for this plan yet.</div>}
                </Modal.ModalBody>

                <Modal.ModalButtonContainer loading={purchasing}>
                    <Button.GenericButton onClick={purchase} disabled={!canAfford || purchasing}>Confirm Purchase</Button.GenericButton>
                    <Button.GenericButton onClick={closeModal}>Cancel</Button.GenericButton>
                </Modal.ModalButtonContainer>
            </>
        );
    };

    return (
        <div className={styles.subscription}>
            <div className={styles.topContainer}>
                <div
                    className={styles.top}
                    style={{
                        background: GRADIENT.reverse
                    }}
                />

                <img
                    className={styles.image}
                    src={resourceIdToPath(subscription.imageId)}
                    draggable={false}
                />
            </div>

            <Textfit min={0} max={50} mode="single" className={styles.name}>
                {subscription.name}
            </Textfit>

            <div className={styles.description}>
                <Markdown>
                    {subscription.description}
                </Markdown>
            </div>

            <div className={styles.bottom}>
                <Button.ClearButton
                    className={styles.subscribeButton}
                    onClick={openConfirmModal}
                >
                    {isCurrentPlan ? "Owned" : <CurrencyPrice subscription={subscription} />}
                </Button.ClearButton>
            </div>

            <div
                className={styles.boxShadow}
                style={{
                    boxShadow: `inset 0 0 0 4px ${subscription.color2}`
                }}
            />

            <div
                className={styles.background}
                style={{
                    background: GRADIENT.normal
                }}
            >
                <div className={styles.backgroundBlooks} style={{
                    backgroundImage: `url("${window.constructCDNUrl("/content/background.svg")}")`
                }} />
            </div>
        </div>
    );
}
