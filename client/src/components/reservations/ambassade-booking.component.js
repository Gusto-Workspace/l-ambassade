import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Check, Clock3, CreditCard, Loader2, MapPin, Minus, Plus, TriangleAlert, Users } from "lucide-react";
import {
  formatReservationDateForApi,
  getServiceBucketFromTime,
  getReservationTimeOptions,
  isReservationDateClosed,
} from "@/utils/reservations";
import { StarOrnament } from "@/components/home/ornament.home.component";

const emptyCustomer = { firstName: "", lastName: "", email: "", phone: "", commentary: "" };
const pendingBankHoldStorageKey = "gm_pending_bank_hold";

export default function AmbassadeBookingComponent({ apiBaseUrl, restaurant, dataLoading }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(new Date());
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("");
  const [meal, setMeal] = useState("lunch");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [reservations, setReservations] = useState([]);
  const [slotCoverUsage, setSlotCoverUsage] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnIssue, setReturnIssue] = useState("");
  const [handledReturn, setHandledReturn] = useState(false);
  const [pendingBankHold, setPendingBankHold] = useState(null);
  const [cancelingPendingBankHold, setCancelingPendingBankHold] = useState(false);
  const [pendingBankHoldError, setPendingBankHoldError] = useState("");

  const loadReservations = useCallback(async () => {
    if (!apiBaseUrl || !restaurant?._id) return;
    setLoadingSlots(true);
    try {
      const response = await fetch(`${apiBaseUrl}/public/restaurants/${restaurant._id}/reservations`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("availability");
      setReservations(Array.isArray(payload.reservations) ? payload.reservations : []);
      setSlotCoverUsage(Array.isArray(payload.slotCoverUsage) ? payload.slotCoverUsage : []);
    } catch {
      setReservations([]);
      setSlotCoverUsage([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [apiBaseUrl, restaurant?._id]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  useEffect(() => {
    if (!apiBaseUrl || !restaurant?._id) return;
    async function restorePendingBankHold() {
      try {
        const raw = localStorage.getItem(pendingBankHoldStorageKey);
        if (!raw) return;
        const stored = JSON.parse(raw);
        if (!stored?.reservationId || !stored?.restaurantId) {
          localStorage.removeItem(pendingBankHoldStorageKey);
          return;
        }
        if (String(stored.restaurantId) !== String(restaurant._id)) return;
        const response = await fetch(`${apiBaseUrl}/reservations/${stored.reservationId}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.reservation) {
          localStorage.removeItem(pendingBankHoldStorageKey);
          return;
        }
        const reservation = payload.reservation;
        const expired = reservation?.bankHold?.expiresAt && new Date(reservation.bankHold.expiresAt).getTime() <= Date.now();
        if (reservation.status !== "AwaitingBankHold" || !reservation?.bankHold?.enabled || expired) {
          localStorage.removeItem(pendingBankHoldStorageKey);
          return;
        }
        setPendingBankHold({
          reservationId: String(reservation._id),
          customerFirstName: reservation.customerFirstName || stored.customerFirstName || "",
          reservationDate: reservation.reservationDate || stored.reservationDate,
          reservationTime: reservation.reservationTime || stored.reservationTime,
          numberOfGuests: reservation.numberOfGuests || stored.numberOfGuests,
        });
      } catch {
        localStorage.removeItem(pendingBankHoldStorageKey);
      }
    }
    restorePendingBankHold();
  }, [apiBaseUrl, restaurant?._id]);

  useEffect(() => {
    if (!router.isReady || handledReturn) return;
    const reservationId = Array.isArray(router.query.confirmation) ? router.query.confirmation[0] : router.query.confirmation;
    const bankHoldResult = Array.isArray(router.query.bankHold) ? router.query.bankHold[0] : router.query.bankHold;
    if (!reservationId) {
      if (bankHoldResult === "failed" || bankHoldResult === "canceled") {
        setReturnIssue("L’empreinte bancaire n’a pas été validée. Vous pouvez reprendre la validation ou contacter L’Ambassade.");
      }
      setHandledReturn(true);
      return;
    }

    async function verifyReturnedReservation() {
      setReturnLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/reservations/${reservationId}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.reservation) throw new Error(payload.message || "Impossible de vérifier la réservation.");
        const returned = payload.reservation;
        if (["Pending", "Confirmed", "Active", "Late", "Finished"].includes(returned.status)) {
          const returnedDate = new Date(returned.reservationDate);
          if (!Number.isNaN(returnedDate.getTime())) setDate(returnedDate);
          setGuests(Number(returned.numberOfGuests) || 2);
          setTime(String(returned.reservationTime || "").slice(0, 5));
          setCustomer({
            firstName: returned.customerFirstName || "",
            lastName: returned.customerLastName || "",
            email: returned.customerEmail || "",
            phone: returned.customerPhone || "",
            commentary: returned.commentary || "",
          });
          localStorage.removeItem("gm_pending_bank_hold");
          setStep(3);
          setReturnIssue("");
        } else if (returned.status === "AwaitingBankHold") {
          setReturnIssue("La validation bancaire n’est pas finalisée. Reprenez-la pour confirmer votre table.");
        } else {
          setReturnIssue("Cette réservation ne peut pas être confirmée dans son état actuel. Contactez L’Ambassade si vous pensez qu’il s’agit d’une erreur.");
        }
      } catch (returnError) {
        setReturnIssue(returnError.message || "Impossible de vérifier le statut de la réservation.");
      } finally {
        setReturnLoading(false);
        setHandledReturn(true);
      }
    }
    verifyReturnedReservation();
  }, [apiBaseUrl, handledReturn, router.isReady, router.query.bankHold, router.query.confirmation]);

  const timeOptions = useMemo(() => {
    if (!restaurant?._id) return [];
    return getReservationTimeOptions({
      reservationDate: date,
      numberOfGuests: String(guests),
      restaurant,
      reservationsList: reservations,
      slotCoverUsage,
    });
  }, [date, guests, restaurant, reservations, slotCoverUsage]);

  const visibleTimes = timeOptions.filter((option) => {
    return getServiceBucketFromTime(option.time) === meal;
  });

  useEffect(() => {
    if (step !== 3 && time && !timeOptions.some((option) => option.time === time)) setTime("");
  }, [step, time, timeOptions]);

  function updateCustomer(event) {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  function resumePendingBankHold() {
    if (!pendingBankHold?.reservationId) return;
    window.location.href = `/reservations/${pendingBankHold.reservationId}/bank-hold`;
  }

  async function cancelPendingBankHold() {
    if (!pendingBankHold?.reservationId) return;
    setCancelingPendingBankHold(true);
    setPendingBankHoldError("");
    try {
      const response = await fetch(`${apiBaseUrl}/reservations/${pendingBankHold.reservationId}/cancel-pending-bank-hold`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Impossible d’annuler la réservation en attente.");
      localStorage.removeItem(pendingBankHoldStorageKey);
      setPendingBankHold(null);
      await loadReservations();
    } catch (cancelError) {
      setPendingBankHoldError(cancelError.message || "Impossible d’annuler la réservation en attente.");
    } finally {
      setCancelingPendingBankHold(false);
    }
  }

  async function submitReservation(event) {
    event.preventDefault();
    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
      setError("Merci de renseigner tous les champs obligatoires.");
      return;
    }
    const selectedOption = timeOptions.find((option) => option.time === time);
    if (!selectedOption) { setStep(1); setError("Choisissez un horaire disponible."); return; }
    setSubmitting(true);
    setError("");
    try {
      const isWaitlist = selectedOption.type === "waitlist";
      const endpoint = isWaitlist
        ? `${apiBaseUrl}/restaurants/${restaurant._id}/reservations/waitlist`
        : `${apiBaseUrl}/restaurants/${restaurant._id}/reservations`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationDate: formatReservationDateForApi(date),
          reservationTime: time,
          numberOfGuests: String(guests),
          customerFirstName: customer.firstName.trim(),
          customerLastName: customer.lastName.trim(),
          customerEmail: customer.email.trim(),
          customerPhone: customer.phone.trim(),
          commentary: customer.commentary,
          table: restaurant?.reservationsSettings?.manage_disponibilities ? "auto" : undefined,
          returnUrl: `${window.location.origin}/reservations`,
          idempotencyKey: crypto.randomUUID?.() || `resa_${Date.now()}`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "La réservation n’a pas pu être enregistrée.");
      if (payload.requiresAction && payload.redirectUrl) {
        localStorage.setItem("gm_pending_bank_hold", JSON.stringify({
          reservationId: String(payload.reservationId || payload.reservation?._id || ""),
          restaurantId: String(restaurant._id),
          reservationDate: formatReservationDateForApi(date),
          reservationTime: time,
          numberOfGuests: String(guests),
          customerFirstName: customer.firstName.trim(),
        }));
        window.location.href = payload.redirectUrl;
        return;
      }
      setStep(3);
      await loadReservations();
    } catch (submitError) {
      setError(submitError.message || "Une erreur est survenue.");
    } finally { setSubmitting(false); }
  }

  const address = restaurant?.address;
  const addressText = address?.line1
    ? `${address.line1}, ${address.zipCode || ""} ${address.city || "Montauban"}`
    : "20 avenue de Gasseras, Montauban";

  return (
    <>
      {pendingBankHold ? <div className="ambassade-pending-modal" role="dialog" aria-modal="true" aria-labelledby="pending-bank-hold-title">
        <div className="ambassade-pending-modal__backdrop" />
        <section className="ambassade-pending-modal__panel">
          <CreditCard size={40} strokeWidth={1.2} />
          <p className="ambassade-pending-modal__eyebrow">Empreinte bancaire</p>
          <h2 id="pending-bank-hold-title" className="ambassade-display">Réservation en attente</h2>
          <p>{pendingBankHold.customerFirstName ? `${pendingBankHold.customerFirstName}, ` : ""}votre table est temporairement conservée. Finalisez l’empreinte bancaire pour confirmer la réservation.</p>
          <div className="ambassade-pending-modal__summary">
            <span><small>Date</small><strong>{pendingBankHold.reservationDate ? format(new Date(pendingBankHold.reservationDate), "dd/MM/yyyy") : "—"}</strong></span>
            <span><small>Heure</small><strong>{pendingBankHold.reservationTime || "—"}</strong></span>
            <span><small>Convives</small><strong>{pendingBankHold.numberOfGuests || "—"}</strong></span>
          </div>
          {pendingBankHoldError ? <div className="ambassade-flow-alert ambassade-flow-alert--error"><TriangleAlert size={19} /><p>{pendingBankHoldError}</p></div> : null}
          <div className="ambassade-pending-modal__actions"><button type="button" onClick={cancelPendingBankHold} disabled={cancelingPendingBankHold}>{cancelingPendingBankHold ? "Annulation…" : "Annuler la réservation"}</button><button type="button" onClick={resumePendingBankHold}>Finaliser l’empreinte</button></div>
        </section>
      </div> : null}
    <section className="ambassade-booking" aria-labelledby="booking-title">
      <header className="ambassade-booking__heading">
        <h2 id="booking-title" className="ambassade-display">Votre table vous attend.</h2>
        <StarOrnament />
        <p>Sélectionnez le nombre de convives, la date et l’horaire de votre venue.</p>
      </header>

      {returnLoading ? <div className="ambassade-booking-return"><Loader2 className="animate-spin" /><p>Vérification de votre réservation…</p></div> : null}
      {returnIssue ? <div className="ambassade-booking-return ambassade-booking-return--error"><p>{returnIssue}</p>{router.query.confirmation ? <a href={`/reservations/${router.query.confirmation}`}>Reprendre la validation</a> : null}</div> : null}

      <div className="ambassade-booking-steps" aria-label="Étapes de réservation">
        {["Disponibilités", "Vos informations", "Confirmation"].map((label, index) => (
          <button key={label} type="button" className={step === index + 1 ? "is-active" : step > index + 1 ? "is-done" : ""} onClick={() => index + 1 < step && setStep(index + 1)}>
            <span>0{index + 1}</span><small>{label}</small>
          </button>
        ))}
      </div>

      <div className="ambassade-booking__layout">
        <div className="ambassade-booking__main">
          {dataLoading ? <div className="ambassade-booking__loading"><Loader2 className="animate-spin" /> Chargement…</div> : null}
          {!dataLoading && step === 1 ? <>
            <div className="ambassade-guest-picker">
              <label>Nombre de convives</label>
              <div><button type="button" aria-label="Retirer une personne" onClick={() => { setGuests((value) => Math.max(1, value - 1)); setTime(""); }}><Minus /></button><strong>{guests} {guests > 1 ? "personnes" : "personne"}</strong><button type="button" aria-label="Ajouter une personne" onClick={() => { setGuests((value) => Math.min(12, value + 1)); setTime(""); }}><Plus /></button></div>
            </div>
            <div className="ambassade-calendar"><label>Choisissez une date</label><Calendar value={date} onChange={(value) => { setDate(value); setTime(""); }} minDate={new Date()} locale="fr-FR" tileDisabled={({ date: tileDate, view }) => view === "month" && isReservationDateClosed({ reservationDate: tileDate, restaurant })} /></div>
            <div className="ambassade-meal-toggle"><button type="button" className={meal === "lunch" ? "is-active" : ""} onClick={() => { setMeal("lunch"); setTime(""); }}>Déjeuner</button><button type="button" className={meal === "dinner" ? "is-active" : ""} onClick={() => { setMeal("dinner"); setTime(""); }}>Dîner</button></div>
            <div className="ambassade-time-picker"><label>Horaires disponibles</label><div>{loadingSlots ? <Loader2 className="animate-spin" /> : visibleTimes.length ? visibleTimes.map((option) => <button key={option.time} type="button" className={time === option.time ? "is-active" : ""} onClick={() => { setTime(option.time); setError(""); }}>{option.time}</button>) : <p>Aucun horaire disponible pour ce service.</p>}</div></div>
            {error ? <p className="ambassade-booking__error">{error}</p> : null}
            <button type="button" className="ambassade-booking__continue" onClick={() => time ? setStep(2) : setError("Choisissez un horaire disponible.")}>Continuer</button>
          </> : null}

          {step === 2 ? <form className="ambassade-customer-form" onSubmit={submitReservation}>
            <h3 className="ambassade-display">Vos informations</h3>
            <div className="ambassade-customer-form__grid"><BookingField label="Prénom *" name="firstName" value={customer.firstName} onChange={updateCustomer} /><BookingField label="Nom *" name="lastName" value={customer.lastName} onChange={updateCustomer} /><BookingField label="E-mail *" name="email" type="email" value={customer.email} onChange={updateCustomer} /><BookingField label="Téléphone *" name="phone" type="tel" value={customer.phone} onChange={updateCustomer} /></div>
            <label className="ambassade-customer-form__message"><span>Demande particulière</span><textarea name="commentary" value={customer.commentary} onChange={updateCustomer} rows="4" placeholder="Allergie, accessibilité, anniversaire…" /></label>
            {error ? <p className="ambassade-booking__error">{error}</p> : null}
            <div className="ambassade-customer-form__actions"><button type="button" onClick={() => setStep(1)}>Modifier le créneau</button><button type="submit" disabled={submitting}>{submitting ? "Envoi…" : "Confirmer la réservation"}</button></div>
          </form> : null}

          {step === 3 ? <div className="ambassade-booking-confirmation"><Check size={55} strokeWidth={1.2} /><h3 className="ambassade-display">Votre réservation est confirmée.</h3><p>La validation est terminée. Un e-mail récapitulatif vous a été envoyé et nous avons hâte de vous accueillir.</p><button type="button" className="ambassade-button ambassade-button--outline" onClick={() => { setStep(1); setTime(""); setCustomer(emptyCustomer); setReturnIssue(""); router.replace("/reservations", undefined, { shallow: true }); }}>Nouvelle réservation</button></div> : null}
        </div>

        <aside className="ambassade-booking-summary">
          <h3>Votre réservation</h3><StarOrnament />
          <SummaryLine icon={Users}>{guests} {guests > 1 ? "personnes" : "personne"}</SummaryLine>
          <SummaryLine icon={CalendarDays}>{format(date, "EEEE d MMMM yyyy", { locale: fr })}</SummaryLine>
          <SummaryLine icon={Clock3}>{time || "Horaire à choisir"}</SummaryLine>
          <div className="ambassade-booking-summary__rule" />
          <SummaryLine icon={MapPin}><strong>L’Ambassade</strong><small>{addressText}</small></SummaryLine>
          <p>Votre table sera confirmée à l’étape suivante.</p>
        </aside>
      </div>
    </section>
    </>
  );
}

function BookingField({ label, ...props }) { return <label className="ambassade-booking-field"><span>{label}</span><input required {...props} /></label>; }
function SummaryLine({ icon: Icon, children }) { return <div className="ambassade-booking-summary__line"><Icon size={29} strokeWidth={1.25} /><div>{children}</div></div>; }
