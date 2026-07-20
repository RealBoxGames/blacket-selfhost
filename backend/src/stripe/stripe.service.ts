import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "src/redis/redis.service";
import { PrismaService } from "src/prisma/prisma.service";
import { SocketService } from "src/socket/socket.service";
import { PermissionsService } from "src/permissions/permissions.service";
import { RewardsService } from "src/rewards/rewards.service";
import Stripe from "stripe";
import axios from "axios";

import {
    Conflict,
    Forbidden,
    InternalServerError,
    NotFound,
    StripeCreatePaymentIntentDto,
    StripeCreatePortalEntity,
    StripeStoreEntity
} from "@blacket/types";
import {
    CurrencyType,
    PaymentMethodType,
    Product,
    Reward,
    Transaction,
    TransactionStatus,
    User,
    UserSubscriptionStatus,
    BillingInterval,
    Subscription,
    UserSubscription,
    Prisma
} from "@blacket/core";
import { constructDiscordWebhookObject } from "./func";

@Injectable()
export class StripeService {
    public readonly stripe: Stripe;

    constructor(private readonly configService: ConfigService,
        private readonly redisService: RedisService,
        private readonly prismaService: PrismaService,
        private readonly socketService: SocketService,
        private readonly permissionsService: PermissionsService,
        private readonly rewardsService: RewardsService,
        @Inject("STRIPE_OPTIONS")
        private readonly options: {
            apiKey: string;
            options: Stripe.StripeConfig;
        },) {
        this.stripe = new Stripe(this.options.apiKey, this.options.options);
    }

    async constructWebhookEvent(
        body: string,
        signature: string
    ): Promise<Stripe.Event> {
        return this.stripe.webhooks.constructEvent(body, signature, this.configService.get<string>("SERVER_STRIPE_WEBHOOK_SECRET_KEY"),);
    }

    async handleWebhook(event: Stripe.Event): Promise<void> {
        console.log(event.type);

        switch (event.type) {
            case "payment_intent.succeeded":
                return await this.handlePaymentIntentSuccess(event.data.object as Stripe.PaymentIntent,);
            case "payment_intent.payment_failed":
                return await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent,);
            case "invoice.payment_succeeded":
                return await this.handleInvoiceSuccess(event.data.object as Stripe.Invoice,);
            case "invoice.payment_failed":
                return await this.handleInvoiceFailed(event.data.object as Stripe.Invoice,);
            case "customer.subscription.created":
                return await this.handleSubscriptionCreate(event.data.object as Stripe.Subscription,);
            case "customer.subscription.deleted":
                return await this.handleSubscriptionEnd(event.data.object as Stripe.Subscription,);
            case "payment_method.attached":
                return await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod,);
            case "payment_method.detached":
                return await this.handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod,);
            case "customer.updated":
                return await this.handleCustomerUpdated(event.data.object as Stripe.Customer,);
        }
    }

    async getPrice(priceId: string): Promise<Stripe.Price> {
        const priceCache = await this.redisService.getKey("stripePrice", priceId,);
        if (priceCache) return priceCache;

        const price = await this.stripe.prices.retrieve(priceId);
        if (!price) throw new NotFoundException(NotFound.UNKNOWN_PRICE);

        await this.redisService.setKey("stripePrice", priceId, price, 3600);

        return price;
    }

    async getStores(): Promise<StripeStoreEntity[]> {
        const productCache = await this.redisService.getKey("products", "*");
        if (productCache) return Object.values(productCache);

        const stores = await this.prismaService.store.findMany({
            where: {
                active: true
            },
            include: {
                products: {
                    select: {
                        id: true,
                        priority: true
                    },
                    orderBy: { priority: "asc" }
                }
            }
        });
        if (!stores) throw new InternalServerErrorException(InternalServerError.DEFAULT);

        const response = stores.map((store) => new StripeStoreEntity({
            ...store,
            products: store.products.map((product) => product.id)
        }));

        await this.redisService.setKey("products", "*", response);

        return response;
    }

    async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

        let customerId = user.stripeCustomerId;

        if (!customerId) {
            const customer = await this.stripe.customers.create({
                name: user.username,
                metadata: {
                    userId
                }
            });
            if (!customer) throw new NotFoundException(NotFound.UNKNOWN_CUSTOMER);

            await this.prismaService.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customer.id }
            });

            customerId = customer.id;
        }

        const customer = await this.stripe.customers.retrieve(customerId);
        if (!customer || customer.deleted) throw new NotFoundException(NotFound.UNKNOWN_CUSTOMER);

        return customer as Stripe.Customer;
    }

    async getUserByCustomerId(customerId: string): Promise<User | null> {
        return await this.prismaService.user.findUnique({
            where: { stripeCustomerId: customerId }
        });
    }

    private getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
        const subscription = invoice.subscription;
        if (!subscription) return null;

        return typeof subscription === "string" ? subscription : subscription.id;
    }

    private getInvoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
        const paymentIntent = invoice.payment_intent;
        if (!paymentIntent) return null;

        return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
    }

    private getInvoiceStripePaymentId(invoice: Stripe.Invoice): string | null {
        const paymentIntentId = this.getInvoicePaymentIntentId(invoice);
        if (paymentIntentId) return paymentIntentId;

        const charge = invoice.charge;
        if (charge) return typeof charge === "string" ? charge : charge.id;

        return invoice.id ?? null;
    }

    private getSubscriptionPriceId(plan: {
        monthlyPriceId?: string | null,
        yearlyPriceId?: string | null
    }, interval: BillingInterval): string | null {
        return interval === BillingInterval.MONTHLY ? plan.monthlyPriceId ?? null : plan.yearlyPriceId ?? null;
    }

    private getSubscriptionIntervalRank(interval: BillingInterval): number {
        switch (interval) {
            case BillingInterval.LIFETIME:
                return 3;
            case BillingInterval.YEARLY:
                return 2;
            case BillingInterval.MONTHLY:
                return 1;
            default:
                // this should never happen, but just incase
                return 0;
        }
    }

    private async getSubscriptionIntervalAmount(plan: Subscription, interval: BillingInterval): Promise<number> {
        if (interval === BillingInterval.LIFETIME) return Math.round((plan.lifetimePrice ?? 0) * 100);

        const priceId = this.getSubscriptionPriceId(plan, interval);
        if (!priceId) return 0;

        const price = await this.getPrice(priceId);

        return price.unit_amount ?? 0;
    }

    private async getRemainingSubscriptionCredit(userSubscription: UserSubscription): Promise<number> {
        if (userSubscription.billingInterval === BillingInterval.LIFETIME || !userSubscription.expiresAt) return 0;

        const subscription = await this.prismaService.subscription.findUnique({
            where: { id: userSubscription.subscriptionId }
        });
        if (!subscription) return 0;

        const currentAmount = await this.getSubscriptionIntervalAmount(subscription, userSubscription.billingInterval);
        if (currentAmount <= 0) return 0;

        const now = Date.now();
        const expiresAt = userSubscription.expiresAt.getTime();
        const totalDuration = userSubscription.billingInterval === BillingInterval.YEARLY ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const remainingDuration = Math.max(0, expiresAt - now);
        const creditRatio = Math.min(1, remainingDuration / totalDuration);

        return Math.floor(currentAmount * creditRatio);
    }

    private getSubscriptionClientSecret(subscription: Stripe.Subscription): string | null {
        const invoice = subscription.latest_invoice;
        if (!invoice || typeof invoice === "string") return null;

        const paymentIntent = invoice.payment_intent;
        if (!paymentIntent || typeof paymentIntent === "string") return null;

        if (
            paymentIntent.status !== "requires_action" &&
            paymentIntent.status !== "requires_confirmation"
        ) return null;

        return paymentIntent.client_secret;
    }

    private getSubscriptionScheduleId(subscription: Stripe.Subscription): string | null {
        if (typeof subscription.schedule === "string") return subscription.schedule;

        return subscription.schedule?.id ?? null;
    }

    private getSubscriptionSwitchMetadata(data: {
        userId: string;
        subscriptionId: number;
        userSubscriptionId: number;
        billingInterval: BillingInterval;
        ipAddress: string;
        pAYMENTMETHODID?: number
    }) {
        const metadata = {
            blacketUserId: data.userId,
            blacketSubscriptionId: data.subscriptionId.toString(),
            blacketUserSubscriptionId: data.userSubscriptionId.toString(),
            BillingInterval: data.billingInterval,
            ipAddress: data.ipAddress
        };

        if (data.pAYMENTMETHODID === undefined) return metadata;

        return {
            ...metadata,
            blacketPaymentMethodId: data.pAYMENTMETHODID.toString()
        };
    }



    async getPaymentMethodById(id: number, userId?: string) {
        return await this.prismaService.userPaymentMethod.findUnique({
            where: { id, userId }
        });
    }

    async getPaymentMethodByStripeId(paymentMethodId: string, userId?: string) {
        return await this.prismaService.userPaymentMethod.findUnique({
            where: {
                paymentMethodId,
                userId
            }
        });
    }

    private async connectSubscriptionGroup(
        userId: string,
        subscription: { groupId?: number | null },
        tx: Prisma.TransactionClient = this.prismaService
    ) {
        if (!subscription.groupId) return;

        const hasGroup = await tx.user.findFirst({
            where: {
                id: userId,
                groups: {
                    some: { id: subscription.groupId }
                }
            },
            select: { id: true }
        });
        if (hasGroup) return;

        await tx.user.update({
            where: { id: userId },
            data: {
                groups: {
                    connect: { id: subscription.groupId }
                }
            }
        });
    }

    private async disconnectSubscriptionGroupIfUnused(userId: string,
        groupId: number | null | undefined,
        ignoredUserSubscriptionId: number,
        tx: Prisma.TransactionClient = this.prismaService,) {
        if (!groupId) return;

        const activeSubscription = await tx.userSubscription.findFirst({
            where: {
                userId,
                id: { not: ignoredUserSubscriptionId },
                status: {
                    in: [
                        UserSubscriptionStatus.ACTIVE,
                        UserSubscriptionStatus.PENDING_CANCELLATION
                    ]
                },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ],
                subscription: { groupId }
            },
            select: { id: true }
        });
        if (activeSubscription) return;

        await tx.user.update({
            where: { id: userId },
            data: {
                groups: {
                    disconnect: { id: groupId }
                }
            }
        });
    }

    async handlePaymentSuccess(data: {
        user: User;
        product?: Product;
        transaction: Transaction;
        rewards?: Reward[];
        removeCrystals?: number;
        ipAddress?: string;
        stripePaymentId?: string;
        lifetimeSubscription?: {
            userSubscriptionId: number;
            subscription: Subscription;
            previousUserSubscriptionId?: number;
            previousStripeSubscriptionId?: string;
        };
    }): Promise<void> {
        const {
            user,
            product,
            transaction,
            rewards,
            ipAddress,
            stripePaymentId,
            lifetimeSubscription
        } = data;

        const rewardIds: number[] = [];
        for (const reward of rewards ?? []) {
            rewardIds.push(reward.id);
        }

        let newTransaction: Transaction | null = null;

        await this.prismaService.$transaction(async (tx) => {
            if (rewardIds.length > 0) {
                await this.rewardsService.giveRewardsToUser(user.id, rewardIds, transaction.quantity, true, tx,);
            }

            if (lifetimeSubscription) {
                await tx.userSubscription.update({
                    where: { id: lifetimeSubscription.userSubscriptionId },
                    data: {
                        status: UserSubscriptionStatus.ACTIVE,
                        expiresAt: null
                    }
                });
                await this.connectSubscriptionGroup(user.id, lifetimeSubscription.subscription, tx);

                if (
                    lifetimeSubscription.previousUserSubscriptionId &&
                    lifetimeSubscription.previousUserSubscriptionId !== lifetimeSubscription.userSubscriptionId
                ) {
                    const previousSubscription = await tx.userSubscription.update({
                        where: { id: lifetimeSubscription.previousUserSubscriptionId },
                        data: {
                            status: UserSubscriptionStatus.CANCELED,
                            expiresAt: new Date()
                        },
                        include: {
                            subscription: {
                                select: { groupId: true }
                            }
                        }
                    });
                    await this.disconnectSubscriptionGroupIfUnused(user.id, previousSubscription.subscription.groupId, previousSubscription.id, tx,);
                }
            }

            if (data.removeCrystals && data.removeCrystals > 0) await tx.user.update({
                where: { id: user.id },
                data: {
                    crystals: {
                        decrement: data.removeCrystals
                    }
                }
            });

            newTransaction = await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: TransactionStatus.COMPLETED,
                    stripePaymentId
                }
            });
        });

        if (!newTransaction) throw new InternalServerErrorException(InternalServerError.DEFAULT);

        if (lifetimeSubscription?.previousStripeSubscriptionId) {
            await this.stripe.subscriptions
                .cancel(lifetimeSubscription.previousStripeSubscriptionId)
                .catch((err) =>
                    console.error("Error canceling previous subscription:", err,),);
        }

        if (lifetimeSubscription) this.permissionsService.clearCache(user.id);

        if (product) {
            const WEBHOOK_URL =
                product.isPriceUsingCrystals ? this.configService.get<string>("SERVER_DISCORD_CRYSTAL_PAYMENT_WEBHOOK_URL") : this.configService.get<string>("SERVER_DISCORD_PAYMENT_WEBHOOK_URL",);

            await axios.post(WEBHOOK_URL, constructDiscordWebhookObject({
                user,
                product,
                amount: product.price,
                transaction: newTransaction,
                currencyType: product.isPriceUsingCrystals ? CurrencyType.CRYSTAL : CurrencyType.USD,
                mediaPath:
                    this.configService.get<string>("VITE_MEDIA_URL"),
                ipAddress
            }), {
                headers: {
                    "Content-Type": "application/json"
                }
            },)
                .catch((err) => console.error("Error sending webhook:", err));
        }

        if (lifetimeSubscription) {
            const WEBHOOK_URL =
                this.configService.get<string>("SERVER_DISCORD_PURCHASE_WEBHOOK_URL",) ||
                this.configService.get<string>("SERVER_DISCORD_PAYMENT_WEBHOOK_URL",);

            await axios.post(WEBHOOK_URL, {
                content: "@everyone",
                embeds: [
                    {
                        title: "✅ Lifetime Subscription Payment Complete",
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
                                name: "__``Subscription Information``__",
                                value:
                                    "**ID:** " +
                                    lifetimeSubscription.subscription.id +
                                    "\n" +
                                    "**Name:** " +
                                    lifetimeSubscription.subscription.name +
                                    "\n" +
                                    "**Interval:** LIFETIME\n",
                                inline: false
                            },
                            {
                                name: "__``Transaction Information``__",
                                value:
                                    (newTransaction.stripePaymentId ? "**Stripe ID:** " +
                                        newTransaction.stripePaymentId +
                                        "\n" : "") +
                                    "**Transaction ID:** " +
                                    newTransaction.id +
                                    "\n" +
                                    "**Amount:** $" +
                                    newTransaction.amount.toFixed(2) +
                                    "\n" +
                                    "**Quantity:** " +
                                    newTransaction.quantity +
                                    "\n",
                                inline: false
                            }
                        ],
                        color: 0x00ff00,
                        thumbnail: {
                            url: `${this.configService.get<string>("VITE_MEDIA_URL")}/content/icons/success.png`
                        },
                        footer: {
                            text: `Created At: ${new Date(newTransaction.createdAt).toLocaleString()}`
                        }
                    }
                ]
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            },)
                .catch((err) => console.error("Error sending lifetime subscription webhook:", err,),);
        }

        this.socketService.emitUserRefetchMeEvent(user.id);
    }

    async handlePaymentIntentSuccess(event: Stripe.PaymentIntent) {
        const user = await this.getUserByCustomerId(String(event.customer));
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

        if (event.metadata.billingInterval === BillingInterval.LIFETIME) {
            const userSubscriptionId = Number(event.metadata.blacketUserSubscriptionId);
            const previousUserSubscriptionId = Number(event.metadata.previousUserSubscriptionId);

            if (!Number.isInteger(userSubscriptionId) || userSubscriptionId <= 0) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

            const transaction = await this.prismaService.transaction.findUnique({
                where: { id: event.metadata.blacketTransactionId }
            });

            if (!transaction) throw new NotFoundException(NotFound.UNKNOWN_TRANSACTION);
            if (transaction.status === TransactionStatus.COMPLETED) return;

            const subscription = await this.prismaService.subscription.findUnique({
                where: { id: Number(event.metadata.blacketSubscriptionId) }
            });
            if (!subscription) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

            return await this.handlePaymentSuccess({
                user,
                transaction,
                ipAddress: event.metadata.ipAddress,
                stripePaymentId: event.id,
                lifetimeSubscription: {
                    userSubscriptionId,
                    subscription,
                    previousUserSubscriptionId: Number.isInteger(previousUserSubscriptionId) && previousUserSubscriptionId > 0 ? previousUserSubscriptionId : undefined,
                    previousStripeSubscriptionId: event.metadata.previousStripeSubscriptionId || undefined
                }
            });
        }

        const product = await this.redisService.getProduct(Number(event.metadata.blacketProductId),);
        if (!product) throw new NotFoundException(NotFound.UNKNOWN_PRODUCT);

        const transaction = await this.prismaService.transaction.findUnique({
            where: { id: event.metadata.blacketTransactionId }
        });
        if (!transaction) throw new NotFoundException(NotFound.UNKNOWN_TRANSACTION);
        if (transaction.status === TransactionStatus.COMPLETED) return;

        return await this.handlePaymentSuccess({
            user,
            product,
            transaction,
            rewards: product.rewards,
            ipAddress: event.metadata.ipAddress,
            stripePaymentId: event.id
        });
    }

    async handlePaymentIntentFailed(event: Stripe.PaymentIntent) {
        await this.prismaService.transaction.update({
            where: {
                id: event.metadata.blacketTransactionId
            },
            data: {
                status: TransactionStatus.FAILED
            }
        });
    }

    // TODO: this is where we should handle the actual subscription creation logic, not just the updating to set the period end date
    async handleSubscriptionCreate(event: Stripe.Subscription) {
        const userSubscriptionId = Number(event.metadata.blacketUserSubscriptionId);

        const userSubscription = await this.prismaService.userSubscription.findUnique({
            where: { id: userSubscriptionId },
            include: { subscription: true }
        });
        if (!userSubscription) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

        await this.prismaService.$transaction(async (tx) => {
            await tx.userSubscription.update({
                where: { id: userSubscription.id },
                data: {
                    stripeSubscriptionId: event.id,
                    expiresAt: new Date(event.current_period_end * 1000),
                    status: event.status === "active" ? UserSubscriptionStatus.ACTIVE : UserSubscriptionStatus.INACTIVE
                }
            });

            if (event.status === "active") {
                await this.connectSubscriptionGroup(userSubscription.userId, userSubscription.subscription, tx);
            }
        });

        this.permissionsService.clearCache(userSubscription.userId);
        this.socketService.emitUserRefetchMeEvent(userSubscription.userId);
    }

    // TODO: there is a lot of repeating here, and this should only be for invoices so it should be more minimal
    async handleInvoiceSuccess(event: Stripe.Invoice) {
        const stripeSubscriptionId = this.getInvoiceSubscriptionId(event);
        if (!stripeSubscriptionId) return;

        const userSubscription =
            await this.prismaService.userSubscription.findUnique({
                where: { stripeSubscriptionId },
                include: {
                    user: true,
                    subscription: true
                }
            });
        if (!userSubscription) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

        const stripePaymentId = this.getInvoiceStripePaymentId(event);
        const existingTransaction = stripePaymentId ? await this.prismaService.transaction.findUnique({ where: { stripePaymentId } }) : null;

        const metadata = event.subscription_details?.metadata ?? {};
        const ipAddress = metadata.ipAddress;

        const ip = await this.prismaService.ipAddress.upsert({
            where: { ipAddress },
            create: { ipAddress },
            update: {}
        });

        const periodEnd = event.lines.data[0]?.period?.end;
        const paymentMethodId = Number(metadata.blacketPaymentMethodId);
        const nextSubscriptionId = Number(metadata.blacketSubscriptionId);
        const nextBillingInterval = metadata.billingInterval as BillingInterval;
        const shouldApplySubscriptionChange = Number.isInteger(nextSubscriptionId) &&
            nextSubscriptionId > 0 &&
            nextBillingInterval !== null;
        let completedTransaction: Transaction | null = null;

        await this.prismaService.$transaction(async (tx) => {
            const activeSubscription = shouldApplySubscriptionChange ? await tx.subscription.findUnique({
                where: { id: nextSubscriptionId }
            }) : userSubscription.subscription;
            if (!activeSubscription) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

            await tx.userSubscription.update({
                where: { id: userSubscription.id },
                data: {
                    status: UserSubscriptionStatus.ACTIVE,
                    subscriptionId: shouldApplySubscriptionChange ? nextSubscriptionId : userSubscription.subscriptionId,
                    billingInterval: shouldApplySubscriptionChange ? nextBillingInterval : userSubscription.billingInterval,
                    expiresAt: periodEnd ? new Date(periodEnd * 1000) : userSubscription.expiresAt,
                    pendingChangeType: null,
                    pendingChangeToSubscriptionId: null,
                    pendingChangeToBillingInterval: null,
                    pendingChangeEffectiveAt: null
                }
            });
            await this.connectSubscriptionGroup(userSubscription.userId, activeSubscription, tx);

            if (
                shouldApplySubscriptionChange &&
                userSubscription.subscription.groupId !== activeSubscription.groupId
            ) {
                await this.disconnectSubscriptionGroupIfUnused(userSubscription.userId, userSubscription.subscription.groupId, userSubscription.id, tx,);
            }

            const previousUserSubscriptionId = Number(metadata.previousUserSubscriptionId);
            if (
                Number.isInteger(previousUserSubscriptionId) &&
                previousUserSubscriptionId > 0 &&
                previousUserSubscriptionId !== userSubscription.id
            ) {
                const previousSubscription = await tx.userSubscription.update({
                    where: { id: previousUserSubscriptionId },
                    data: {
                        status: UserSubscriptionStatus.CANCELED,
                        expiresAt: new Date()
                    },
                    include: {
                        subscription: {
                            select: { groupId: true }
                        }
                    }
                });
                await this.disconnectSubscriptionGroupIfUnused(userSubscription.userId, previousSubscription.subscription.groupId, previousSubscription.id, tx,);
            }

            if (!existingTransaction && stripePaymentId) {
                completedTransaction = await tx.transaction.create({
                    data: {
                        user: { connect: { id: userSubscription.userId } },
                        subscription: {
                            connect: { id: activeSubscription.id }
                        },
                        paymentMethod: Number.isInteger(paymentMethodId) ? { connect: { id: paymentMethodId } } : undefined,
                        amount: event.amount_paid / 100,
                        quantity: 1,
                        currency: CurrencyType.USD,
                        ipAddress: { connect: { id: ip.id } },
                        status: TransactionStatus.COMPLETED,
                        stripePaymentId: stripePaymentId
                    }
                });
            }
        });

        // TODO: make this into a seperate file for webhooks
        if (completedTransaction) {
            const webhookUrl =
                this.configService.get<string>("SERVER_DISCORD_PURCHASE_WEBHOOK_URL",) ||
                this.configService.get<string>("SERVER_DISCORD_PAYMENT_WEBHOOK_URL",);

            if (webhookUrl) {
                await axios
                    .post(webhookUrl, {
                        content: "@everyone",
                        embeds: [
                            {
                                title: "✅ Subscription Invoice Paid",
                                fields: [
                                    {
                                        name: "__``User Information``__",
                                        value:
                                            "**ID:** " +
                                            userSubscription.user.id +
                                            "\n" +
                                            "**Username:** " +
                                            userSubscription.user.username +
                                            "\n" +
                                            "**Email:** " +
                                            (userSubscription.user.email ||
                                                "None") +
                                            "\n" +
                                            "**IP:** " +
                                            ipAddress +
                                            "\n",
                                        inline: false
                                    },
                                    {
                                        name: "__``Subscription Information``__",
                                        value:
                                            "**ID:** " +
                                            userSubscription.subscription
                                                .id +
                                            "\n" +
                                            "**Name:** " +
                                            userSubscription.subscription
                                                .name +
                                            "\n" +
                                            "**Interval:** " +
                                            userSubscription.billingInterval +
                                            "\n",
                                        inline: false
                                    },
                                    {
                                        name: "__``Transaction Information``__",
                                        value:
                                            "**Stripe ID:** " +
                                            stripePaymentId +
                                            "\n" +
                                            "**Transaction ID:** " +
                                            completedTransaction.id +
                                            "\n" +
                                            "**Amount:** $" +
                                            (
                                                event.amount_paid / 100
                                            ).toFixed(2) +
                                            "\n" +
                                            "**Quantity:** 1\n",
                                        inline: false
                                    }
                                ],
                                color: 0x00ff00,
                                thumbnail: {
                                    url: `${this.configService.get<string>("VITE_MEDIA_URL")}/content/icons/success.png`
                                },
                                footer: {
                                    text: `Created At: ${new Date(completedTransaction.createdAt).toLocaleString()}`
                                }
                            }
                        ]
                    }, {
                        headers: {
                            "Content-Type": "application/json"
                        }
                    },)
                    .catch((err) =>
                        console.error("Error sending subscription invoice webhook:", err,),);
            }
        }

        this.permissionsService.clearCache(userSubscription.userId);
        this.socketService.emitUserRefetchMeEvent(userSubscription.userId);
    }

    async handleInvoiceFailed(event: Stripe.Invoice) {
        const stripeSubscriptionId = this.getInvoiceSubscriptionId(event);
        if (!stripeSubscriptionId) return;

        const userSubscription = await this.prismaService.userSubscription.findUnique({
            where: { stripeSubscriptionId }
        });
        if (!userSubscription) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

        await this.prismaService.userSubscription.update({
            where: { id: userSubscription.id },
            data: { status: UserSubscriptionStatus.INACTIVE }
        });

        this.permissionsService.clearCache(userSubscription.userId);
        this.socketService.emitUserRefetchMeEvent(userSubscription.userId);
    }

    async handleSubscriptionEnd(event: Stripe.Subscription) {
        const userSubscription = await this.prismaService.userSubscription.findUnique({
            where: { stripeSubscriptionId: event.id },
            include: {
                subscription: {
                    select: { groupId: true }
                }
            }
        });
        if (!userSubscription) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

        await this.prismaService.$transaction(async (tx) => {
            await tx.userSubscription.update({
                where: { id: userSubscription.id },
                data: {
                    status: UserSubscriptionStatus.CANCELED,
                    expiresAt: new Date(event.current_period_end * 1000)
                }
            });
            await this.disconnectSubscriptionGroupIfUnused(userSubscription.userId, userSubscription.subscription.groupId, userSubscription.id, tx,);
        });

        this.permissionsService.clearCache(userSubscription.userId);
        this.socketService.emitUserRefetchMeEvent(userSubscription.userId);
    }

    async handlePaymentMethodAttached(event: Stripe.PaymentMethod) {
        const user = await this.getUserByCustomerId(String(event.customer));
        if (!user) return;

        const exists = await this.getPaymentMethodByStripeId(event.id, user.id);
        if (exists) return;

        let type: PaymentMethodType;
        let value: string;

        switch (event.type) {
            case "card":
                type = PaymentMethodType.CARD;
                value = `${event.card?.brand?.toUpperCase() || "CARD"} ${event.card?.last4}`;
                break;
            case "cashapp":
                type = PaymentMethodType.CASHAPP;
                value = event.cashapp?.cashtag || "CASHAPP {id}";
                break;
            case "paypal":
                type = PaymentMethodType.PAYPAL;
                value = event.paypal?.payer_email || "PAYPAL {id}";
                break;
            default:
                type = PaymentMethodType.UNKNOWN;
                value = "UNKNOWN {id}";
                break;
        }

        await this.prismaService.$transaction(async (tx) => {
            const paymentMethod = await tx.userPaymentMethod.create({
                data: {
                    userId: user.id,
                    paymentMethodId: event.id,
                    type,
                    value
                }
            });

            if (value.includes("{id}")) {
                paymentMethod.value = value.replace("{id}", paymentMethod.id.toString(),);

                await tx.userPaymentMethod.update({
                    where: { id: paymentMethod.id },
                    data: { value: paymentMethod.value }
                });
            }

            this.socketService.emitPaymentMethodEvent(user.id, {
                create: paymentMethod
            });
        });
    }

    // customer isn't returned when payment methods are detached, so we have to search for it
    async handlePaymentMethodDetached(event: Stripe.PaymentMethod) {
        return await this.prismaService.$transaction(async (tx) => {
            const paymentMethod = await this.getPaymentMethodByStripeId(event.id,);
            if (!paymentMethod) return;

            await tx.userPaymentMethod.update({
                where: { id: paymentMethod.id },
                data: { deletedAt: new Date() }
            });

            this.socketService.emitPaymentMethodEvent(paymentMethod.userId, {
                delete: paymentMethod.id
            });
        });
    }

    // this is mainly just for updating the default payment method
    async handleCustomerUpdated(event: Stripe.Customer) {
        const user = await this.getUserByCustomerId(event.id);
        if (!user) return;

        if (event.invoice_settings?.default_payment_method) {
            const paymentMethod = await this.getPaymentMethodByStripeId(String(event.invoice_settings.default_payment_method), user.id,);
            if (!paymentMethod) return;

            await this.prismaService.$transaction(async (tx) => {
                await tx.userPaymentMethod.updateMany({
                    data: { primary: false },
                    where: { userId: user.id }
                });

                await tx.userPaymentMethod.update({
                    where: { id: paymentMethod.id },
                    data: { primary: true }
                });

                this.socketService.emitPaymentMethodEvent(user.id, {
                    update: {
                        ...paymentMethod,
                        primary: true
                    }
                });
            });
        }
    }

    async createPortal(userId: string): Promise<StripeCreatePortalEntity> {
        const portalExists = await this.redisService.getKey("stripe-portal", userId);
        if (portalExists) return new StripeCreatePortalEntity(portalExists);

        const customer = await this.getOrCreateCustomer(userId);
        if (!customer) throw new NotFoundException(NotFound.UNKNOWN_CUSTOMER);

        const portalSession = await this.stripe.billingPortal.sessions.create({
            customer: customer.id,
            configuration: this.configService.get<string>("SERVER_STRIPE_PORTAL_CONFIGURATION_ID")
        });
        if (!portalSession) throw new InternalServerErrorException(InternalServerError.DEFAULT);

        const res = { url: portalSession.url };

        await this.redisService.setKey("stripe-portal", userId, res, 300);

        return new StripeCreatePortalEntity(res);
    }

    // TODO: theres a lot of repeating here and lifetime subscriptions should mock a payment created by a normal purchase
    async createSubscription(userId: string, subscriptionId: number, dto: StripeCreatePaymentIntentDto, ipAddress: string) {
        if (!dto.interval) {
            throw new BadRequestException("A billing interval is required.");
        }

        const plan = await this.prismaService.subscription.findUnique({
            where: { id: subscriptionId }
        });
        if (!plan) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

        const existingSubscription = await this.prismaService.userSubscription.findFirst({
            where: {
                userId,
                status: {
                    in: [
                        UserSubscriptionStatus.ACTIVE,
                        UserSubscriptionStatus.PENDING_CANCELLATION
                    ]
                },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: [
                { status: "asc" },
                { createdAt: "desc" }
            ],
            include: { subscription: true }
        });

        const paymentMethod = await this.prismaService.userPaymentMethod.findUnique({
            where: {
                userId,
                paymentMethodId: dto.paymentMethodId
            }
        });
        if (!paymentMethod) throw new NotFoundException(NotFound.UNKNOWN_PAYMENT_METHOD);
        if (paymentMethod.type !== PaymentMethodType.CARD) throw new ForbiddenException(Forbidden.DEFAULT);

        const customer = await this.getOrCreateCustomer(userId);
        const ip = await this.prismaService.ipAddress.upsert({
            where: { ipAddress },
            create: { ipAddress },
            update: {}
        });

        if (dto.interval === "LIFETIME") {
            if (!plan.lifetimePrice) throw new BadRequestException("This plan does not support lifetime billing.");

            const lifetimeAmount = Math.round(plan.lifetimePrice * 100);
            const creditAmount = existingSubscription ? await this.getRemainingSubscriptionCredit(existingSubscription) : 0;
            const finalAmount = Math.max(0, lifetimeAmount - creditAmount);

            const userSubscription = await this.prismaService.userSubscription.create({
                data: {
                    userId,
                    subscriptionId: plan.id,
                    billingInterval: "LIFETIME",
                    status: UserSubscriptionStatus.INACTIVE,
                    ipAddressId: ip.id,
                    expiresAt: null
                }
            });

            const transaction = await this.prismaService.transaction.create({
                data: {
                    user: { connect: { id: userId } },
                    subscription: { connect: { id: userSubscription.id } },
                    paymentMethod: { connect: { id: paymentMethod.id } },
                    amount: finalAmount / 100,
                    quantity: 1,
                    currency: CurrencyType.USD,
                    ipAddress: { connect: { id: ip.id } },
                    status: TransactionStatus.PENDING
                }
            });

            if (finalAmount === 0) {
                const user = await this.prismaService.user.findUnique({
                    where: { id: userId }
                });

                if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

                await this.handlePaymentSuccess({
                    user,
                    transaction,
                    ipAddress,
                    lifetimeSubscription: {
                        userSubscriptionId: userSubscription.id,
                        subscription: plan,
                        previousUserSubscriptionId: existingSubscription?.id,
                        previousStripeSubscriptionId: existingSubscription?.stripeSubscriptionId ?? undefined
                    }
                });

                const updatedSubscription = await this.prismaService.userSubscription.findUnique({
                    where: { id: userSubscription.id }
                });

                return {
                    subscription: updatedSubscription ?? userSubscription,
                    clientSecret: null
                };
            }

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: finalAmount,
                currency: "usd",

                customer: customer.id,
                payment_method: paymentMethod.paymentMethodId,

                confirm: true,

                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: "never"
                },

                description: `${plan.name} Lifetime`,

                metadata: {
                    blacketUserId: userId,
                    blacketSubscriptionId: plan.id.toString(),
                    blacketUserSubscriptionId: userSubscription.id.toString(),
                    blacketTransactionId: transaction.id,
                    previousUserSubscriptionId: existingSubscription?.id.toString() ?? "",
                    previousStripeSubscriptionId: existingSubscription?.stripeSubscriptionId ?? "",
                    blacketPaymentMethodId: paymentMethod.id.toString(),
                    billingInterval: "LIFETIME",
                    ipAddress
                }
            });
            if (paymentIntent.status === "succeeded") {
                await this.handlePaymentIntentSuccess(paymentIntent);
            }

            return {
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.status === "requires_action" ||
                    paymentIntent.status === "requires_confirmation" ? paymentIntent.client_secret : null
            };
        }

        if (existingSubscription && existingSubscription.billingInterval !== "LIFETIME") {
            throw new ConflictException(Conflict.STRIPE_SUBSCRIPTION_ALREADY_EXISTS);
        }

        const priceId = this.getSubscriptionPriceId(plan, dto.interval);
        if (!priceId) throw new BadRequestException("This plan does not support the selected billing interval.");

        const userSubscription = await this.prismaService.userSubscription.create({
            data: {
                userId,
                subscriptionId: plan.id,
                billingInterval: dto.interval,
                status: UserSubscriptionStatus.INACTIVE,
                ipAddressId: ip.id
            }
        });

        const stripeSubscription = await this.stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            default_payment_method: paymentMethod.paymentMethodId,
            payment_behavior: "error_if_incomplete",
            expand: ["latest_invoice.payment_intent"],
            metadata: {
                blacketUserId: userId,
                blacketSubscriptionId: plan.id.toString(),
                blacketUserSubscriptionId: userSubscription.id.toString(),
                blacketPaymentMethodId: paymentMethod.id.toString(),
                previousUserSubscriptionId: existingSubscription?.id.toString() ?? "",
                previousStripeSubscriptionId: existingSubscription?.stripeSubscriptionId ?? "",
                billingInterval: dto.interval,
                ipAddress
            }
        });

        await this.handleSubscriptionCreate(stripeSubscription);

        return {
            subscriptionId: stripeSubscription.id,
            clientSecret: this.getSubscriptionClientSecret(stripeSubscription)
        };
    }

    async createPaymentIntent(userId: string,
        productId: number,
        dto: StripeCreatePaymentIntentDto,
        ipAddress: string) {
        const product = await this.redisService.getProduct(productId);
        if (!product || product.price === 0 || product.isPriceUsingCrystals) throw new NotFoundException(NotFound.UNKNOWN_PRODUCT);

        let quantity = dto.quantity;

        if (!quantity || quantity <= 0) quantity = 1;
        if (product.isQuantityCapped && quantity > 1) quantity = 1;

        const PRICE = Math.round(product.price * quantity * 100);
        const FINAL_PRICE_STRING = !product.discount ? PRICE : (PRICE * (1 - product.discount / 100)).toFixed(2);
        const FINAL_PRICE = Number(FINAL_PRICE_STRING);
        const STATEMENT_DESCRIPTOR = product.name
            .toUpperCase()
            .replaceAll(" ", "")
            .substring(0, 22);

        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);
        if (!user.stripeCustomerId) throw new NotFoundException(NotFound.UNKNOWN_CUSTOMER);

        const ip = await this.prismaService.ipAddress.upsert({
            where: { ipAddress },
            create: { ipAddress },
            update: {}
        });
        if (!ip) {
            console.error(`Failed to upsert IP address ${ipAddress} for user ${user.username}`,);

            throw new InternalServerErrorException(InternalServerError.DEFAULT);
        }

        const paymentMethod =
            await this.prismaService.userPaymentMethod.findUnique({
                where: {
                    userId,
                    paymentMethodId: dto.paymentMethodId
                }
            });
        if (!paymentMethod) throw new NotFoundException(NotFound.UNKNOWN_PAYMENT_METHOD);

        // TODO: we need to implement other types of payment methods, for now we only allow cards
        // this will be complete AFTER rewrite
        if (paymentMethod.type !== PaymentMethodType.CARD) throw new ForbiddenException(Forbidden.DEFAULT);

        const transaction = await this.prismaService.transaction.create({
            data: {
                user: { connect: { id: user.id } },
                product: { connect: { id: product.id } },
                paymentMethod: { connect: { id: paymentMethod.id } },
                amount: FINAL_PRICE / 100,
                quantity,
                currency: CurrencyType.USD,
                ipAddress: { connect: { id: ip.id } },
                status: TransactionStatus.PENDING
            }
        });

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: FINAL_PRICE,
            currency: "usd",

            customer: user.stripeCustomerId,
            payment_method: paymentMethod.paymentMethodId,

            confirm: true,

            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            },

            statement_descriptor_suffix: STATEMENT_DESCRIPTOR,
            description: `x${quantity} ${product.name}`,

            metadata: {
                quantity: quantity.toString(),
                blacketProductId: productId.toString(),
                blacketUserId: user.id,
                blacketPaymentMethodId: paymentMethod.id.toString(),
                blacketTransactionId: transaction.id,
                ipAddress: ip.ipAddress
            }
        });
        if (paymentIntent.status === "succeeded") {
            await this.handlePaymentIntentSuccess(paymentIntent);
        }

        return paymentIntent;
    }

    // buys a plan outright (lifetime) using in-game currency instead of real money.
    // debits tokens/diamonds/crystals with a single conditional UPDATE (WHERE balance >= price)
    // rather than read-then-write, so two concurrent requests can't both pass a stale balance
    // check and double-spend.
    async purchaseSubscriptionWithCurrency(userId: string, subscriptionId: number, ipAddress: string) {
        const plan = await this.prismaService.subscription.findUnique({ where: { id: subscriptionId } });
        if (!plan) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);
        if (!plan.tokenPrice || !plan.diamondPrice || !plan.crystalPrice) throw new ForbiddenException(Forbidden.STRIPE_SUBSCRIPTION_NOT_PURCHASABLE_WITH_CURRENCY);

        const existingSubscription = await this.prismaService.userSubscription.findFirst({
            where: {
                userId,
                status: {
                    in: [
                        UserSubscriptionStatus.ACTIVE,
                        UserSubscriptionStatus.PENDING_CANCELLATION
                    ]
                },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: [
                { status: "asc" },
                { createdAt: "desc" }
            ],
            include: { subscription: true }
        });
        if (existingSubscription && existingSubscription.subscriptionId === plan.id && !existingSubscription.expiresAt) {
            throw new ConflictException(Conflict.STRIPE_SUBSCRIPTION_ALREADY_EXISTS);
        }

        const ip = await this.prismaService.ipAddress.upsert({
            where: { ipAddress },
            create: { ipAddress },
            update: {}
        });

        const userSubscription = await this.prismaService.$transaction(async (tx) => {
            const debited = await tx.user.updateMany({
                where: {
                    id: userId,
                    tokens: { gte: plan.tokenPrice },
                    diamonds: { gte: plan.diamondPrice },
                    crystals: { gte: plan.crystalPrice }
                },
                data: {
                    tokens: { decrement: plan.tokenPrice },
                    diamonds: { decrement: plan.diamondPrice },
                    crystals: { decrement: plan.crystalPrice }
                }
            });
            if (debited.count === 0) throw new ForbiddenException(Forbidden.STRIPE_NOT_ENOUGH_CURRENCY);

            const created = await tx.userSubscription.create({
                data: {
                    userId,
                    subscriptionId: plan.id,
                    billingInterval: BillingInterval.LIFETIME,
                    status: UserSubscriptionStatus.ACTIVE,
                    ipAddressId: ip.id,
                    expiresAt: null
                }
            });

            await this.connectSubscriptionGroup(userId, plan, tx);

            if (existingSubscription && existingSubscription.id !== created.id) {
                const previous = await tx.userSubscription.update({
                    where: { id: existingSubscription.id },
                    data: {
                        status: UserSubscriptionStatus.CANCELED,
                        expiresAt: new Date()
                    },
                    include: {
                        subscription: {
                            select: { groupId: true }
                        }
                    }
                });

                await this.disconnectSubscriptionGroupIfUnused(userId, previous.subscription.groupId, previous.id, tx,);
            }

            return created;
        });

        if (existingSubscription?.stripeSubscriptionId) {
            await this.stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId).catch((err) => console.error("Error canceling previous subscription:", err));
        }

        this.permissionsService.clearCache(userId);
        this.socketService.emitUserRefetchMeEvent(userId);

        return { subscription: userSubscription };
    }

    async purchaseWithCrystals(userId: string,
        productId: number,
        quantity: number,
        ipAddress: string,) {
        const product = await this.redisService.getProduct(productId);
        if (!product || product.price === 0 || !product.isPriceUsingCrystals) throw new NotFoundException(NotFound.UNKNOWN_PRODUCT);

        if (!quantity || quantity <= 0) quantity = 1;
        if (product.isQuantityCapped && quantity > 1) quantity = 1;

        const CRYSTALS_TO_REMOVE = product.discount ? (product.price * quantity * (1 - product.discount / 100)).toFixed(2,) : (product.price * quantity).toFixed(2);

        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);
        if (user.crystals < Number(CRYSTALS_TO_REMOVE)) throw new ForbiddenException(Forbidden.STRIPE_NOT_ENOUGH_CRYSTALS);

        const ip = await this.prismaService.ipAddress.upsert({
            where: { ipAddress },
            create: { ipAddress },
            update: {}
        });
        if (!ip) {
            console.error(`Failed to upsert IP address ${ipAddress} for user ${user.username}`,);

            throw new InternalServerErrorException(InternalServerError.DEFAULT);
        }

        const transaction = await this.prismaService.transaction.create({
            data: {
                user: { connect: { id: user.id } },
                product: { connect: { id: product.id } },
                amount: Number(CRYSTALS_TO_REMOVE),
                quantity,
                currency: CurrencyType.CRYSTAL,
                ipAddress: { connect: { id: ip.id } },
                status: TransactionStatus.PENDING
            }
        });

        return await this.handlePaymentSuccess({
            user,
            product,
            transaction,
            rewards: product.rewards,
            removeCrystals: Number(CRYSTALS_TO_REMOVE),
            ipAddress: ip.ipAddress
        });
    }

    async deleteSubscription(userId: string, userSubscriptionId: number) {
        const userSubscription =
            await this.prismaService.userSubscription.findFirst({
                where: {
                    id: userSubscriptionId,
                    userId
                }
            });
        if (!userSubscription?.stripeSubscriptionId) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

        const currentSubscription = await this.stripe.subscriptions.retrieve(userSubscription.stripeSubscriptionId,);
        const scheduleId = this.getSubscriptionScheduleId(currentSubscription);
        if (scheduleId) await this.stripe.subscriptionSchedules.release(scheduleId);

        const stripeSubscription = await this.stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
            cancel_at_period_end: true
        },);

        const updatedSubscription =
            await this.prismaService.userSubscription.update({
                where: { id: userSubscription.id },
                data: {
                    status: UserSubscriptionStatus.PENDING_CANCELLATION,
                    expiresAt: new Date(stripeSubscription.current_period_end * 1000,),
                    pendingChangeType: null,
                    pendingChangeToSubscriptionId: null,
                    pendingChangeToBillingInterval: null,
                    pendingChangeEffectiveAt: null
                }
            });

        this.socketService.emitUserRefetchMeEvent(userId);

        return { subscription: updatedSubscription };
    }

    // TODO: should be tidied up a lil? go thru this though and tidy it up whenever
    async switchPlan(userId: string,
        targetSubscriptionId: number,
        dto: StripeCreatePaymentIntentDto,
        ipAddress: string,) {
        const userSubscription =
            await this.prismaService.userSubscription.findFirst({
                where: {
                    userId,
                    status: {
                        in: [
                            UserSubscriptionStatus.ACTIVE,
                            UserSubscriptionStatus.PENDING_CANCELLATION
                        ]
                    },
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                },
                orderBy: [
                    { status: "asc" },
                    { createdAt: "desc" }
                ],
                include: { subscription: true }
            });
        if (!userSubscription) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

        const targetPlan = await this.prismaService.subscription.findUnique({
            where: { id: targetSubscriptionId }
        });
        if (!targetPlan) throw new NotFoundException(NotFound.UNKNOWN_SUBSCRIPTION);

        const interval = dto.interval ?? userSubscription.billingInterval;
        if (interval === "LIFETIME") throw new BadRequestException("Use the subscription purchase endpoint for lifetime plans.");

        if (!userSubscription.stripeSubscriptionId) {
            throw new BadRequestException("Use the subscription purchase endpoint to switch away from lifetime plans.");
        }

        const priceId = this.getSubscriptionPriceId(targetPlan, interval);
        if (!priceId) throw new BadRequestException("Selected plan does not support this billing interval.");

        const isPlanUpgrade = targetPlan.priority > userSubscription.subscription.priority;
        const isPlanDowngrade = targetPlan.priority < userSubscription.subscription.priority;
        const isIntervalUpgrade = this.getSubscriptionIntervalRank(interval) > this.getSubscriptionIntervalRank(userSubscription.billingInterval);
        const isUpgrade = isPlanUpgrade || (!isPlanDowngrade && isIntervalUpgrade);
        const stripeSubscription = await this.stripe.subscriptions.retrieve(userSubscription.stripeSubscriptionId,);
        const currentItem = stripeSubscription.items.data[0];
        if (!currentItem) throw new InternalServerErrorException(InternalServerError.DEFAULT);
        const subscriptionItemId = currentItem.id;

        const scheduleId = this.getSubscriptionScheduleId(stripeSubscription);
        const isCurrentSelection =
            targetPlan.id === userSubscription.subscriptionId &&
            interval === userSubscription.billingInterval;
        const hasPendingChange = Boolean(userSubscription.pendingChangeToSubscriptionId,);
        const clearPendingChangeData = {
            pendingChangeType: null,
            pendingChangeToSubscriptionId: null,
            pendingChangeToBillingInterval: null,
            pendingChangeEffectiveAt: null
        };

        if (isCurrentSelection) {
            if (hasPendingChange && scheduleId) {
                await this.stripe.subscriptionSchedules.release(scheduleId);
            }

            const updatedSubscription =
                await this.prismaService.userSubscription.update({
                    where: { id: userSubscription.id },
                    data: clearPendingChangeData
                });

            this.socketService.emitUserRefetchMeEvent(userId);

            return { subscription: updatedSubscription };
        }

        if (isUpgrade) {
            if (scheduleId) {
                await this.stripe.subscriptionSchedules.release(scheduleId);
            }

            if (!dto.paymentMethodId) throw new NotFoundException(NotFound.UNKNOWN_PAYMENT_METHOD);

            const paymentMethod =
                await this.prismaService.userPaymentMethod.findUnique({
                    where: {
                        userId,
                        paymentMethodId: dto.paymentMethodId
                    }
                });
            if (!paymentMethod) throw new NotFoundException(NotFound.UNKNOWN_PAYMENT_METHOD);

            await this.stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
                default_payment_method: paymentMethod.paymentMethodId,
                proration_behavior: "always_invoice",
                payment_behavior: "error_if_incomplete",
                items: [
                    {
                        id: subscriptionItemId,
                        price: priceId
                    }
                ],
                metadata: this.getSubscriptionSwitchMetadata({
                    userId,
                    subscriptionId: targetPlan.id,
                    userSubscriptionId: userSubscription.id,
                    billingInterval: interval,
                    pAYMENTMETHODID: paymentMethod.id,
                    ipAddress
                })
            },);

            const updatedSubscription =
                await this.prismaService.$transaction(async (tx) => {
                    const updatedSubscription = await tx.userSubscription.update({
                        where: { id: userSubscription.id },
                        data: {
                            subscriptionId: targetPlan.id,
                            billingInterval: interval,
                            ...clearPendingChangeData
                        }
                    });

                    await this.connectSubscriptionGroup(userId, targetPlan, tx);
                    if (userSubscription.subscription.groupId !== targetPlan.groupId) {
                        await this.disconnectSubscriptionGroupIfUnused(userId, userSubscription.subscription.groupId, userSubscription.id, tx,);
                    }

                    return updatedSubscription;
                });

            this.socketService.emitUserRefetchMeEvent(userId);

            return { subscription: updatedSubscription };
        }

        const subscriptionSchedule = scheduleId ? await this.stripe.subscriptionSchedules.retrieve(scheduleId) : await this.stripe.subscriptionSchedules.create({
            from_subscription: userSubscription.stripeSubscriptionId
        });

        const currentPhase = subscriptionSchedule.phases[0];
        if (!currentPhase) throw new InternalServerErrorException(InternalServerError.DEFAULT);

        await this.stripe.subscriptionSchedules.update(subscriptionSchedule.id, {
            end_behavior: "release",
            phases: [
                {
                    start_date: currentPhase.start_date,
                    items: [
                        {
                            price: currentItem.price.id,
                            quantity: currentItem.quantity
                        }
                    ],
                    end_date: stripeSubscription.current_period_end,
                    proration_behavior: "none"
                },
                {
                    items: [
                        {
                            price: priceId,
                            quantity: 1
                        }
                    ],
                    proration_behavior: "none",
                    metadata: this.getSubscriptionSwitchMetadata({
                        userId,
                        subscriptionId: targetPlan.id,
                        userSubscriptionId: userSubscription.id,
                        billingInterval: interval,
                        ipAddress
                    })
                }
            ]
        },);

        const updatedSubscription =
            await this.prismaService.userSubscription.update({
                where: { id: userSubscription.id },
                data: {
                    pendingChangeType:
                        targetPlan.id === userSubscription.subscriptionId ? "INTERVAL_CHANGE" : "DOWNGRADE",
                    pendingChangeToSubscriptionId: targetPlan.id,
                    pendingChangeToBillingInterval: interval,
                    pendingChangeEffectiveAt: new Date(stripeSubscription.current_period_end * 1000,)
                }
            });

        this.socketService.emitUserRefetchMeEvent(userId);

        return { subscription: updatedSubscription };
    }
}
