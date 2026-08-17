import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, Loader2, TriangleAlert, Users, X } from "lucide-react";

function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }); }
function formatDateTime(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }); }

export default function WaitlistOfferReservationsComponent({ token, apiBaseUrl }) {
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOffer() {
      try {
        if (!token || !apiBaseUrl) throw new Error("Proposition introuvable.");
        const response = await fetch(`${apiBaseUrl}/reservations/waitlist-offers/${token}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "Cette proposition n’est plus disponible.");
        setOffer(payload);
      } catch (loadError) { setError(loadError.message || "Cette proposition n’est plus disponible."); }
      finally { setLoading(false); }
    }
    loadOffer();
  }, [apiBaseUrl, token]);

  const reservation = offer?.reservation || {};
  const offerActive = offer?.state === "offered";
  const expiresLabel = useMemo(() => formatDateTime(offer?.offerExpiresAt), [offer?.offerExpiresAt]);

  async function respond(action) {
    setActionLoading(action); setError(""); setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/reservations/waitlist-offers/${token}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Impossible de répondre à cette proposition.");
      if (payload.requiresAction && payload.redirectUrl) {
        localStorage.setItem("gm_pending_bank_hold", JSON.stringify({ reservationId: String(payload.reservationId), restaurantId: String(payload.reservation?.restaurant_id || "") }));
        window.location.href = payload.redirectUrl;
        return;
      }
      setOffer((current) => ({ ...current, state: action === "accept" ? "accepted" : "declined", reservation: payload.reservation || current?.reservation }));
      setMessage(action === "accept" ? "Votre réservation est confirmée." : "Votre refus a bien été pris en compte.");
    } catch (responseError) { setError(responseError.message || "Impossible de répondre à cette proposition."); }
    finally { setActionLoading(""); }
  }

  if (loading) return <FlowStatus icon={Loader2} title="Vérification de la proposition" loading>Un instant, nous vérifions que la table est toujours disponible.</FlowStatus>;
  if (error && !offer) return <FlowStatus icon={TriangleAlert} title="Proposition indisponible" tone="error">{error}</FlowStatus>;

  return (
    <div className="ambassade-waitlist">
      <p className="ambassade-waitlist__intro">Une table correspondant à votre demande est disponible. Confirmez-la avant l’expiration de la proposition.</p>
      {reservation?._id ? <div className="ambassade-waitlist__details"><Detail icon={Users} label="Convives">{reservation.numberOfGuests || 0} personnes</Detail><Detail icon={CalendarDays} label="Date">{formatDate(reservation.reservationDate)}</Detail><Detail icon={Clock3} label="Heure">{reservation.reservationTime || "-"}</Detail></div> : null}
      {offerActive && expiresLabel ? <p className="ambassade-waitlist__expires">Réponse possible jusqu’au <strong>{expiresLabel}</strong>.</p> : null}
      {message ? <div className="ambassade-flow-alert ambassade-flow-alert--success"><Check size={20} /><p>{message}</p></div> : null}
      {error ? <div className="ambassade-flow-alert ambassade-flow-alert--error"><TriangleAlert size={20} /><p>{error}</p></div> : null}
      {offerActive ? <div className="ambassade-waitlist__actions"><button type="button" onClick={() => respond("accept")} disabled={Boolean(actionLoading)}>{actionLoading === "accept" ? <Loader2 className="animate-spin" /> : <Check />}Accepter la place</button><button type="button" onClick={() => respond("decline")} disabled={Boolean(actionLoading)}>{actionLoading === "decline" ? <Loader2 className="animate-spin" /> : <X />}Refuser</button></div> : null}
    </div>
  );
}

function Detail({ icon: Icon, label, children }) { return <div><Icon size={28} strokeWidth={1.25} /><p><span>{label}</span><strong>{children}</strong></p></div>; }
function FlowStatus({ icon: Icon, title, tone = "", loading = false, children }) { return <div className={`ambassade-flow-status${tone ? ` ambassade-flow-status--${tone}` : ""}`}><Icon size={42} strokeWidth={1.2} className={loading ? "animate-spin" : ""} /><h2>{title}</h2><p>{children}</p></div>; }
