import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useSocket } from "@stores/SocketStore/index";
import { useToast } from "@stores/ToastStore/index";
import { useResource } from "@stores/ResourceStore/index";

import { SocketMessageType, SocketPaymentMethodEntity } from "@blacket/types";

interface BoosterNotification {
    type: "BOOSTER";
    username: string;
    multiplier: number;
    expiresAt: Date | string;
    imageId?: number;
}

// TODO: booster notification should be handled on the types

export function SocketDefiner() {
    const { user, setUser } = useUser();
    const { socket, initializeSocket } = useSocket();
    const { createToast } = useToast();
    const { resourceIdToPath } = useResource();

    const navigate = useNavigate();

    useEffect(() => {
        initializeSocket();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const onUserRefetchMe = () => {
            window.fetch2.get("/api/users/me")
                .then((res) => res.ok && res.data && setUser(res.data));
        };

        const onPaymentMethod = (data: SocketPaymentMethodEntity) => {
            if (!user) return;

            let newPaymentMethods = [...user.paymentMethods];
            if (data.create) {
                newPaymentMethods.push(data.create);

                createToast({
                    header: "Payment Method Added",
                    body: `A new payment method "${data.create.value}" has been added. If this was not you, please contact support immediately.`,
                    icon: window.constructCDNUrl("/content/icons/information.png"),
                    onClick: () => navigate("/settings/billing")
                });
            }
            if (data.update) {
                newPaymentMethods = newPaymentMethods.map((pm) => pm.id === data.update!.id ? data.update! : {
                    ...pm,
                    primary: data.update!.primary ? false : pm.primary
                });

                createToast({
                    header: "Payment Method Updated",
                    body: `Payment method "${data.update.value}" has been updated. If this was not you, please contact support immediately.`,
                    icon: window.constructCDNUrl("/content/icons/information.png"),
                    onClick: () => navigate("/settings/billing")
                });
            }
            if (data.delete) {
                newPaymentMethods = newPaymentMethods.filter((pm) => pm.id !== data.delete);

                createToast({
                    header: "Payment Method Removed",
                    body: "A payment method has been removed from your account. If this was not you, please contact support immediately.",
                    icon: window.constructCDNUrl("/content/icons/information.png"),
                    onClick: () => navigate("/settings/billing")
                });
            }

            const newUser = {
                ...user,
                paymentMethods: newPaymentMethods
            };

            setUser(newUser);
        };

        const onNotification = (data: BoosterNotification) => {
            if (data.type !== "BOOSTER") return;

            const endTime = new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            }).format(new Date(data.expiresAt));

            createToast({
                header: "Booster Activated",
                body: `${data.username} is currently boosting the chances by ${data.multiplier}x! The booster will end at ${endTime}.`,
                icon: data.imageId ? resourceIdToPath(data.imageId) : "fas fa-bolt"
            });
        };

        socket.on(SocketMessageType.USER_REFETCH_ME, onUserRefetchMe);
        socket.on(SocketMessageType.STRIPE_PAYMENT_METHOD, onPaymentMethod);
        socket.on(SocketMessageType.NOTIFICATION, onNotification);

        return () => {
            socket.off(SocketMessageType.USER_REFETCH_ME, onUserRefetchMe);
            socket.off(SocketMessageType.STRIPE_PAYMENT_METHOD, onPaymentMethod);
            socket.off(SocketMessageType.NOTIFICATION, onNotification);
        };
    }, [socket, user, resourceIdToPath]);

    return null;
}
