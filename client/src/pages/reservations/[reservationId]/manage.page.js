import ManageReservationsComponent from "@/components/reservations/manage.reservations.component";
import ReservationFlowShell from "@/components/reservations/reservation-flow-shell.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";

export default function ReservationManagePage({ reservationId, manageToken }) {
  return (
    <>
      <SeoHeadComponent
        title="Gérer ma réservation - L’Ambassade"
        description="Consultez et modifiez votre réservation à L’Ambassade, ou annulez-la en ligne si nécessaire."
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
        manageToken={manageToken}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
        />
      </ReservationFlowShell>
    </>
  );
}

export async function getServerSideProps(context) {
  const { reservationId } = context.params;
  const manageToken = String(context.query?.token || "").trim();

  return {
    props: {
      reservationId: reservationId || null,
      manageToken,
    },
  };
}
