import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { StripeElementsWrapperProps } from "./stripeElementsWrapper.d";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function StripeElementsWrapper({ children }: StripeElementsWrapperProps) {
    return <Elements stripe={stripePromise}>{children}</Elements>;
}
