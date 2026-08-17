import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";
import WaitlistOfferReservationsComponent from "@/components/reservations/waitlist-offer.reservations.component";
import ReservationFlowShell from "@/components/reservations/reservation-flow-shell.component";

export default function ReservationWaitlistOfferPage({ token }) {
  return (
    <>
      <SeoHeadComponent
        title="Liste d’attente - L’Ambassade"
        description="Répondez à une proposition de place pour votre réservation à L’Ambassade."
        path={token ? `/reservations/waitlist-offer/${token}` : "/reservations"}
        image="/img/home/header.webp"
        noIndex={true}
      />

      <ReservationFlowShell eyebrow="Liste d’attente" title="Une table vient de se libérer">
        <WaitlistOfferReservationsComponent
          token={token}
          apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
        />
      </ReservationFlowShell>
    </>
  );
}

export async function getServerSideProps(context) {
  const { token } = context.params;

  return {
    props: {
      token: token || null,
    },
  };
}
