export class StripeCreatePortalEntity {
    url: string;

    constructor(partial: Partial<StripeCreatePortalEntity>) {
        Object.assign(this, partial);
    }
}
