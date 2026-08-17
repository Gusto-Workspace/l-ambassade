import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ResumeReservationsComponent({
  apiBaseUrl,
  reservationId,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady || !reservationId) return;

    async function resume() {
      try {
        const res = await fetch(
          `${apiBaseUrl}/reservations/${reservationId}/bank-hold/retry`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              baseUrl: window.location.origin,
            }),
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (
            res.status === 404 ||
            String(data?.message || "").includes("expiré") ||
            String(data?.message || "").includes("ne nécessite plus")
          ) {
            localStorage.removeItem("gm_pending_bank_hold");
          }

          throw new Error(
            data?.message || "Impossible de relancer la validation.",
          );
        }

        window.location.href = data.url;
      } catch (e) {
        setError(e.message || "Impossible de relancer la validation.");
      } finally {
        setLoading(false);
      }
    }

    resume();
  }, [reservationId, apiBaseUrl]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[640px] rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Chargement</h1>
          <p className="mt-4 text-black/70">
            Redirection vers la validation de la carte...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[640px] rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Erreur</h1>
          <p className="mt-4 text-black/70">{error}</p>
        </div>
      </main>
    );
  }

  return null;
}
