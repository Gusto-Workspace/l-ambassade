import ManageReservationsComponent from "@/components/reservations/manage.reservations.component";
import ReservationFlowShell from "@/components/reservations/reservation-flow-shell.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";

export default function ReservationManagePage({ reservationId }) {
  return (
    <>
      <SeoHeadComponent
        title="Annuler ma réservation - L’Ambassade"
        description="Consultez votre réservation à L’Ambassade et annulez-la en ligne si nécessaire."
        path={
          reservationId
            ? `/reservations/${reservationId}/manage`
            : "/reservations"
        }
        image="/img/reservations/header.webp"
        noIndex={true}
      />

      <ReservationFlowShell
        eyebrow="Gestion en ligne"
        title="Votre réservation"
      >
        <ManageReservationsComponent
          reservationId={reservationId}
          apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
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
