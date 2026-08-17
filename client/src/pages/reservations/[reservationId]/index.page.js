import ResumeReservationsComponent from "@/components/reservations/resume.reservations.component";
import ReservationFlowShell from "@/components/reservations/reservation-flow-shell.component";
import SeoHeadComponent from "@/components/_shared/seo/seo-head.component";

export default function ReservationResumePage({ reservationId }) {
  return (
    <>
      <SeoHeadComponent
        title="Suivi de réservation - L’Ambassade"
        description="Consultez le suivi de votre réservation à L’Ambassade."
        path={reservationId ? `/reservations/${reservationId}` : "/reservations"}
        image="/img/home/header.webp"
        noIndex={true}
      />

      <ReservationFlowShell eyebrow="Réservation" title="Reprendre votre validation">
        <ResumeReservationsComponent
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
