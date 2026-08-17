// src/components/reservations/reservation-bank-hold.page.component.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

function BankHoldForm({
  apiBaseUrl,
  reservationId,
  intentType,
  flow,
  amountTotal,
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    if (!success) return;

    setRedirectCountdown(3);

    const interval = window.setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          router.push("/reservations");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [router, success]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setMessage(null);

    try {
      let intentId = "";

      if (intentType === "setup") {
        const result = await stripe.confirmSetup({
          elements,
          redirect: "if_required",
        });

        if (result.error) {
          throw new Error(
            result.error.message || "Impossible de valider la carte bancaire.",
          );
        }

        if (!result.setupIntent?.id) {
          throw new Error("Réponse Stripe invalide.");
        }

        intentId = result.setupIntent.id;
      } else {
        const result = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });

        if (result.error) {
          throw new Error(
            result.error.message || "Impossible de valider la carte bancaire.",
          );
        }

        if (!result.paymentIntent?.id) {
          throw new Error("Réponse Stripe invalide.");
        }

        intentId = result.paymentIntent.id;
      }

      const finalizeRes = await fetch(
        `${apiBaseUrl}/reservations/${reservationId}/bank-hold/finalize-public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intentType,
            intentId,
          }),
        },
      );

      const finalizeData = await finalizeRes.json().catch(() => ({}));

      if (!finalizeRes.ok) {
        throw new Error(
          finalizeData?.message ||
            "Impossible de finaliser la validation de la carte bancaire.",
        );
      }

      localStorage.removeItem("gm_pending_bank_hold");
      setSuccess(true);
      setMessage(
        flow === "scheduled"
          ? "Votre carte a bien été enregistrée pour garantir la réservation."
          : "Votre empreinte bancaire a bien été validée et votre réservation est confirmée.",
      );
    } catch (e) {
      setMessage(
        e?.message || "Impossible de finaliser la validation de la carte.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Réservation validée</h1>
        <p className="mt-4 text-black/70">{message}</p>
        <p className="mt-3 text-sm text-black/55">
          Retour vers la page de réservation dans{" "}
          <span className="font-semibold">{redirectCountdown}s</span>.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
    >
      <h1 className="text-2xl font-semibold">Validation de la carte</h1>

      <p className="mt-3 text-black/70">
        {flow === "scheduled"
          ? "Votre carte sera enregistrée pour garantir la réservation. L’empreinte bancaire sera effectuée ultérieurement selon les conditions du restaurant."
          : "Une empreinte bancaire va être effectuée pour garantir votre réservation."}
      </p>

      <div className="mt-4 rounded-2xl bg-black/5 p-4 text-sm">
        <p>
          <span className="font-medium">Montant de garantie :</span>{" "}
          {Number(amountTotal || 0).toFixed(2)} €
        </p>
      </div>

      <div className="mt-6">
        <PaymentElement
          options={{
            wallets: {
              link: "never",
            },
          }}
        />
      </div>

      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Validation..." : "Valider la carte"}
        </button>
      </div>
    </form>
  );
}

export default function BankHoldReservationsComponent({
  reservationId,
  apiBaseUrl,
  stripePublishableKey,
}) {
  const [prepareData, setPrepareData] = useState(null);
  const [error, setError] = useState(null);
  const [infoRedirectMessage, setInfoRedirectMessage] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) return null;
    return loadStripe(stripePublishableKey);
  }, [stripePublishableKey]);

  useEffect(() => {
    async function prepare() {
      try {
        if (!reservationId) {
          throw new Error("Réservation introuvable.");
        }

        const res = await fetch(
          `${apiBaseUrl}/reservations/${reservationId}/bank-hold/prepare`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data?.message ||
              "Impossible de préparer la validation de la carte.",
          );
        }

        setPrepareData(data);
      } catch (e) {
        const msg =
          e?.message || "Impossible de préparer la validation de la carte.";

        const normalized = String(msg).toLowerCase();

        if (
          normalized.includes("ne nécessite plus de validation carte") ||
          normalized.includes("ne nécessite plus") ||
          normalized.includes("plus de validation")
        ) {
          localStorage.removeItem("gm_pending_bank_hold");
          setInfoRedirectMessage(
            "Cette validation a déjà été finalisée. Vous allez être redirigé vers l’accueil dans",
          );
          return;
        }

        setError(msg);
      }
    }

    prepare();
  }, [apiBaseUrl, reservationId]);

  useEffect(() => {
    if (!infoRedirectMessage) return;

    setRedirectCountdown(3);

    const interval = window.setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [infoRedirectMessage]);

  if (infoRedirectMessage) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-[640px] rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Information</h1>
          <p className="mt-4 text-black/70">
            {infoRedirectMessage}{" "}
            <span className="font-semibold">{redirectCountdown}s</span>.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-[640px] rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Erreur</h1>
          <p className="mt-4 text-black/70">{error}</p>
        </div>
      </main>
    );
  }

  if (!prepareData || !stripePromise) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-[640px] rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Chargement</h1>
          <p className="mt-4 text-black/70">
            Préparation de la validation de votre carte...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-[640px]">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: prepareData.clientSecret,
          }}
        >
          <BankHoldForm
            apiBaseUrl={apiBaseUrl}
            reservationId={prepareData.reservationId}
            intentType={prepareData.intentType}
            flow={prepareData.flow}
            amountTotal={prepareData.amountTotal}
          />
        </Elements>
      </div>
    </main>
  );
}
