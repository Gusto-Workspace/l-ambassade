import crypto from "crypto";
import Stripe from "stripe";

const MAX_STRIPE_AMOUNT = 99_999_999;

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Configuration Stripe absente");
  return new Stripe(secretKey, { apiVersion: "2024-06-20" });
}

function validateCheckoutId(value) {
  return /^[a-zA-Z0-9_-]{16,128}$/.test(String(value || ""));
}

async function getTrustedGiftCard(
  restaurantId,
  giftId,
  { requireAvailable = true } = {},
) {
  const configuredRestaurantId = String(
    process.env.NEXT_PUBLIC_RESTAURANT_ID || "",
  ).trim();
  const apiUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_URL);

  if (!configuredRestaurantId || !apiUrl) {
    throw new Error("Configuration restaurant absente");
  }
  if (String(restaurantId) !== configuredRestaurantId) {
    return { error: "Restaurant invalide", status: 400 };
  }

  const response = await fetch(
    `${apiUrl}/restaurants/${encodeURIComponent(configuredRestaurantId)}`,
    { headers: { Accept: "application/json" }, cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("Le catalogue de cartes cadeaux est indisponible");
  }

  const data = await response.json();
  const restaurant = data?.restaurant;
  const giftCard = Array.isArray(restaurant?.giftCards)
    ? restaurant.giftCards.find(
        (candidate) => String(candidate?._id) === String(giftId),
      )
    : null;

  if (!giftCard) {
    return { error: "Carte cadeau introuvable", status: 404 };
  }
  if (
    requireAvailable &&
    (restaurant?.options?.gift_card !== true || giftCard.visible !== true)
  ) {
    return { error: "Carte cadeau indisponible", status: 404 };
  }

  const amount = Math.round(Number(giftCard.value) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_STRIPE_AMOUNT) {
    throw new Error("Montant de carte cadeau invalide");
  }

  return { amount };
}

function signProof(payload, timestamp) {
  const secret = process.env.GUSTO_SHARED_SECRET;
  if (!secret) throw new Error("Configuration de signature absente");

  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest("hex");
}

function sendError(res, error) {
  console.error("Gift card payment error:", error);
  return res.status(500).json({
    error: "Le paiement est momentanément indisponible. Veuillez réessayer.",
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { action = "create", restaurantId, giftId } = req.body || {};

  try {
    const configuredRestaurantId = String(
      process.env.NEXT_PUBLIC_RESTAURANT_ID || "",
    ).trim();
    if (!configuredRestaurantId || String(restaurantId) !== configuredRestaurantId) {
      return res.status(400).json({ error: "Restaurant invalide" });
    }

    const stripe = getStripeClient();

    if (action === "create") {
      const trustedGift = await getTrustedGiftCard(restaurantId, giftId);
      if (trustedGift.error) {
        return res.status(trustedGift.status).json({ error: trustedGift.error });
      }
      if (Number(req.body?.amount) !== trustedGift.amount) {
        return res.status(409).json({
          error: "Le prix de cette carte a changé. Rechargez la page.",
        });
      }
      const checkoutId = String(req.body?.checkoutId || "");
      if (!validateCheckoutId(checkoutId)) {
        return res.status(400).json({ error: "Session de paiement invalide" });
      }

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: trustedGift.amount,
          currency: "eur",
          automatic_payment_methods: { enabled: true, allow_redirects: "never" },
          metadata: {
            restaurantId: String(restaurantId),
            giftId: String(giftId),
            checkoutId,
            gustoGiftPriceValidated: "true",
          },
        },
        { idempotencyKey: checkoutId },
      );

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    if (action === "verify") {
      const paymentIntentId = String(req.body?.paymentIntentId || "");
      if (!/^pi_[a-zA-Z0-9_]+$/.test(paymentIntentId)) {
        return res.status(400).json({ error: "Paiement invalide" });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return res.status(402).json({ error: "Paiement non finalisé" });
      }

      let trustedAmount = paymentIntent.amount;
      if (paymentIntent.metadata?.gustoGiftPriceValidated !== "true") {
        const trustedGift = await getTrustedGiftCard(restaurantId, giftId, {
          requireAvailable: false,
        });
        if (trustedGift.error) {
          return res.status(trustedGift.status).json({ error: trustedGift.error });
        }
        trustedAmount = trustedGift.amount;
      }

      if (
        Number(req.body?.amount) !== trustedAmount ||
        paymentIntent.amount !== trustedAmount ||
        paymentIntent.amount_received !== trustedAmount ||
        paymentIntent.currency !== "eur" ||
        paymentIntent.metadata?.restaurantId !== String(restaurantId) ||
        paymentIntent.metadata?.giftId !== String(giftId)
      ) {
        return res.status(400).json({ error: "Preuve de paiement invalide" });
      }

      const timestamp = Date.now().toString();
      const payload = {
        paymentIntentId,
        amount: trustedAmount,
        restaurantId: String(restaurantId),
        giftId: String(giftId),
      };

      return res.status(200).json({
        timestamp,
        signature: signProof(payload, timestamp),
        payload,
      });
    }

    return res.status(400).json({ error: "Action invalide" });
  } catch (error) {
    return sendError(res, error);
  }
}
