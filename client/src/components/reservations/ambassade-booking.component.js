import { useCallback, useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Check, Clock3, Loader2, MapPin, Minus, Plus, Users } from "lucide-react";
import {
  formatReservationDateForApi,
  getReservationTimeOptions,
  isReservationDateClosed,
} from "@/utils/reservations";
import { StarOrnament } from "@/components/home/ornament.home.component";

const emptyCustomer = { firstName: "", lastName: "", email: "", phone: "", commentary: "" };

export default function AmbassadeBookingComponent({ apiBaseUrl, restaurant, dataLoading }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(new Date());
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("");
  const [meal, setMeal] = useState("dinner");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [reservations, setReservations] = useState([]);
  const [slotCoverUsage, setSlotCoverUsage] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    const hour = Number(String(option.time).split(":")[0]);
    return meal === "lunch" ? hour < 17 : hour >= 17;
  });

  useEffect(() => {
    if (time && !timeOptions.some((option) => option.time === time)) setTime("");
  }, [time, timeOptions]);

  function updateCustomer(event) {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
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
      if (payload.requiresAction && payload.redirectUrl) { window.location.href = payload.redirectUrl; return; }
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
    <section className="ambassade-booking" aria-labelledby="booking-title">
      <header className="ambassade-booking__heading">
        <h2 id="booking-title" className="ambassade-display">Votre table vous attend.</h2>
        <StarOrnament />
        <p>Sélectionnez le nombre de convives, la date et l’horaire de votre venue.</p>
      </header>

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
            <div className="ambassade-customer-form__actions"><button type="button" onClick={() => setStep(1)}>Modifier les disponibilités</button><button type="submit" disabled={submitting}>{submitting ? "Envoi…" : "Confirmer la réservation"}</button></div>
          </form> : null}

          {step === 3 ? <div className="ambassade-booking-confirmation"><Check size={55} strokeWidth={1.2} /><h3 className="ambassade-display">Votre demande est confirmée.</h3><p>Un e-mail récapitulatif vient de vous être envoyé. Nous avons hâte de vous accueillir.</p><button type="button" className="ambassade-button ambassade-button--outline" onClick={() => { setStep(1); setTime(""); setCustomer(emptyCustomer); }}>Nouvelle réservation</button></div> : null}
        </div>

        <aside className="ambassade-booking-summary">
          <h3>Votre réservation</h3><StarOrnament />
          <SummaryLine icon={Users}>{guests} {guests > 1 ? "personnes" : "personne"}</SummaryLine>
          <SummaryLine icon={CalendarDays}>{format(date, "EEEE d MMMM yyyy", { locale: fr })}</SummaryLine>
          <SummaryLine icon={Clock3}>{time || "Horaire à choisir"}</SummaryLine>
          <div className="ambassade-booking-summary__rule" />
          <SummaryLine icon={MapPin}><strong>L’Ambassade</strong><small>{addressText}</small></SummaryLine>
          {step > 1 ? <button type="button" onClick={() => setStep(1)}>Modifier</button> : null}
          <p>Votre table sera confirmée à l’étape suivante.</p>
        </aside>
      </div>
    </section>
  );
}

function BookingField({ label, ...props }) { return <label className="ambassade-booking-field"><span>{label}</span><input required {...props} /></label>; }
function SummaryLine({ icon: Icon, children }) { return <div className="ambassade-booking-summary__line"><Icon size={29} strokeWidth={1.25} /><div>{children}</div></div>; }
