import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function WaitlistOfferReservationsComponent({
  token,
  apiBaseUrl,
}) {
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOffer() {
      try {
        if (!token || !apiBaseUrl) {
          throw new Error("Proposition introuvable.");
        }

        const res = await fetch(
          `${apiBaseUrl}/reservations/waitlist-offers/${token}`,
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data?.message || "Cette proposition n’est plus disponible.",
          );
        }

        setOffer(data);
      } catch (err) {
        setError(err?.message || "Cette proposition n’est plus disponible.");
      } finally {
        setLoading(false);
      }
    }

    loadOffer();
  }, [apiBaseUrl, token]);

  const reservation = offer?.reservation || {};
  const offerActive = offer?.state === "offered";
  const expiresLabel = useMemo(
    () => formatDateTime(offer?.offerExpiresAt),
    [offer?.offerExpiresAt],
  );

  async function respond(action) {
    try {
      setActionLoading(action);
      setError("");
      setMessage("");

      const res = await fetch(
        `${apiBaseUrl}/reservations/waitlist-offers/${token}/${action}`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message || "Impossible de répondre à cette proposition.",
        );
      }

      if (data?.requiresAction && data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      setOffer((prev) => ({
        ...prev,
        state: action === "accept" ? "accepted" : "declined",
        reservation: data?.reservation || prev?.reservation,
      }));
      setMessage(
        action === "accept"
          ? "Votre réservation est confirmée."
          : "Votre refus a bien été pris en compte.",
      );
    } catch (err) {
      setError(err?.message || "Impossible de répondre à cette proposition.");
    } finally {
      setActionLoading("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-[640px] rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Chargement</h1>
          <p className="mt-4 flex items-center gap-2 text-black/70">
            <Loader2 className="size-4 animate-spin" />
            Vérification de la proposition...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-[680px] rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
          Liste d’attente
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Une place s’est libérée</h1>

        {reservation?._id ? (
          <div className="mt-6 grid gap-3 rounded-2xl bg-black/5 p-4 text-sm text-black/75 tablet:grid-cols-2">
            <p>
              <span className="block text-xs uppercase tracking-[0.14em] text-black/45">
                Restaurant
              </span>
              {reservation.restaurantName || "Restaurant"}
            </p>
            <p>
              <span className="block text-xs uppercase tracking-[0.14em] text-black/45">
                Couverts
              </span>
              {reservation.numberOfGuests || 0}
            </p>
            <p>
              <span className="block text-xs uppercase tracking-[0.14em] text-black/45">
                Date
              </span>
              {formatDate(reservation.reservationDate)}
            </p>
            <p>
              <span className="block text-xs uppercase tracking-[0.14em] text-black/45">
                Heure
              </span>
              {reservation.reservationTime || "-"}
            </p>
          </div>
        ) : null}

        {offerActive && expiresLabel ? (
          <p className="mt-4 text-sm text-black/60">
            Réponse possible jusqu’au {expiresLabel}.
          </p>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {offerActive ? (
          <div className="mt-6 flex flex-col gap-3 tablet:flex-row">
            <button
              type="button"
              onClick={() => respond("accept")}
              disabled={Boolean(actionLoading)}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading === "accept"
                ? "Acceptation..."
                : "Accepter la place"}
            </button>
            <button
              type="button"
              onClick={() => respond("decline")}
              disabled={Boolean(actionLoading)}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-black/10 px-5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {actionLoading === "decline" ? "Envoi..." : "Refuser"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
