import { useEffect, useMemo, useRef, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  getGiftCheckoutKey,
  makeGiftCheckoutId,
  safeJsonParse,
} from "@/_assets/utils/gift-cards.utils";

function getErrorMessage(error) {
  return (
    error?.response?.data?.emailError ||
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Une erreur est survenue. Vous pouvez relancer la finalisation sans repayer."
  );
}

async function readJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const error = new Error(
      data.error || "Le service de paiement ne répond pas.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

export default function PaymentFormGiftCardsComponent({
  amountCents,
  formData,
  giftId,
  onPaymentSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const submitLock = useRef(false);
  const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID;
  const checkoutKey = getGiftCheckoutKey(restaurantId, giftId, amountCents);
  const legacyCheckoutKey = `${checkoutKey}:${amountCents}`;
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [payer, setPayer] = useState({ firstName: "", lastName: "" });

  const elementOptions = useMemo(
    () => ({
      style: {
        base: {
          color: "#272521",
          fontFamily: "Montserrat, Arial, sans-serif",
          fontSize: "15px",
          "::placeholder": { color: "#8c867e" },
        },
        invalid: { color: "#9e3535" },
      },
    }),
    [],
  );

  function readCheckout() {
    if (typeof window === "undefined") return null;
    try {
      const current = safeJsonParse(localStorage.getItem(checkoutKey));
      if (current) return current;
      const legacy = safeJsonParse(localStorage.getItem(legacyCheckoutKey));
      if (legacy) {
        localStorage.setItem(checkoutKey, JSON.stringify(legacy));
        localStorage.removeItem(legacyCheckoutKey);
      }
      return legacy;
    } catch {
      return null;
    }
  }

  function writeCheckout(checkout) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(checkoutKey, JSON.stringify(checkout));
    } catch {
      // Le paiement reste utilisable même si le stockage local est bloqué.
    }
  }

  function clearCheckout() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(checkoutKey);
      localStorage.removeItem(legacyCheckoutKey);
    } catch {
      // Aucun traitement supplémentaire nécessaire.
    }
  }

  async function requestPaymentIntent(checkoutId) {
    const response = await fetch("/api/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        amount: amountCents,
        restaurantId,
        giftId,
        checkoutId,
        formData,
      }),
    });
    return readJsonResponse(response);
  }

  async function requestOrder(action, checkoutId, paymentId = null) {
    const response = await fetch("/api/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        checkoutId,
        paymentIntentId: paymentId,
        restaurantId,
        giftId,
      }),
    });
    return readJsonResponse(response);
  }

  async function waitForOrder(checkoutId) {
    let lastResult = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      lastResult = await requestOrder("status", checkoutId);
      if (
        lastResult.order?.finalizationStatus === "finalized" ||
        lastResult.order?.paymentStatus === "pending"
      ) {
        return lastResult;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return lastResult;
  }

  function completeCheckout(order) {
    clearCheckout();
    onPaymentSuccess({
      purchaseCode: order.purchaseCode,
      validUntil: order.validUntil,
      emailStatus: { sent: order.emailStatus === "completed" },
    });
  }

  async function finalizePaidCheckout(checkout) {
    if (!checkout?.paymentIntentId) {
      throw new Error("La référence du paiement est introuvable.");
    }

    setIsFinalizing(true);
    setErrorMessage("");
    try {
      const result = await requestOrder(
        "finalize",
        checkout.checkoutId,
        checkout.paymentIntentId,
      );
      completeCheckout(result.order);
      return "completed";
    } catch (error) {
      try {
        const status = await waitForOrder(checkout.checkoutId);
        if (status.order?.finalizationStatus === "finalized") {
          completeCheckout(status.order);
          return "completed";
        }
        if (
          status.order?.paymentStatus === "pending" &&
          checkout.state === "confirming"
        ) {
          writeCheckout({ ...checkout, state: "payment" });
          setErrorMessage("");
          return "payment";
        }
      } catch {
        // On conserve le checkout local pour une reprise ultérieure.
      }
      const paymentWasConfirmed = checkout.state === "paid";
      writeCheckout({
        ...checkout,
        state: paymentWasConfirmed ? "paid" : "confirming",
      });
      setErrorMessage(
        paymentWasConfirmed
          ? "Votre paiement est confirmé. La création de votre carte est toujours en cours ; vous pouvez relancer la confirmation sans repayer."
          : "Le statut de votre paiement est en cours de vérification. Relancez la vérification sans saisir une nouvelle carte.",
      );
      return "retry";
    } finally {
      setIsFinalizing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setIsPreparing(true);
      setErrorMessage("");
      let checkout = readCheckout();
      if (!checkout?.checkoutId) {
        checkout = {
          checkoutId: makeGiftCheckoutId(),
          state: "payment",
          createdAt: Date.now(),
          formDataSnapshot: formData,
        };
        writeCheckout(checkout);
      }

      if (checkout.payerSnapshot) setPayer(checkout.payerSnapshot);

      try {
        if (
          ["confirming", "paid"].includes(checkout.state) &&
          checkout.paymentIntentId
        ) {
          const recoveryResult = await finalizePaidCheckout(checkout);
          if (cancelled || recoveryResult !== "payment") return;
          checkout = readCheckout() || { ...checkout, state: "payment" };
        }

        const payment = await requestPaymentIntent(checkout.checkoutId);
        if (cancelled) return;
        setClientSecret(payment.clientSecret);
        setPaymentIntentId(payment.paymentIntentId);
        checkout = {
          ...checkout,
          paymentIntentId: payment.paymentIntentId,
          formDataSnapshot: checkout.formDataSnapshot || formData,
        };
        writeCheckout(checkout);
      } catch (error) {
        if (!cancelled) setErrorMessage(getErrorMessage(error));
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, [amountCents, giftId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements || submitLock.current || isFinalizing) return;

    submitLock.current = true;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      if (!clientSecret || !paymentIntentId) {
        throw new Error("Le paiement n’est pas encore prêt.");
      }
      const card = elements.getElement(CardNumberElement);
      if (!card) throw new Error("Le formulaire bancaire n’est pas prêt.");

      const checkout = readCheckout() || {
        checkoutId: makeGiftCheckoutId(),
        createdAt: Date.now(),
      };
      const confirmingCheckout = {
        ...checkout,
        state: "confirming",
        paymentIntentId,
        formDataSnapshot: formData,
        payerSnapshot: payer,
      };
      writeCheckout(confirmingCheckout);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: `${payer.firstName} ${payer.lastName}`.trim(),
          },
        },
      });
      if (result.error) {
        writeCheckout({ ...confirmingCheckout, state: "payment" });
        throw new Error(result.error.message || "Le paiement a été refusé.");
      }
      if (result.paymentIntent?.status !== "succeeded") {
        writeCheckout({ ...confirmingCheckout, state: "payment" });
        throw new Error("Le paiement n’a pas pu être finalisé.");
      }

      const paidCheckout = {
        ...confirmingCheckout,
        state: "paid",
        paymentIntentId: result.paymentIntent.id,
      };
      writeCheckout(paidCheckout);
      await finalizePaidCheckout(paidCheckout);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  }

  const disabled = isPreparing || isSubmitting || isFinalizing || !clientSecret;

  return (
    <form className="ambassade-gift-payment" onSubmit={handleSubmit}>
      <div className="ambassade-gift-form__row">
        <label className="ambassade-gift-field">
          <span>Prénom du titulaire</span>
          <input
            value={payer.firstName}
            onChange={(event) =>
              setPayer((current) => ({
                ...current,
                firstName: event.target.value,
              }))
            }
            maxLength={80}
            autoComplete="cc-given-name"
            required
            disabled={disabled}
          />
        </label>
        <label className="ambassade-gift-field">
          <span>Nom du titulaire</span>
          <input
            value={payer.lastName}
            onChange={(event) =>
              setPayer((current) => ({
                ...current,
                lastName: event.target.value,
              }))
            }
            maxLength={80}
            autoComplete="cc-family-name"
            required
            disabled={disabled}
          />
        </label>
      </div>

      <div
        className={
          disabled
            ? "ambassade-stripe-fields is-disabled"
            : "ambassade-stripe-fields"
        }
      >
        <label>
          <span>Numéro de carte</span>
          <span className="ambassade-stripe-field">
            <CardNumberElement options={elementOptions} />
          </span>
        </label>
        <div>
          <label>
            <span>Expiration</span>
            <span className="ambassade-stripe-field">
              <CardExpiryElement options={elementOptions} />
            </span>
          </label>
          <label>
            <span>Cryptogramme</span>
            <span className="ambassade-stripe-field">
              <CardCvcElement options={elementOptions} />
            </span>
          </label>
        </div>
      </div>

      {errorMessage ? (
        <div className="ambassade-gift-payment__error" role="alert">
          <p>{errorMessage}</p>
          {["confirming", "paid"].includes(readCheckout()?.state) ? (
            <button
              type="button"
              onClick={() => finalizePaidCheckout(readCheckout())}
              disabled={isFinalizing}
            >
              Relancer l’envoi sans repayer
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="ambassade-gift-payment__secure">
        Paiement sécurisé par Stripe. Aucune donnée bancaire n’est stockée par
        L’Ambassade.
      </p>
      <button
        type="submit"
        className="ambassade-button ambassade-button--copper"
        disabled={disabled}
      >
        {isPreparing
          ? "Préparation du paiement…"
          : isSubmitting || isFinalizing
            ? "Finalisation en cours…"
            : `Payer ${(amountCents / 100).toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })} €`}
      </button>
    </form>
  );
}
