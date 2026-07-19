import { UserPaymentMethod } from "../../interfaces";

export class SocketPaymentMethodEntity {
    create?: UserPaymentMethod;
    update?: UserPaymentMethod;
    delete?: number;

    constructor(partial: Partial<SocketPaymentMethodEntity>) {
        Object.assign(this, partial);
    }
}
