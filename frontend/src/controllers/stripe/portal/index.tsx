import { StripeCreatePortalEntity } from "@blacket/types";

export function usePortal() {
    const createPortal = () => new Promise<StripeCreatePortalEntity>((resolve, reject) => window.fetch2.post("/api/stripe/portal", {})
        .then((res: Fetch2Response & { data: StripeCreatePortalEntity }) => resolve(res.data))
        .catch(reject));

    return { createPortal };
}
