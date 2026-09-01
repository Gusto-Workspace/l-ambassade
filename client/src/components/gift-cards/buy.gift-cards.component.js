import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { GlobalContext } from "@/contexts/global.context";
import {
  getGiftCardAmountCents,
  getGiftCheckoutKey,
  getVisibleGiftCards,
  makeGiftCheckoutId,
  safeJsonParse,
} from "@/_assets/utils/gift-cards.utils";
import GiftCardVisualPreview from "./visual-preview.gift-cards.component";
import InfosFormGiftCardsComponent from "./infos-form.gift-cards.component";
import PaymentFormGiftCardsComponent from "./payment-form.gift-cards.component";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey?.startsWith("pk_")
  ? loadStripe(publishableKey)
  : null;

const EMPTY_FORM = {
  beneficiaryFirstName: "",
  beneficiaryLastName: "",
  sender: "",
  comment: "",
  hidePrice: false,
  sendEmail: "",
  buyerFirstName: "",
  buyerLastName: "",
  buyerPhone: "",
};

export default function BuyGiftCardsComponent() {
  const router = useRouter();
  const { restaurantContext } = useContext(GlobalContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [purchase, setPurchase] = useState(null);
  const restaurant = restaurantContext?.restaurantData;
  const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID;
  const giftId = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
  const giftCard = useMemo(
    () =>
      getVisibleGiftCards(restaurant).find(
        (candidate) => String(candidate._id) === String(giftId),
      ) || null,
    [giftId, restaurant],
  );
  const amountCents = getGiftCardAmountCents(giftCard);

  useEffect(() => {
    if (!giftCard || !amountCents || !restaurantId) return;
    const key = getGiftCheckoutKey(restaurantId, giftCard._id, amountCents);
    try {
      const checkout = safeJsonParse(localStorage.getItem(key));
      if (checkout?.formDataSnapshot) {
        const snapshot = checkout.formDataSnapshot;
        const beneficiary = [
          snapshot.beneficiaryFirstName,
          snapshot.beneficiaryLastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();
        setFormData((current) => ({
          ...current,
          ...snapshot,
          beneficiaryFirstName: beneficiary,
          beneficiaryLastName: "",
        }));
      }
      if (["payment", "confirming", "paid"].includes(checkout?.state)) {
        setStep(2);
      }
    } catch {
      // Le formulaire reste disponible sans persistance locale.
    }
  }, [amountCents, giftCard, restaurantId]);

  function continueToPayment(values) {
    setFormData(values);
    if (restaurantId && amountCents) {
      const key = getGiftCheckoutKey(restaurantId, giftCard._id, amountCents);
      try {
        const existing = safeJsonParse(localStorage.getItem(key));
        localStorage.setItem(
          key,
          JSON.stringify({
            ...(existing || { checkoutId: makeGiftCheckoutId() }),
            state: "payment",
            createdAt: existing?.createdAt || Date.now(),
            formDataSnapshot: values,
          }),
        );
      } catch {
        // Le composant de paiement recréera une session en mémoire.
      }
    }
    setStep(2);
  }

  if (restaurantContext?.dataLoading || !router.isReady) {
    return (
      <div className="ambassade-gifts-state" role="status">
        <Loader2 className="animate-spin" aria-hidden="true" />
        <p>Chargement de votre carte cadeau…</p>
      </div>
    );
  }

  if (!giftCard || !amountCents) {
    return (
      <div className="ambassade-gifts-state">
        <h1>Cette carte cadeau n’est plus disponible.</h1>
        <p>Son offre a pu être modifiée depuis votre dernière visite.</p>
        <Link href="/gift-cards" className="ambassade-button ambassade-button--outline">
          Voir les cartes disponibles
        </Link>
      </div>
    );
  }

  return (
    <section className="ambassade-gift-checkout">
      <Link href="/gift-cards" className="ambassade-gift-checkout__back">
        <ChevronLeft size={17} aria-hidden="true" /> Retour aux cartes
      </Link>
      <div className="ambassade-gift-checkout__grid">
        <div className="ambassade-gift-checkout__preview">
          <GiftCardVisualPreview
            giftCard={giftCard}
            giftCardSettings={restaurant?.giftCardSettings}
            restaurantName={restaurant?.name}
            formData={formData}
            hidePrice={formData.hidePrice}
          />
        </div>
        <div className="ambassade-gift-checkout__panel">
          <ol className="ambassade-gift-steps" aria-label="Étapes de commande">
            {["Informations", "Paiement", "Confirmation"].map((label, index) => (
              <li className={step >= index + 1 ? "is-active" : ""} key={label}>
                <span>{index + 1}</span>{label}
              </li>
            ))}
          </ol>

          {step === 1 ? (
            <InfosFormGiftCardsComponent
              formData={formData}
              giftCard={giftCard}
              giftCardSettings={restaurant?.giftCardSettings}
              onChange={(values) =>
                setFormData((current) => ({ ...current, ...values }))
              }
              onSubmit={continueToPayment}
            />
          ) : null}

          {step === 2 ? (
            stripePromise ? (
              <>
                <button
                  type="button"
                  className="ambassade-gift-checkout__edit"
                  onClick={() => setStep(1)}
                >
                  Modifier les informations
                </button>
                <Elements stripe={stripePromise}>
                  <PaymentFormGiftCardsComponent
                    amountCents={amountCents}
                    formData={formData}
                    giftId={giftCard._id}
                    onPaymentSuccess={(result) => {
                      setPurchase(result);
                      setStep(3);
                    }}
                  />
                </Elements>
              </>
            ) : (
              <div className="ambassade-gift-payment__error" role="alert">
                Le paiement n’est pas configuré. Contactez le restaurant.
              </div>
            )
          ) : null}

          {step === 3 ? (
            <div className="ambassade-gift-success" role="status">
              <CheckCircle2 aria-hidden="true" />
              <h1>Votre cadeau est prêt.</h1>
              <p>
                La carte cadeau a été achetée et envoyée à {formData.sendEmail}.
              </p>
              {purchase?.purchaseCode ? (
                <p className="ambassade-gift-success__code">
                  Référence : <strong>{purchase.purchaseCode}</strong>
                </p>
              ) : null}
              <Link href="/" className="ambassade-button ambassade-button--outline">
                Retour à l’accueil
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
