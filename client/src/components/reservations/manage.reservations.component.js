import Link from "next/link";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  TriangleAlert,
  Users,
} from "lucide-react";

import { GlobalContext } from "@/contexts/global.context";
import { buildContactInfos } from "@/_assets/utils/contact.utils";
import { parseReservationDateValue } from "@/utils/reservations";

export default function ManageReservationsComponent({ reservationId, apiBaseUrl }) {
  const { restaurantContext } = useContext(GlobalContext);
  const restaurant = restaurantContext?.restaurantData;
  const restaurantLoading = restaurantContext?.dataLoading;
  const [reservation, setReservation] = useState(null);
  const [management, setManagement] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const contactInfos = useMemo(() => buildContactInfos(restaurant), [restaurant]);
  const phoneInfo = contactInfos.find((item) => item.key === "phone");
  const emailInfo = contactInfos.find((item) => item.key === "email");
  const contactHref = phoneInfo?.href || emailInfo?.href || "/contact";
  const reservationRestaurantId = String(
    reservation?.restaurant_id?._id || reservation?.restaurant_id || "",
  );
  const restaurantMismatch = Boolean(
    reservationRestaurantId &&
      restaurant?._id &&
      !restaurantLoading &&
      String(restaurant._id) !== reservationRestaurantId,
  );

  const fetchReservation = useCallback(async () => {
    if (!reservationId || !apiBaseUrl) {
      setLoadError("Ce lien de réservation est invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError("");
      const response = await fetch(`${apiBaseUrl}/reservations/${reservationId}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.reservation) {
        throw new Error(
          getReservationApiErrorMessage({
            payload,
            status: response.status,
            fallbackMessage: "Impossible de retrouver cette réservation.",
          }),
        );
      }
      setReservation(payload.reservation);
      setManagement(payload.management || null);
    } catch (error) {
      setLoadError(error?.message || "Impossible de retrouver cette réservation.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, reservationId]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  async function handleCancelReservation() {
    if (!reservation?._id || !apiBaseUrl) return;
    try {
      setIsCanceling(true);
      setActionError("");
      setSuccessMessage("");
      const response = await fetch(`${apiBaseUrl}/reservations/${reservation._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          getReservationApiErrorMessage({
            payload,
            status: response.status,
            fallbackMessage: "Impossible d’annuler la réservation.",
          }),
        );
      }
      setReservation(payload.reservation || reservation);
      setManagement(payload.management || null);
      setShowCancelConfirm(false);
      setSuccessMessage(payload.message || "Votre réservation a bien été annulée.");
    } catch (error) {
      setActionError(error?.message || "Impossible d’annuler la réservation.");
    } finally {
      setIsCanceling(false);
    }
  }

  if (isLoading || (reservation && restaurantLoading)) {
    return <FlowStatus icon={Loader2} title="Chargement en cours" loading>Nous retrouvons le détail de votre réservation.</FlowStatus>;
  }

  if (loadError) {
    return <FlowStatus icon={TriangleAlert} title="Réservation introuvable" tone="error" actions={[{ href: "/reservations", label: "Réserver une table" }, { href: contactHref, label: "Nous contacter" }]}>{loadError}</FlowStatus>;
  }

  if (restaurantMismatch) {
    return <FlowStatus icon={TriangleAlert} title="Lien non valide" tone="error" actions={[{ href: "/reservations", label: "Retour aux réservations" }, { href: contactHref, label: "Nous contacter" }]}>Cette réservation n’est pas rattachée à L’Ambassade.</FlowStatus>;
  }

  const status = String(reservation?.status || "");
  const isAwaitingBankHold = status === "AwaitingBankHold" && management?.reasonCode !== "BANK_HOLD_EXPIRED";
  const isCanceled = status === "Canceled";
  const canCancel = management?.canCancel === true && !restaurantMismatch;

  return (
    <div className="ambassade-manage">
      <div className="ambassade-manage__status-line">
        <StatusPill status={status} />
        <span>Réservation #{String(reservation?._id || "").slice(-6).toUpperCase()}</span>
      </div>

      <div className="ambassade-manage__details">
        <Detail icon={CalendarDays} label="Date">{formatReservationDateLabel(reservation?.reservationDate)}</Detail>
        <Detail icon={Clock3} label="Heure">{formatTimeLabel(reservation?.reservationTime)}</Detail>
        <Detail icon={Users} label="Convives">{formatGuestsLabel(reservation?.numberOfGuests)}</Detail>
      </div>

      <section className="ambassade-manage__identity" aria-label="Coordonnées de la réservation">
        <Info icon={MessageSquare} label="Nom">{getCustomerFullName(reservation)}</Info>
        <Info icon={Phone} label="Téléphone">{reservation?.customerPhone || "Non renseigné"}</Info>
        <Info icon={Mail} label="E-mail">{reservation?.customerEmail || "Non renseigné"}</Info>
        {reservation?.commentary ? <Info icon={MessageSquare} label="Demande particulière">{reservation.commentary}</Info> : null}
      </section>

      {isAwaitingBankHold ? (
        <ActionSection icon={CreditCard} title="Validation bancaire requise" description="Finalisez l’empreinte bancaire pour confirmer définitivement votre venue.">
          <div className="ambassade-flow-actions">
            <Link href={`/reservations/${reservationId}/bank-hold`}>Finaliser la validation</Link>
            <ActionLink href={contactHref}>Nous contacter</ActionLink>
          </div>
        </ActionSection>
      ) : null}

      {isCanceled ? (
        <ActionSection icon={Check} title="Votre table a bien été libérée" description="Cette réservation est annulée. Vous pouvez choisir un nouveau créneau à tout moment." tone="success">
          {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
          <div className="ambassade-flow-actions"><Link href="/reservations">Réserver à nouveau</Link><ActionLink href={contactHref}>Nous contacter</ActionLink></div>
        </ActionSection>
      ) : null}

      {!isAwaitingBankHold && !isCanceled ? (
        <ActionSection icon={TriangleAlert} title="Annuler cette réservation" description="L’annulation libère immédiatement votre table. Pour modifier la date, l’heure ou le nombre de convives, contactez directement le restaurant.">
          {actionError ? <Alert tone="error">{actionError}</Alert> : null}
          {canCancel ? (
            <>
              {!showCancelConfirm ? (
                <div className="ambassade-flow-actions">
                  <button type="button" className="ambassade-flow-primary" onClick={() => setShowCancelConfirm(true)}>Annuler la réservation</button>
                  <ActionLink href={contactHref}>Modifier ma venue</ActionLink>
                </div>
              ) : (
                <div className="ambassade-manage__confirm">
                  <p>Confirmez-vous l’annulation ? Cette action est immédiate.</p>
                  <div className="ambassade-manage__confirm-actions">
                    <button type="button" onClick={handleCancelReservation} disabled={isCanceling}>{isCanceling ? <Loader2 className="animate-spin" /> : null}Oui, annuler</button>
                    <button type="button" onClick={() => setShowCancelConfirm(false)} disabled={isCanceling}>Garder ma réservation</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Alert>{management?.reasonMessage || "Cette réservation ne peut plus être annulée en ligne."}</Alert>
              <div className="ambassade-flow-actions"><ActionLink href={contactHref}>Nous contacter</ActionLink></div>
            </>
          )}
        </ActionSection>
      ) : null}

      {(phoneInfo?.value && phoneInfo.value !== "-") || (emailInfo?.value && emailInfo.value !== "-") ? (
        <p className="ambassade-manage__contact">
          Besoin d’aide ? {phoneInfo?.value && phoneInfo.value !== "-" ? <a href={phoneInfo.href}>{phoneInfo.value}</a> : null}
          {phoneInfo?.value && emailInfo?.value && phoneInfo.value !== "-" && emailInfo.value !== "-" ? " · " : null}
          {emailInfo?.value && emailInfo.value !== "-" ? <a href={emailInfo.href}>{emailInfo.value}</a> : null}
        </p>
      ) : null}
    </div>
  );
}

function FlowStatus({ icon: Icon, title, tone = "", loading = false, actions = [], children }) {
  return <div className={`ambassade-flow-status${tone ? ` ambassade-flow-status--${tone}` : ""}`}><Icon size={42} strokeWidth={1.2} className={loading ? "animate-spin" : ""} /><h2>{title}</h2><p>{children}</p>{actions.length ? <div className="ambassade-flow-actions">{actions.map((action) => <ActionLink key={`${action.href}-${action.label}`} href={action.href}>{action.label}</ActionLink>)}</div> : null}</div>;
}

function Detail({ icon: Icon, label, children }) {
  return <div><Icon size={27} strokeWidth={1.25} /><p><span>{label}</span><strong>{children}</strong></p></div>;
}

function Info({ icon: Icon, label, children }) {
  return <div><Icon size={19} strokeWidth={1.35} /><p><span>{label}</span><strong>{children}</strong></p></div>;
}

function ActionSection({ icon: Icon, title, description, tone = "", children }) {
  return <section className={`ambassade-manage__action${tone ? ` ambassade-manage__action--${tone}` : ""}`}><Icon size={34} strokeWidth={1.2} /><h2>{title}</h2><p>{description}</p>{children}</section>;
}

function Alert({ tone = "info", children }) {
  return <div className={`ambassade-flow-alert${tone !== "info" ? ` ambassade-flow-alert--${tone}` : ""}`}><TriangleAlert size={19} /><p>{children}</p></div>;
}

function ActionLink({ href, children }) {
  if (/^(https?:|mailto:|tel:)/.test(String(href || ""))) return <a href={href}>{children}</a>;
  return <Link href={href || "/contact"}>{children}</Link>;
}

function StatusPill({ status }) {
  return <strong className={`ambassade-manage__pill ambassade-manage__pill--${String(status || "unknown").toLowerCase()}`}>{getReservationStatusLabel(status)}</strong>;
}

function getCustomerFullName(reservation) {
  return String(reservation?.customerName || "").trim() || `${String(reservation?.customerFirstName || "").trim()} ${String(reservation?.customerLastName || "").trim()}`.trim() || "Client";
}

function formatReservationDateLabel(value) {
  const parsedDate = parseReservationDateValue(value);
  return parsedDate ? format(parsedDate, "EEEE d MMMM yyyy", { locale: fr }) : value ? String(value) : "Date à confirmer";
}

function formatTimeLabel(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 5) : "Horaire à confirmer";
}

function formatGuestsLabel(value) {
  const guests = Number(value || 0);
  return guests ? `${guests} ${guests > 1 ? "convives" : "convive"}` : "À confirmer";
}

function getReservationStatusLabel(status) {
  return ({ Pending: "En attente", Confirmed: "Confirmée", AwaitingBankHold: "Validation carte requise", Canceled: "Annulée", Rejected: "Refusée", Finished: "Terminée", Active: "En cours", Late: "En retard", NoShow: "Non honorée" })[String(status || "").trim()] || "Réservation";
}

function getReservationApiErrorMessage({ payload, status, fallbackMessage }) {
  const code = String(payload?.code || "").trim();
  const message = String(payload?.message || "").trim();
  const normalizedMessage = message.toLowerCase();
  if (status === 404 || normalizedMessage.includes("introuvable")) return "Cette réservation est introuvable ou ce lien n’est plus valide.";
  if (code === "NOT_MODIFIABLE" || normalizedMessage.includes("ne peut plus être annul")) return message || "Cette réservation ne peut plus être annulée en ligne.";
  if (normalizedMessage.includes("déjà annul")) return "Cette réservation est déjà annulée.";
  return message || fallbackMessage;
}
