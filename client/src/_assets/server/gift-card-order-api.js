import crypto from "crypto";

function apiUrl() {
  return String(process.env.NEXT_PUBLIC_API_URL || "")
    .trim()
    .replace(/\/+$/, "");
}

export function signGustoPayload(payload) {
  const secret = process.env.GUSTO_SHARED_SECRET;
  if (!secret) throw new Error("Configuration de signature absente");
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest("hex");
  return { timestamp, signature };
}

export async function postGiftCardOrder(path, payload) {
  const baseUrl = apiUrl();
  if (!baseUrl) throw new Error("Configuration API absente");
  const proof = signGustoPayload(payload);
  const response = await fetch(`${baseUrl}/gift-card-orders/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-gusto-timestamp": proof.timestamp,
      "x-gusto-signature": proof.signature,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const error = new Error(
      data.error || "Le service cartes cadeaux ne répond pas.",
    );
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}

export function toPaymentSummary(paymentIntent, stripeAccountId) {
  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    amountReceived: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    metadata: {
      checkoutId: paymentIntent.metadata?.checkoutId || "",
      restaurantId: paymentIntent.metadata?.restaurantId || "",
      giftId: paymentIntent.metadata?.giftId || "",
      type: paymentIntent.metadata?.type || "",
    },
    stripeAccountId: stripeAccountId || "",
  };
}
