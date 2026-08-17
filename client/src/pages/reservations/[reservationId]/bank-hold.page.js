import BankHoldReservationsComponent from "@/components/reservations/bank-hold.reservations.component";
import ReservationFlowShell from "@/components/reservations/reservation-flow-shell.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";

export default function ReservationBankHoldPage({ reservationId }) {
  return (
    <>
      <SeoHeadComponent
        title="Validation carte - L’Ambassade"
        description="Validez l’empreinte bancaire liée à votre réservation à L’Ambassade."
        path={
          reservationId
            ? `/reservations/${reservationId}/bank-hold`
            : "/reservations"
        }
        image="/img/home/header.webp"
        noIndex={true}
      />

      <ReservationFlowShell eyebrow="Réservation" title="Validation de votre carte">
        <BankHoldReservationsComponent
          reservationId={reservationId}
          apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
          stripePublishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
        />
      </ReservationFlowShell>
    </>
  );
}

export async function getServerSideProps(context) {
  const { reservationId } = context.params;

  return {
    props: {
      reservationId: reservationId || null,
    },
  };
}
