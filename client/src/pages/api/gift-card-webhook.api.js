import Stripe from "stripe";

import {
  postGiftCardOrder,
  toPaymentSummary,
} from "@/_assets/server/gift-card-order-api";

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("Webhook payload too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_GIFT_CARD_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];
  if (!secretKey || !webhookSecret) {
    console.error("[gift-card-webhook-error] Configuration Stripe absente");
    return res.status(503).json({ error: "Webhook non configuré" });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error(
      "[gift-card-webhook-signature-error]",
      error?.message || error,
    );
    return res.status(400).json({ error: "Signature webhook invalide" });
  }

  if (
    ![
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "payment_intent.canceled",
    ].includes(event.type)
  ) {
    return res.status(200).json({ received: true });
  }

  const paymentIntent = event.data?.object;
  if (paymentIntent?.metadata?.type !== "gift_card") {
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    const account = await stripe.accounts.retrieve();
    const payment = toPaymentSummary(paymentIntent, account.id);
    const checkoutId = paymentIntent.metadata.checkoutId;

    if (event.type === "payment_intent.succeeded") {
      await postGiftCardOrder("finalize", {
        checkoutId,
        payment,
        trigger: "stripe_webhook",
      });
    } else {
      await postGiftCardOrder("payment-event", {
        checkoutId,
        payment,
        status:
          event.type === "payment_intent.canceled" ? "canceled" : "failed",
      });
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    if (error?.code === "FINALIZATION_IN_PROGRESS") {
      // Le traitement critique n'est pas encore durablement terminé. Une
      // réponse non-2xx demande à Stripe de rejouer l'événement ; le retry
      // sera absorbé idempotemment si l'autre finaliseur termine entre-temps.
      return res.status(500).json({ error: "Finalisation en cours" });
    }
    console.error("[gift-card-webhook-error]", {
      eventId: event.id,
      checkoutId: paymentIntent?.metadata?.checkoutId || null,
      paymentIntentId: paymentIntent?.id || null,
      restaurantId: paymentIntent?.metadata?.restaurantId || null,
      giftId: paymentIntent?.metadata?.giftId || null,
      code: error?.code || "WEBHOOK_PROCESSING_FAILED",
      message: error?.message || String(error),
    });
    return res.status(500).json({ error: "Traitement webhook impossible" });
  }
}
