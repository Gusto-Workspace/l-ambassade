import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { Check, Loader2 } from "lucide-react";
import { GlobalContext } from "@/contexts/global.context";

export default function FormContactCompnent() {
  const { restaurantContext } = useContext(GlobalContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  async function onSubmit(data) {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/contact-form-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
          restaurantName: restaurantContext?.restaurantData?.name || "",
          restaurantEmail: restaurantContext?.restaurantData?.email || "",
        }),
      });
      if (!response.ok) throw new Error("contact-form");
      setIsSubmitted(true);
      reset();
    } catch {
      setSubmitError("Une erreur est survenue. Réessayez ou contactez-nous par téléphone.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="ambassade-contact-success">
        <Check size={34} strokeWidth={1.3} />
        <h3 className="ambassade-display">Message envoyé</h3>
        <p>Merci. Notre équipe reviendra vers vous dès que possible.</p>
        <button type="button" className="ambassade-button ambassade-button--outline" onClick={() => setIsSubmitted(false)}>
          Nouveau message
        </button>
      </div>
    );
  }

  return (
    <form className="ambassade-contact-form" onSubmit={handleSubmit(onSubmit)}>
      {submitError ? <p className="ambassade-form-error">{submitError}</p> : null}
      <Field label="Nom & prénom" error={errors.fullName?.message}>
        <input {...register("fullName", { required: "Ce champ est requis." })} />
      </Field>
      <Field label="E-mail" error={errors.email?.message}>
        <input type="email" {...register("email", { required: "Ce champ est requis.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Adresse e-mail invalide." } })} />
      </Field>
      <Field label="Téléphone"><input type="tel" {...register("phone")} /></Field>
      <Field label="Objet de votre demande" error={errors.subject?.message}>
        <select defaultValue="" {...register("subject", { required: "Choisissez un objet." })}>
          <option value="" disabled>Sélectionnez</option>
          <option>Réservation de groupe</option><option>Privatisation</option><option>Événement</option><option>Question générale</option><option>Autre</option>
        </select>
      </Field>
      <Field label="Votre message" error={errors.message?.message}>
        <textarea rows="5" {...register("message", { required: "Écrivez votre message." })} />
      </Field>
      <label className="ambassade-contact-consent">
        <input type="checkbox" {...register("consent", { required: true })} />
        <span>J’accepte que mes informations soient utilisées pour répondre à ma demande.</span>
      </label>
      {errors.consent ? <p className="ambassade-form-error">Votre accord est nécessaire.</p> : null}
      <button type="submit" disabled={isSubmitting} className="ambassade-button ambassade-button--copper">
        {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Envoi…</> : "Envoyer le message"}
      </button>
    </form>
  );
}

function Field({ label, error, children }) {
  return <label className="ambassade-contact-field"><span>{label}</span>{children}{error ? <small>{error}</small> : null}</label>;
}
