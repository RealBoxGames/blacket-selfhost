import { Transaction, CurrencyType, Product, User } from "@blacket/core";

export const constructDiscordWebhookObject = ({
    user,
    product,
    amount,
    transaction,
    currencyType,
    mediaPath,
    ipAddress
}: {
    user: User;
    product: Product;
    amount: number;
    transaction: Transaction;
    currencyType: CurrencyType;
    mediaPath: string;
    ipAddress: string;
}) => {
    let content: string | undefined = undefined;
    let title = "✅ Payment Complete";
    let color = 0x00ff00;
    let thumbnail = `${mediaPath}/content/icons/success.png`;
    let amountString = amount.toString() + ` ${currencyType}`;

    switch (currencyType) {
        case CurrencyType.CRYSTAL:
            content = undefined;
            title = "🟪 Crystal Payment Complete";
            color = 0x800080;
            thumbnail = `${mediaPath}/content/crystal.png`;
            amountString = amount.toString();
            break;
        case CurrencyType.USD:
            content = "@everyone";
            title = "✅ Payment Complete";
            color = 0x00ff00;
            thumbnail = `${mediaPath}/content/icons/success.png`;
            amountString = (amount / 100).toFixed(2);
            break;
        default:
            break;
    }

    return {
        content,
        embeds: [
            {
                title,
                fields: [
                    {
                        name: "__``User Information``__",
                        value:
                            "**ID:** " +
                            user.id +
                            "\n" +
                            "**Username:** " +
                            user.username +
                            "\n" +
                            "**Email:** " +
                            (user.email || "None") +
                            "\n" +
                            "**IP:** " +
                            ipAddress +
                            "\n",
                        inline: false
                    },
                    {
                        name: "__``Product Information``__",
                        value:
                            "**ID:** " +
                            product.id +
                            "\n" +
                            "**Name:** " +
                            product.name +
                            "\n",
                        inline: false
                    },
                    {
                        name: "__``Transaction Information``__",
                        value:
                            (transaction.stripePaymentId? "**Stripe ID:** " +
                                  transaction.stripePaymentId +
                                  "\n": "") +
                            "**Transaction ID:** " +
                            transaction.id +
                            "\n" +
                            `**Amount:** ${amountString}` +
                            "\n" +
                            "**Quantity:** " +
                            transaction.quantity +
                            "\n",
                        inline: false
                    }
                ],
                color,
                thumbnail: {
                    url: thumbnail
                },
                footer: {
                    text: `Created At: ${new Date(transaction.createdAt).toLocaleString()}`
                }
            }
        ]
    };
};
