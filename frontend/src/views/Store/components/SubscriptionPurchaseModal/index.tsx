import { useState } from "react";
import { Link } from "react-router-dom";
import { useStripe } from "@stripe/react-stripe-js";
import { BillingIntervalEnum, PaymentMethodTypeEnum, StripeSubscriptionEntity, UserPaymentMethod } from "@blacket/types";
import { Button, Dropdown, ErrorContainer, Modal, StripeElementsWrapper, Toggle } from "@components/index";
import { useModal } from "@stores/ModalStore/index";
import { useUser } from "@stores/UserStore/index";

interface SubscriptionPurchaseModalProps {
    subscription: StripeSubscriptionEntity;
    interval: BillingIntervalEnum;
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

function SubscriptionPurchaseModalBody({ subscription, interval }: SubscriptionPurchaseModalProps) {
    const stripe = useStripe();
    const { user } = useUser();
    const { closeModal } = useModal();

    const [loading, setLoading] = useState<boolean>(false);
    const [accepted, setAccepted] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<UserPaymentMethod | null>(
        user?.paymentMethods.find((method) => method.primary) ?? null
    );

    if (!stripe || !user) return null;

    const price = interval === BillingIntervalEnum.LIFETIME
        ? subscription.lifetimePrice
        : interval === BillingIntervalEnum.YEARLY
            ? subscription.yearlyPrice
            : subscription.monthlyPrice;

    const intervalLabel = interval === BillingIntervalEnum.LIFETIME
        ? "one time"
        : interval === BillingIntervalEnum.YEARLY
            ? "year"
            : "month";
    const priceLabel = typeof price === "number"
        ? `$${price}`
        : "Unavailable";

    return (
        <>
            <Modal.ModalHeader>Review Subscription</Modal.ModalHeader>

            <Modal.ModalBody>
                {subscription.name} - {priceLabel} {intervalLabel}
            </Modal.ModalBody>

            <Modal.ModalBody>
                <Dropdown
                    options={user.paymentMethods.map((method) => ({
                        label: method.value,
                        value: method.id
                    }))}
                    onChange={(value: number) => {
                        setSelectedPaymentMethod(user.paymentMethods.find((method) => method.id === value) ?? null);
                    }}
                >
                    {selectedPaymentMethod ? selectedPaymentMethod.value : "Select a payment method..."}
                </Dropdown>
            </Modal.ModalBody>

            <Modal.ModalBody>
                <Toggle checked={accepted} onClick={() => !loading && setAccepted(!accepted)}>
                    <div style={{ marginLeft: 5, fontSize: "0.8rem", textAlign: "left" }}>
                        I agree to the <Link to="/terms">Terms of Service</Link> and authorize this payment.
                    </div>
                </Toggle>
            </Modal.ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer loading={loading}>
                <Button.GenericButton onClick={async () => {
                    if (!accepted) return setError("You must agree to the Terms of Service.");
                    if (!selectedPaymentMethod) return setError("You must select a payment method.");
                    if (selectedPaymentMethod.type !== PaymentMethodTypeEnum.CARD) return setError("Only card payments are supported right now.");

                    try {
                        setLoading(true);
                        setError("");

                        const res = await withTimeout(
                            window.fetch2.post(`/api/stripe/subscription/${subscription.id}`, {
                                interval,
                                paymentMethodId: selectedPaymentMethod.paymentMethodId
                            }),
                            "The subscription request timed out. Please try again."
                        );
                        const clientSecret = res.data.clientSecret;

                        if (clientSecret) {
                            const { error: stripeError } = await withTimeout(
                                stripe.confirmCardPayment(clientSecret),
                                "Stripe confirmation timed out. Please check your card and try again."
                            );
                            if (stripeError) {
                                setError(stripeError.message ?? "Something went wrong.");
                                setLoading(false);
                                return;
                            }
                        }

                        closeModal();
                        window.location.reload();
                    } catch (err) {
                        setError(getErrorMessage(err));
                        setLoading(false);
                    }
                }}>
                    Subscribe
                </Button.GenericButton>

                <Button.GenericButton onClick={closeModal}>Cancel</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}

export default function SubscriptionPurchaseModal(props: SubscriptionPurchaseModalProps) {
    return (
        <StripeElementsWrapper>
            <SubscriptionPurchaseModalBody {...props} />
        </StripeElementsWrapper>
    );
}
