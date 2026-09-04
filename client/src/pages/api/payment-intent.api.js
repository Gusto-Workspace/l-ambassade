import crypto from "crypto";
import Stripe from "stripe";

import {
  postGiftCardOrder,
  toPaymentSummary,
} from "@/_assets/server/gift-card-order-api";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_CHECKOUTS = 30;
const createAttempts = new Map();
let stripeAccountPromise = null;

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Configuration Stripe absente");
  return new Stripe(secretKey, { apiVersion: "2024-06-20" });
}

function validateCheckoutId(value) {
  return /^[a-zA-Z0-9_-]{16,128}$/.test(String(value || ""));
}

function getClientIp(req) {
  return String(
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown",
  )
    .split(",")[0]
    .trim();
}

function getRequestFingerprint(req) {
  const secret = process.env.GUSTO_SHARED_SECRET;
  if (!secret) throw new Error("Configuration de signature absente");
  return crypto
    .createHmac("sha256", secret)
    .update(getClientIp(req))
    .digest("hex");
}

function enforceCreateRateLimit(req, checkoutId) {
  const now = Date.now();
  const key = getClientIp(req);
  const recent = (createAttempts.get(key) || []).filter(
    (entry) => now - entry.at < RATE_LIMIT_WINDOW_MS,
  );
  if (!recent.some((entry) => entry.checkoutId === checkoutId)) {
    recent.push({ checkoutId, at: now });
  }
  createAttempts.set(key, recent);
  if (recent.length > RATE_LIMIT_MAX_CHECKOUTS) {
    const error = new Error(
      "Trop de tentatives. Veuillez patienter quelques minutes.",
    );
    error.status = 429;
    error.code = "RATE_LIMITED";
    throw error;
  }
}

async function getStripeAccountId(stripe) {
  if (!stripeAccountPromise) {
    stripeAccountPromise = stripe.accounts
      .retrieve()
      .then((account) => account.id);
  }
  try {
    return await stripeAccountPromise;
  } catch (error) {
    stripeAccountPromise = null;
    throw error;
  }
}

function getFallbackImageUrl() {
  const baseUrl = String(process.env.NEXT_PUBLIC_BASE_URL || "").trim();
  if (!baseUrl) return "";
  try {
    return new URL("/img/home/la-tablee.webp", baseUrl).toString();
  } catch {
    return "";
  }
}

function sendError(res, error, context = {}) {
  const status = Number(error?.status) || 500;
  console.error("[gift-card-payment-api-error]", {
    ...context,
    code: error?.code || "INTERNAL_ERROR",
    status,
    message: error?.message || String(error),
  });
  return res.status(status).json({
    error:
      status >= 500
        ? "Le paiement est momentanément indisponible. Veuillez réessayer."
        : error.message,
    code: error?.code || "INTERNAL_ERROR",
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const body = req.body || {};
  const action = body.action || "create";
  const restaurantId = String(body.restaurantId || "");
  const giftId = String(body.giftId || "");
  const configuredRestaurantId = String(
    process.env.NEXT_PUBLIC_RESTAURANT_ID || "",
  ).trim();

  try {
    if (!configuredRestaurantId || restaurantId !== configuredRestaurantId) {
      return res.status(400).json({ error: "Restaurant invalide" });
    }
    const stripe = getStripeClient();
    const stripeAccountId = await getStripeAccountId(stripe);

    if (action === "create") {
      const checkoutId = String(body.checkoutId || "");
      if (!validateCheckoutId(checkoutId)) {
        return res.status(400).json({ error: "Session de paiement invalide" });
      }
      enforceCreateRateLimit(req, checkoutId);

      if (!body.formData || typeof body.formData !== "object") {
        return res.status(400).json({
          error: "Les informations de la carte cadeau sont requises.",
          code: "INVALID_CUSTOMER_DATA",
        });
      }

      const checkout = await postGiftCardOrder("checkout", {
        checkoutId,
        restaurantId,
        giftId,
        customerData: body.formData,
        fallbackImageUrl: getFallbackImageUrl(),
        requestFingerprint: getRequestFingerprint(req),
      });
      if (Number(body.amount) !== checkout.order.amount) {
        return res.status(409).json({
          error: "Le prix de cette carte a changé. Rechargez la page.",
          code: "AMOUNT_MISMATCH",
        });
      }

      let paymentIntent = await stripe.paymentIntents.create(
        {
          amount: checkout.order.amount,
          currency: checkout.order.currency,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
          metadata: { restaurantId, giftId, checkoutId, type: "gift_card" },
        },
        { idempotencyKey: checkoutId },
      );
      if (paymentIntent.metadata?.type !== "gift_card") {
        paymentIntent = await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: { restaurantId, giftId, checkoutId, type: "gift_card" },
        });
      }
      await postGiftCardOrder("payment-intent", {
        checkoutId,
        restaurantId,
        giftId,
        paymentIntentId: paymentIntent.id,
        stripeAccountId,
      });
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        checkoutId,
      });
    }

    if (action === "finalize") {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        String(body.paymentIntentId || ""),
      );
      const result = await postGiftCardOrder("finalize", {
        checkoutId: String(body.checkoutId || ""),
        payment: toPaymentSummary(paymentIntent, stripeAccountId),
        trigger: "frontend",
      });
      return res.status(200).json(result);
    }

    if (action === "status") {
      let result = await postGiftCardOrder("status", {
        checkoutId: String(body.checkoutId || ""),
        restaurantId,
        giftId,
      });
      if (
        result.order?.paymentIntentId &&
        result.order?.finalizationStatus !== "finalized"
      ) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          result.order.paymentIntentId,
        );
        if (paymentIntent.status === "succeeded") {
          try {
            result = await postGiftCardOrder("finalize", {
              checkoutId: result.order.checkoutId,
              payment: toPaymentSummary(paymentIntent, stripeAccountId),
              trigger: "recovery",
            });
          } catch (error) {
            if (error?.code !== "FINALIZATION_IN_PROGRESS") throw error;
            result = await postGiftCardOrder("status", {
              checkoutId: String(body.checkoutId || ""),
              restaurantId,
              giftId,
            });
          }
        }
      }
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: "Action invalide" });
  } catch (error) {
    return sendError(res, error, {
      checkoutId: body.checkoutId || null,
      paymentIntentId: body.paymentIntentId || null,
      restaurantId: restaurantId || null,
      giftId: giftId || null,
    });
  }
}
