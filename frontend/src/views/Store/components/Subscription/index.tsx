import { useResource } from "@stores/ResourceStore/index";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useLoading } from "@stores/LoadingStore/index";
import { useData } from "@stores/DataStore/index";
import { Button, Markdown, Modal, Textfit } from "@components/index";
import SubscriptionPurchaseModal from "../SubscriptionPurchaseModal";
import styles from "./subscription.module.scss";

import { BillingIntervalEnum, UserSubscriptionStatusEnum } from "@blacket/types";
import { SubscriptionProps } from "../../store.d";

function getIntervalRank(billingInterval?: string | null) {
    switch (billingInterval) {
        case BillingIntervalEnum.LIFETIME:
            return 3;
        case BillingIntervalEnum.YEARLY:
            return 2;
        case BillingIntervalEnum.MONTHLY:
            return 1;
        default:
            return 0;
    }
}

function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = 45_000): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            window.setTimeout(() => reject(new Error(message)), timeoutMs);
        })
    ]);
}

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === "object" && "data" in err) {
        return (err as { data?: { message?: string } }).data?.message ?? "Something went wrong.";
    }

    return "Something went wrong.";
}

export default function Subscription({ subscription, interval = BillingIntervalEnum.MONTHLY }: SubscriptionProps) {
    const { resourceIdToPath } = useResource();
    const { user, setUser } = useUser();
    const { subscriptions } = useData();
    const { createModal, closeModal } = useModal();
    const { setLoading } = useLoading();

    const GRADIENT = {
        normal: `linear-gradient(${subscription.color1} 0%, ${subscription.color2} 100%)`,
        reverse: `linear-gradient(${subscription.color2} 0%, ${subscription.color1} 100%)`
    };

    const PRICE_TEXT = {
        [BillingIntervalEnum.MONTHLY]: subscription.monthlyPrice ? `$${subscription.monthlyPrice} / month` : null,
        [BillingIntervalEnum.YEARLY]: subscription.yearlyPrice ? `$${subscription.yearlyPrice} / year` : null,
        [BillingIntervalEnum.LIFETIME]: subscription.lifetimePrice ? `$${subscription.lifetimePrice} one time` : null
    };
    if (!PRICE_TEXT[interval]) return null;

    if (!user) return null;

    const activeSubscription = user.subscriptions
        .filter((userSubscription) =>
            [UserSubscriptionStatusEnum.ACTIVE, UserSubscriptionStatusEnum.PENDING_CANCELLATION].includes(userSubscription.status as UserSubscriptionStatusEnum) &&
            (!userSubscription.expiresAt || new Date(userSubscription.expiresAt) > new Date())
        )
        .sort((a, b) => {
            if (a.status !== b.status) return a.status === UserSubscriptionStatusEnum.ACTIVE ? -1 : 1;

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })[0];
    const currentSubscription = subscriptions.find((sub) => sub.id === activeSubscription?.subscriptionId);
    const isCurrentPlan = activeSubscription?.subscriptionId === subscription.id;
    const isCurrentInterval = activeSubscription?.billingInterval === interval;
    const hasPendingSwitch = Boolean(activeSubscription?.pendingChangeToSubscriptionId);
    const isPendingSwitch = activeSubscription?.pendingChangeToSubscriptionId === subscription.id &&
        activeSubscription.pendingChangeToBillingInterval === interval;
    const pendingSwitchDate = activeSubscription?.pendingChangeEffectiveAt
        ? new Date(activeSubscription.pendingChangeEffectiveAt).toLocaleDateString()
        : null;
    const isLifetimePurchase = interval === BillingIntervalEnum.LIFETIME;
    const shouldUsePurchaseModal = isLifetimePurchase || activeSubscription?.billingInterval === BillingIntervalEnum.LIFETIME;
    const isPlanDowngrade = currentSubscription && subscription.priority < currentSubscription.priority;
    const isPlanUpgrade = currentSubscription && subscription.priority > currentSubscription.priority;
    const isIntervalDowngrade = activeSubscription &&
        getIntervalRank(interval) < getIntervalRank(activeSubscription.billingInterval);
    const isIntervalUpgrade = activeSubscription &&
        getIntervalRank(interval) > getIntervalRank(activeSubscription.billingInterval);
    const isDowngrade = Boolean(isPlanDowngrade || (!isPlanUpgrade && isIntervalDowngrade));
    const isUpgrade = Boolean(isPlanUpgrade || (!isPlanDowngrade && isIntervalUpgrade));
    const getButtonText = () => {
        if (isCurrentPlan && isCurrentInterval && hasPendingSwitch) return "Keep Current Plan";
        if (isCurrentPlan && isCurrentInterval) return "Subscribed";
        if (isPendingSwitch && isDowngrade) return "Switch Scheduled";
        if (!activeSubscription || shouldUsePurchaseModal) return PRICE_TEXT[interval];

        return isCurrentPlan
            ? `Switch to ${interval === BillingIntervalEnum.YEARLY ? "Yearly" : "Monthly"}`
            : `Switch to ${subscription.name}`;
    };
    const buttonText = getButtonText();
    const buttonSubText = isPendingSwitch && isDowngrade && pendingSwitchDate
        ? pendingSwitchDate
        : isCurrentPlan && isCurrentInterval && hasPendingSwitch
            ? "Cancel scheduled switch"
            : !activeSubscription && subscription.lifetimePrice
                ? PRICE_TEXT[BillingIntervalEnum.LIFETIME]
                : null;

    const getBenefitLines = (description?: string) => {
        if (!description) return [];

        return description
            .split("\n")
            .map((line) => line.replace(":check:", "").trim())
            .filter(Boolean);
    };

    const updateLocalSubscription = (updatedSubscription: typeof activeSubscription) => {
        if (!updatedSubscription) return;

        setUser({
            ...user,
            subscriptions: user.subscriptions.map((userSubscription) =>
                userSubscription.id === updatedSubscription.id
                    ? updatedSubscription
                    : userSubscription
            )
        });
    };

    const switchPlan = () => {
        if (!activeSubscription) return;

        const primaryPaymentMethod = user.paymentMethods.find((method) => method.primary);

        closeModal();
        setLoading(true);

        withTimeout(
            window.fetch2.post(`/api/stripe/plan-switch/${subscription.id}`, {
                interval,
                paymentMethodId: primaryPaymentMethod?.paymentMethodId
            }),
            "The subscription switch timed out. Please try again."
        )
            .then((res) => {
                updateLocalSubscription(res.data.subscription);
                setLoading(false);
            })
            .catch((err) => {
                alert(getErrorMessage(err));
                setLoading(false);
            });
    };

    const openSwitchModal = () => {
        if (!activeSubscription) return;

        const isIntervalChange = isCurrentPlan && !isCurrentInterval;
        const currentBenefits = getBenefitLines(currentSubscription?.description);
        const targetBenefits = getBenefitLines(subscription.description);
        const lostBenefits = isDowngrade
            ? currentBenefits.filter((benefit) => !targetBenefits.includes(benefit))
            : [];
        const gainedBenefits = isUpgrade
            ? targetBenefits.filter((benefit) => !currentBenefits.includes(benefit))
            : [];
        const effectiveDate = activeSubscription.expiresAt
            ? new Date(activeSubscription.expiresAt).toLocaleDateString()
            : "your next billing period";
        const isCancelingPendingSwitch = isCurrentPlan && isCurrentInterval && hasPendingSwitch;
        const effectiveText = isCancelingPendingSwitch
            ? "Your scheduled switch will be cancelled immediately."
            : isDowngrade || (isIntervalChange && !isIntervalUpgrade)
                ? `This switch will take effect on ${effectiveDate}.`
                : "This switch will take effect immediately.";
        const modalTitle = isCancelingPendingSwitch
            ? "Keep Current Plan"
            : isIntervalChange
                ? `Switch to ${interval === BillingIntervalEnum.YEARLY ? "Yearly" : "Monthly"}`
                : `Switch to ${subscription.name}`;

        createModal(
            <>
                <Modal.ModalHeader>
                    {modalTitle}
                </Modal.ModalHeader>

                {lostBenefits.length > 0 && (
                    <Modal.ModalBody style={{ alignItems: "center", flexDirection: "column", textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
                            You may lose these benefits
                        </div>
                        <div style={{ display: "grid", gap: 6, lineHeight: 1.25, textAlign: "center" }}>
                            {lostBenefits.map((benefit) => (
                                <div key={benefit}>{benefit}</div>
                            ))}
                        </div>
                    </Modal.ModalBody>
                )}

                {gainedBenefits.length > 0 && (
                    <Modal.ModalBody style={{ alignItems: "center", flexDirection: "column", textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
                            You unlock with {subscription.name}
                        </div>
                        <div style={{ display: "grid", gap: 6, lineHeight: 1.25, textAlign: "center" }}>
                            {gainedBenefits.map((benefit) => (
                                <div key={benefit}>{benefit}</div>
                            ))}
                        </div>
                    </Modal.ModalBody>
                )}

                <Modal.ModalBody>
                    {effectiveText}
                </Modal.ModalBody>

                {gainedBenefits.length > 0 && (
                    <Modal.ModalBody>
                        Upgrade to {subscription.name} to get the full set of perks from {currentSubscription?.name} plus these extras.
                    </Modal.ModalBody>
                )}

                {lostBenefits.length > 0 && (
                    <Modal.ModalBody>
                        Staying on {currentSubscription?.name} keeps your current perks active.
                    </Modal.ModalBody>
                )}

                <Modal.ModalButtonContainer>
                    <Button.GenericButton onClick={switchPlan}>
                        {isCancelingPendingSwitch ? "Keep Current Plan" : "Confirm Switch"}
                    </Button.GenericButton>

                    <Button.GenericButton onClick={closeModal}>
                        Cancel
                    </Button.GenericButton>
                </Modal.ModalButtonContainer>
            </>
        );
    };

    const handleSubscribeClick = () => {
        if (isCurrentPlan && isCurrentInterval && !hasPendingSwitch) return;

        if (activeSubscription && !shouldUsePurchaseModal) {
            openSwitchModal();
            return;
        }

        createModal(
            <SubscriptionPurchaseModal subscription={subscription} interval={interval} />
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
                    onClick={handleSubscribeClick}
                >
                    {buttonText}
                    <div className={styles.lifetimeText}>
                        {buttonSubText}
                    </div>
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
