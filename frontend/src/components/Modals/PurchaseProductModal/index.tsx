import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStripe } from "@stripe/react-stripe-js";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useSound } from "@stores/SoundStore/index";
import { Modal, ErrorContainer, Button, StripeElementsWrapper, ImageOrVideo, Dropdown, Toggle, ParticleCanvas, Input } from "@components/index";
import { ParticleCanvasRef } from "@components/ParticleCanvas/particleCanvas";
import styles from "./purchaseProductModal.module.scss";

import { ProductPurchaseModalProps, ProductSuccessModalProps } from "./productPurchaseModal.d";
import { Forbidden, PaymentMethodTypeEnum, RarityAnimationTypeEnum, UserPaymentMethod } from "@blacket/types";

const MUST_SELECT_PAYMENT_METHOD = "You must select a payment method.";

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

function SuccessModalOutside() {
    const particleCanvasRef = useRef<ParticleCanvasRef>(null);

    const { playSound, playSounds, stopSounds } = useSound();

    useEffect(() => {
        if (!particleCanvasRef.current) return;

        particleCanvasRef.current.start();

        setTimeout(() => {
            playSound("party-popper");
        }, 100);

        setTimeout(() => {
            playSounds(["cha-ching", "token-shower"]);
        }, 400);

        const stopTimeout = setTimeout(() => {
            if (particleCanvasRef.current) particleCanvasRef.current.stop();
        }, 2500);

        return () => {
            stopSounds(["cha-ching", "token-shower"]);
            clearTimeout(stopTimeout);
        };
    }, []);

    return (
        <ParticleCanvas
            ref={particleCanvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: -1
            }}
            images={[
                window.constructCDNUrl("/content/token.png"),
                window.constructCDNUrl("/content/diamond.png"),
                window.constructCDNUrl("/content/crystal.png")
            ]}
            particleWidth={50}
            particleHeight={50}
            particleCount={800}
            animationType={RarityAnimationTypeEnum.LEGENDARY}
        />
    );
}

function SuccessModal({ product, quantity }: ProductSuccessModalProps) {
    const { closeModal } = useModal();
    const { resourceIdToPath } = useResource();

    const PRICE = Math.round((product.price * Number(quantity)) * (product.isPriceUsingCrystals ? 1 : 100));
    const FINAL_PRICE_STRING = !product.discount ? PRICE :
        (PRICE * (1 - (product.discount / 100))).toFixed(product.isPriceUsingCrystals ? 0 : 2);
    const FINAL_PRICE = product.isPriceUsingCrystals ? Math.floor(Number(FINAL_PRICE_STRING)) : Number(FINAL_PRICE_STRING) / 100;

    return (
        <>
            <Modal.ModalHeader>🎉 Purchase Successful!</Modal.ModalHeader>

            <Modal.ModalBody>
                You have received the following product:
            </Modal.ModalBody>

            <Modal.ModalBody>
                <div className={styles.purchaseDetailsContainer}>
                    <span className={styles.purchaseDetailsText}>Purchase Details</span>

                    <div className={styles.purchaseDetails}>
                        <span style={{ display: "flex", alignItems: "center" }}>
                            <ImageOrVideo
                                src={resourceIdToPath(product.imageId)}
                                className={styles.productImage}
                            />
                            {!product.isQuantityCapped ? `x${quantity} ` : ""}{product.name}
                        </span>
                        <span className={styles.productPrice}>
                            {product.isPriceUsingCrystals ? <>
                                <img className={styles.productCurrencyImage} src={window.constructCDNUrl("/content/crystal.png")} />
                                {FINAL_PRICE} Crystals
                            </> : <>
                                ${FINAL_PRICE} USD
                            </>}
                        </span>
                    </div>
                </div>

                Thank you for supporting {import.meta.env.VITE_INFORMATION_NAME} ❤️
            </Modal.ModalBody>

            <Modal.ModalButtonContainer>
                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}

function TheModal({ product }: ProductPurchaseModalProps) {
    const stripe = useStripe();
    const { user } = useUser();
    const { createModal, closeModal } = useModal();
    const { resourceIdToPath } = useResource();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<UserPaymentMethod | null>(
        user?.paymentMethods.find((method) => method.primary) ?? null
    );
    const [quantity, setQuantity] = useState<string>("1");
    const [accepted, setAccepted] = useState<boolean>(false);
    const [finalPrice, setFinalPrice] = useState<number>(product.price);

    const navigate = useNavigate();

    const showSuccessModal = () => {
        createModal(<SuccessModal product={product} quantity={parseInt(quantity)} />, { outsideModal: <SuccessModalOutside /> });
        closeModal();
    };

    const setErrorAndStopLoading = (message: string) => {
        setError(message);
        setLoading(false);
    };

    useEffect(() => {
        const PRICE = Math.round((product.price * Number(quantity)) * (product.isPriceUsingCrystals ? 1 : 100));
        const FINAL_PRICE_STRING = !product.discount ? PRICE :
            (PRICE * (1 - (product.discount / 100))).toFixed(product.isPriceUsingCrystals ? 0 : 2);
        const FINAL_PRICE = product.isPriceUsingCrystals ? Math.floor(Number(FINAL_PRICE_STRING)) : Number(FINAL_PRICE_STRING) / 100;

        setFinalPrice(FINAL_PRICE);
    }, [product, quantity]);

    if (!stripe || !user) return null;

    return (
        <>
            <Modal.ModalHeader>Review Purchase</Modal.ModalHeader>

            <Modal.ModalBody>
                Please review your purchase below.
            </Modal.ModalBody>

            <Modal.ModalBody style={{ minWidth: 500 }}>
                <div className={styles.purchaseDetailsContainer}>
                    <span className={styles.purchaseDetailsText}>Product Details</span>

                    <div className={styles.purchaseDetails}>
                        <span style={{ display: "flex", alignItems: "center" }}>
                            <ImageOrVideo
                                src={resourceIdToPath(product.imageId)}
                                className={styles.productImage}
                            />
                            {!product.isQuantityCapped && <>x<Input
                                value={quantity.toString()}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const parsedValue = parseInt(value);

                                    if (value.match(/[^0-9]/)) return;
                                    if (parsedValue < 1 && value !== "") return;
                                    if (parsedValue > 100) return setQuantity("100");

                                    if (value === "") return setQuantity("");
                                    setQuantity(parsedValue.toString());
                                    setError("");
                                }}
                                containerProps={{ style: { width: 35, height: 20, margin: "0 10px 0 0", border: "unset", borderRadius: 7 } }}
                                style={{ height: 20, width: 30, margin: "unset", borderRadius: 7 }}
                                autoComplete="off"
                            />{" "}</>}{product.name}
                        </span>
                        <span className={styles.productPrice}>
                            {product.isPriceUsingCrystals ? <>
                                <img className={styles.productCurrencyImage} src={window.constructCDNUrl("/content/crystal.png")} />
                                {finalPrice} Crystals
                            </> : <>
                                ${finalPrice.toFixed(2)}
                            </>}
                        </span>
                    </div>
                </div>

                {!product.isPriceUsingCrystals && <Dropdown
                    options={[
                        ...user.paymentMethods.map((method) => ({
                            label: method.value, value: method.id
                        })),
                        { label: "Add Payment Method", value: null }
                    ]}
                    onChange={(value: number | null) => {
                        if (value === null) {
                            closeModal();

                            navigate("/settings/billing");
                        } else {
                            setSelectedPaymentMethod(user.paymentMethods.find((method) => method.id === value) ?? null);
                        }
                    }}
                    className={styles.paymentMethodDropdown}
                >
                    {selectedPaymentMethod ? selectedPaymentMethod.value : "Select a payment method..."}
                </Dropdown>}
            </Modal.ModalBody>

            <Modal.ModalBody>
                <Toggle
                    checked={accepted}
                    onClick={() => {
                        if (loading) return;
                        setAccepted(!accepted);
                    }}
                >
                    <div style={{ marginLeft: 5, fontSize: "0.8rem", textAlign: "left" }}>
                        I agree to the <Link to="/terms">Terms of Service</Link> and I understand that I
                        <br />
                        waive the right to withdrawal from this purchase.
                    </div>
                </Toggle>
            </Modal.ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer loading={loading}>
                <Button.GenericButton
                    onClick={async () => {
                        if (!accepted) return setError("You must agree to the Terms of Service and Purchase Policy.");
                        if (quantity === "" || parseInt(quantity) < 1) return setError("You must select a quantity of at least 1.");

                        try {
                            if (product.isPriceUsingCrystals) {
                                if (user.crystals < finalPrice) return setError(Forbidden.STRIPE_NOT_ENOUGH_CRYSTALS);

                                setLoading(true);

                                await withTimeout(
                                    window.fetch2.post(`/api/stripe/purchase-with-crystals/${product.id}`, {
                                        quantity: parseInt(quantity)
                                    }),
                                    "The purchase request timed out. Please try again."
                                );

                                showSuccessModal();
                                return;
                            }

                            if (!selectedPaymentMethod) return setError(MUST_SELECT_PAYMENT_METHOD);
                            if (selectedPaymentMethod.type !== PaymentMethodTypeEnum.CARD) {
                                return setError(MUST_SELECT_PAYMENT_METHOD);
                            }

                            setLoading(true);

                            const res = await withTimeout(
                                window.fetch2.post(`/api/stripe/payment-intent/${product.id}`, {
                                    quantity: parseInt(quantity),
                                    paymentMethodId: selectedPaymentMethod.paymentMethodId
                                }),
                                "The purchase request timed out. Please try again."
                            );
                            if (res.data.status !== "succeeded") {
                                const clientSecret = res.data.client_secret;
                                if (!clientSecret) {
                                    return setErrorAndStopLoading("Stripe did not return a payment confirmation token.");
                                }

                                const { error: verifyError } = await withTimeout(
                                    stripe.confirmCardPayment(clientSecret),
                                    "Stripe confirmation timed out. Please check your card and try again."
                                );
                                if (verifyError) {
                                    return setErrorAndStopLoading(verifyError.message ?? "Something went wrong.");
                                }
                            }

                            showSuccessModal();
                        } catch (err) {
                            setError(getErrorMessage(err));
                            setLoading(false);
                        }
                    }}
                >
                    Purchase
                </Button.GenericButton>

                <Button.GenericButton onClick={closeModal}>Cancel</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}

export default function PurchaseProductModal({ product }: ProductPurchaseModalProps) {
    return (
        <StripeElementsWrapper>
            <TheModal product={product} />
        </StripeElementsWrapper>
    );
}
