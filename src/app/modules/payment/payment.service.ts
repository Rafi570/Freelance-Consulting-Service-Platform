import Stripe from 'stripe';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

const stripe = new Stripe(config.stripe.secret_key);

const createOrderCheckoutSession = async (userId: string, orderId: string) => {
  // 1. Fetch order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      gig: true,
      package: true,
      client: true,
    },
  });

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  if (order.clientId !== userId) {
    throw new AppError(403, 'You are not authorized to pay for this order.');
  }

  if (order.paymentStatus === 'PAID') {
    throw new AppError(400, 'This order has already been paid for.');
  }

  // 2. Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: order.client.email,
    client_reference_id: order.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${order.gig.title} (${order.package.tier} Package)`,
            description: `${order.package.name} - ${order.package.deliveryTimeInDays} days delivery`,
          },
          unit_amount: Math.round(order.price * 100), // Stripe expects amounts in cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'ORDER',
      orderId: order.id,
      userId,
      gigId: order.gigId,
      packageTier: order.package.tier,
    },
    success_url: config.stripe.success_url,
    cancel_url: config.stripe.cancel_url,
  });

  // 3. Upsert payment record in database
  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      userId,
      orderId: order.id,
      type: 'ORDER',
      sessionId: session.id,
      amount: order.price,
      currency: 'usd',
      status: 'UNPAID',
    },
    update: {
      sessionId: session.id,
      amount: order.price,
      status: 'UNPAID',
    },
  });

  return {
    paymentUrl: session.url,
    sessionId: session.id,
    orderId: order.id,
    amount: order.price,
  };
};

const createSubscriptionCheckoutSession = async (providerId: string) => {
  // 1. Fetch provider details
  const provider = await prisma.user.findUnique({
    where: { id: providerId },
    include: { profile: true },
  });

  if (!provider || provider.role !== 'PROVIDER') {
    throw new AppError(403, 'Only registered service providers can purchase a premium subscription.');
  }

  if (provider.profile?.isSubscribed) {
    throw new AppError(400, 'You already have an active Premium Subscription!');
  }

  const fee = config.stripe.subscription_fee;

  // 2. Create Stripe Checkout Session for Subscription
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: provider.email,
    client_reference_id: provider.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Freelance Platform - Provider Premium Subscription',
            description: 'Unlock unlimited gig creation and premium platform features.',
          },
          unit_amount: Math.round(fee * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'SUBSCRIPTION',
      userId: provider.id,
    },
    success_url: config.stripe.success_url,
    cancel_url: config.stripe.cancel_url,
  });

  // 3. Create payment record in database
  await prisma.payment.create({
    data: {
      userId: provider.id,
      type: 'SUBSCRIPTION',
      sessionId: session.id,
      amount: fee,
      currency: 'usd',
      status: 'UNPAID',
    },
  });

  return {
    paymentUrl: session.url,
    sessionId: session.id,
    amount: fee,
  };
};

const verifyPaymentSession = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    throw new AppError(404, 'Stripe session not found.');
  }

  if (session.payment_status === 'paid') {
    const paymentType = session.metadata?.type;
    const transactionId = (session.payment_intent as string) || session.id;

    if (paymentType === 'ORDER') {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'PAID',
              status: 'IN_PROGRESS',
            },
          });

          await tx.payment.upsert({
            where: { sessionId },
            update: {
              status: 'PAID',
              transactionId,
            },
            create: {
              userId: session.metadata?.userId || '',
              orderId,
              type: 'ORDER',
              sessionId,
              transactionId,
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || 'usd',
              status: 'PAID',
            },
          });
        });

        return {
          success: true,
          type: 'ORDER',
          message: 'Order payment verified successfully! Order is now in progress.',
          orderId,
          transactionId,
          amount: (session.amount_total || 0) / 100,
        };
      }
    } else if (paymentType === 'SUBSCRIPTION') {
      const userId = session.metadata?.userId;
      if (userId) {
        await prisma.$transaction(async (tx) => {
          await tx.providerProfile.update({
            where: { userId },
            data: { isSubscribed: true },
          });

          await tx.payment.upsert({
            where: { sessionId },
            update: {
              status: 'PAID',
              transactionId,
            },
            create: {
              userId,
              type: 'SUBSCRIPTION',
              sessionId,
              transactionId,
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || 'usd',
              status: 'PAID',
            },
          });
        });

        return {
          success: true,
          type: 'SUBSCRIPTION',
          message: 'Provider Premium Subscription activated! You can now create unlimited gigs.',
          userId,
          transactionId,
          amount: (session.amount_total || 0) / 100,
        };
      }
    }
  }

  return {
    success: false,
    message: `Payment status is ${session.payment_status}. Payment not completed yet.`,
    paymentStatus: session.payment_status,
  };
};

const handleStripeWebhook = async (signature: string, rawBody: Buffer) => {
  if (!config.stripe.webhook_secret) {
    throw new AppError(500, 'Stripe webhook secret is not configured in .env');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe.webhook_secret
    );
  } catch (err: any) {
    throw new AppError(400, `Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await verifyPaymentSession(session.id);
  }

  return { received: true };
};

const getMyPayments = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        include: {
          gig: {
            select: {
              id: true,
              title: true,
            },
          },
          package: true,
        },
      },
    },
  });

  return payments;
};

export const PaymentService = {
  createOrderCheckoutSession,
  createSubscriptionCheckoutSession,
  verifyPaymentSession,
  handleStripeWebhook,
  getMyPayments,
};
