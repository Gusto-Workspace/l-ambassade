import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Check, CreditCard, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const confirmedStatuses = new Set(["Pending", "Confirmed", "Active", "Late", "Finished"]);

function confirmationUrl(reservationId) {
  return `/reservations?confirmation=${encodeURIComponent(reservationId)}&bankHold=success`;
}

function BankHoldForm({ apiBaseUrl, reservationId, intentType, flow, amountTotal }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function finalizeIntent(nextIntentType, intentId) {
    const response = await fetch(`${apiBaseUrl}/reservations/${reservationId}/bank-hold/finalize-public`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intentType: nextIntentType, intentId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "La validation n’a pas pu être finalisée.");
    localStorage.removeItem("gm_pending_bank_hold");
    setSuccess(true);
  }

  useEffect(() => {
    if (!router.isReady || success || loading) return;
    const setupIntentId = Array.isArray(router.query.setup_intent) ? router.query.setup_intent[0] : router.query.setup_intent;
    const paymentIntentId = Array.isArray(router.query.payment_intent) ? router.query.payment_intent[0] : router.query.payment_intent;
    const returnedIntentId = setupIntentId || paymentIntentId;
    if (!returnedIntentId) return;
    setLoading(true);
    finalizeIntent(setupIntentId ? "setup" : "payment", returnedIntentId)
      .catch((returnError) => setMessage(returnError.message || "La validation n’a pas pu être finalisée."))
      .finally(() => setLoading(false));
  }, [router.isReady, router.query.payment_intent, router.query.setup_intent]);

  useEffect(() => {
    if (!success) return undefined;
    const timeout = window.setTimeout(() => router.replace(confirmationUrl(reservationId)), 1800);
    return () => window.clearTimeout(timeout);
  }, [reservationId, router, success]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setMessage("");
    try {
      let intentId = "";
      if (intentType === "setup") {
        const result = await stripe.confirmSetup({ elements, redirect: "if_required", confirmParams: { return_url: `${window.location.origin}/reservations/${reservationId}/bank-hold` } });
        if (result.error) throw new Error(result.error.message || "La carte n’a pas pu être validée.");
        intentId = result.setupIntent?.id || "";
      } else {
        const result = await stripe.confirmPayment({ elements, redirect: "if_required", confirmParams: { return_url: `${window.location.origin}/reservations/${reservationId}/bank-hold` } });
        if (result.error) throw new Error(result.error.message || "L’empreinte n’a pas pu être validée.");
        intentId = result.paymentIntent?.id || "";
      }
      if (!intentId) throw new Error("La réponse du service de paiement est incomplète.");
      await finalizeIntent(intentType, intentId);
    } catch (submitError) {
      setMessage(submitError.message || "La validation a échoué. Vérifiez vos informations et réessayez.");
    } finally { setLoading(false); }
  }

  if (success) return <Status icon={Check} tone="success" title="Réservation validée"><p>Votre empreinte bancaire a bien été validée. Vous allez retrouver la confirmation de votre réservation.</p><Loader2 className="animate-spin" /></Status>;

  return (
    <form onSubmit={handleSubmit} className="ambassade-bank-form">
      <div className="ambassade-bank-form__intro"><ShieldCheck size={35} strokeWidth={1.25} /><p>{flow === "scheduled" ? "Votre carte est enregistrée de façon sécurisée pour garantir votre réservation. Aucun débit immédiat n’est effectué." : "Une empreinte bancaire sécurisée est nécessaire pour garantir votre réservation. Le montant n’est pas débité."}</p></div>
      <div className="ambassade-bank-form__amount"><span>Montant de la garantie</span><strong>{Number(amountTotal || 0).toFixed(2)} €</strong></div>
      <div className="ambassade-bank-form__payment"><PaymentElement options={{ wallets: { link: "never" } }} /></div>
      {message ? <div className="ambassade-flow-alert ambassade-flow-alert--error"><TriangleAlert size={20} /><p>{message}</p></div> : null}
      <button type="submit" disabled={!stripe || !elements || loading} className="ambassade-flow-primary"><CreditCard size={18} />{loading ? "Validation en cours…" : "Valider la carte"}</button>
      <p className="ambassade-bank-form__secure">Paiement sécurisé par Stripe · Vos données bancaires ne transitent pas par L’Ambassade.</p>
    </form>
  );
}

export default function BankHoldReservationsComponent({ reservationId, apiBaseUrl, stripePublishableKey }) {
  const router = useRouter();
  const [prepareData, setPrepareData] = useState(null);
  const [error, setError] = useState("");
  const stripePromise = useMemo(() => stripePublishableKey ? loadStripe(stripePublishableKey) : null, [stripePublishableKey]);

  useEffect(() => {
    async function prepare() {
      try {
        if (!reservationId || !apiBaseUrl) throw new Error("Réservation introuvable.");
        const response = await fetch(`${apiBaseUrl}/reservations/${reservationId}/bank-hold/prepare`, { method: "POST", headers: { "Content-Type": "application/json" } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const statusResponse = await fetch(`${apiBaseUrl}/reservations/${reservationId}`).catch(() => null);
          const statusPayload = statusResponse ? await statusResponse.json().catch(() => ({})) : {};
          if (confirmedStatuses.has(statusPayload?.reservation?.status)) {
            localStorage.removeItem("gm_pending_bank_hold");
            await router.replace(confirmationUrl(reservationId));
            return;
          }
          throw new Error(payload.message || "Impossible de préparer la validation de la carte.");
        }
        setPrepareData(payload);
      } catch (prepareError) { setError(prepareError.message || "Impossible de préparer la validation de la carte."); }
    }
    prepare();
  }, [apiBaseUrl, reservationId, router]);

  if (error) return <Status icon={TriangleAlert} tone="error" title="Validation non finalisée"><p>{error}</p><div className="ambassade-flow-actions"><Link href={`/reservations/${reservationId}`}>Réessayer</Link><Link href="/contact">Contacter L’Ambassade</Link></div></Status>;
  if (!prepareData || !stripePromise) return <Status icon={Loader2} title="Préparation sécurisée"><Loader2 className="animate-spin" /><p>Nous préparons la validation de votre carte…</p></Status>;
  return <Elements stripe={stripePromise} options={{ clientSecret: prepareData.clientSecret }}><BankHoldForm apiBaseUrl={apiBaseUrl} reservationId={prepareData.reservationId} intentType={prepareData.intentType} flow={prepareData.flow} amountTotal={prepareData.amountTotal} /></Elements>;
}

function Status({ icon: Icon, title, tone = "", children }) { return <div className={`ambassade-flow-status${tone ? ` ambassade-flow-status--${tone}` : ""}`}><Icon size={42} strokeWidth={1.2} /><h2>{title}</h2>{children}</div>; }
