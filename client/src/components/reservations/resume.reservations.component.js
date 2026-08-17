import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Loader2, RotateCcw, TriangleAlert } from "lucide-react";

const confirmedStatuses = new Set(["Pending", "Confirmed", "Active", "Late", "Finished"]);

export default function ResumeReservationsComponent({ apiBaseUrl, reservationId }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !reservationId || !apiBaseUrl) return;
    async function resume() {
      try {
        const response = await fetch(`${apiBaseUrl}/reservations/${reservationId}/bank-hold/retry`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl: window.location.origin }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.url) { window.location.href = payload.url; return; }

        const statusResponse = await fetch(`${apiBaseUrl}/reservations/${reservationId}`);
        const statusPayload = await statusResponse.json().catch(() => ({}));
        const status = statusPayload?.reservation?.status;
        if (statusResponse.ok && confirmedStatuses.has(status)) {
          localStorage.removeItem("gm_pending_bank_hold");
          await router.replace(`/reservations?confirmation=${encodeURIComponent(reservationId)}&bankHold=success`);
          return;
        }
        if (["Canceled", "Rejected", "NoShow"].includes(status)) localStorage.removeItem("gm_pending_bank_hold");
        throw new Error(payload.message || "La validation ne peut plus être relancée.");
      } catch (resumeError) { setError(resumeError.message || "Impossible de relancer la validation."); }
    }
    resume();
  }, [apiBaseUrl, reservationId, router.isReady]);

  if (error) return <div className="ambassade-flow-status ambassade-flow-status--error"><TriangleAlert size={42} strokeWidth={1.2} /><h2>Validation indisponible</h2><p>{error}</p><div className="ambassade-flow-actions"><Link href="/reservations">Nouvelle réservation</Link><Link href="/contact">Nous contacter</Link></div></div>;
  return <div className="ambassade-flow-status"><RotateCcw size={42} strokeWidth={1.2} /><h2>Reprise de votre réservation</h2><p>Nous vérifions son statut avant de vous rediriger vers l’étape nécessaire.</p><Loader2 className="animate-spin" /></div>;
}
