import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { buildGiftCardValidityLabel } from "@/_assets/utils/gift-cards.utils";

function normalizeText(value) {
  return String(value || "").trim();
}

export default function InfosFormGiftCardsComponent({
  formData,
  giftCard,
  giftCardSettings,
  onChange,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: formData });

  useEffect(() => {
    reset(formData);
  }, [formData, reset]);

  function bindField(name, options = {}) {
    const registration = register(name, options);
    return {
      ...registration,
      onChange: (event) => {
        registration.onChange(event);
        onChange({
          [name]:
            event.target.type === "checkbox"
              ? event.target.checked
              : event.target.value,
        });
      },
    };
  }

  function submit(values) {
    const normalizedValues = {
      ...values,
      beneficiaryFirstName: normalizeText(values.beneficiaryFirstName),
      // Le contrat API historique sépare prénom et nom. Le champ libre est
      // conservé dans le premier champ pour accepter aussi les surnoms.
      beneficiaryLastName: "",
      sender: normalizeText(values.sender),
      comment: normalizeText(values.comment),
      sendEmail: normalizeText(values.sendEmail).toLowerCase(),
      buyerFirstName: normalizeText(values.buyerFirstName),
      buyerLastName: normalizeText(values.buyerLastName),
      buyerPhone: normalizeText(values.buyerPhone),
      hidePrice: Boolean(values.hidePrice),
    };
    onChange(normalizedValues);
    onSubmit(normalizedValues);
  }

  const requiredRule = {
    required: "Ce champ est obligatoire.",
    validate: (value) => normalizeText(value).length > 0 || "Ce champ est obligatoire.",
  };

  return (
    <form className="ambassade-gift-form" onSubmit={handleSubmit(submit)} noValidate>
      <fieldset>
        <legend>La carte cadeau</legend>
        <GiftField label="Bénéficiaire" error={errors.beneficiaryFirstName}>
          <input
            autoComplete="off"
            maxLength={160}
            placeholder="Prénom, nom ou surnom"
            {...bindField("beneficiaryFirstName", requiredRule)}
          />
        </GiftField>
        <GiftField label="De la part de" error={errors.sender}>
          <input autoComplete="off" maxLength={120} {...bindField("sender", requiredRule)} />
        </GiftField>
        <GiftField label="Votre message (facultatif)" error={errors.comment}>
          <textarea rows={3} maxLength={180} {...bindField("comment")} />
        </GiftField>
        {giftCard?.description ? (
          <label className="ambassade-gift-form__check">
            <input type="checkbox" {...bindField("hidePrice")} />
            <span>Masquer le prix sur la carte envoyée</span>
          </label>
        ) : null}
      </fieldset>

      <fieldset>
        <legend>Vos coordonnées</legend>
        <GiftField label="Adresse email d’envoi" error={errors.sendEmail}>
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            {...bindField("sendEmail", {
              required: "Ce champ est obligatoire.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Saisissez une adresse email valide.",
              },
            })}
          />
        </GiftField>
        <div className="ambassade-gift-form__row">
          <GiftField label="Votre prénom" error={errors.buyerFirstName}>
            <input autoComplete="given-name" maxLength={80} {...bindField("buyerFirstName", requiredRule)} />
          </GiftField>
          <GiftField label="Votre nom" error={errors.buyerLastName}>
            <input autoComplete="family-name" maxLength={80} {...bindField("buyerLastName", requiredRule)} />
          </GiftField>
        </div>
        <GiftField label="Votre téléphone" error={errors.buyerPhone}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={30}
            {...bindField("buyerPhone", {
              required: "Ce champ est obligatoire.",
              pattern: {
                value: /^[+()\d\s.-]{6,30}$/,
                message: "Saisissez un numéro de téléphone valide.",
              },
            })}
          />
        </GiftField>
      </fieldset>

      <p className="ambassade-gift-form__notice">
        {buildGiftCardValidityLabel(giftCard, giftCardSettings)}. Après paiement,
        la carte et son code unique seront envoyés à l’adresse indiquée.
      </p>
      <button className="ambassade-button ambassade-button--copper" type="submit">
        Continuer vers le paiement
      </button>
    </form>
  );
}

function GiftField({ label, error, children }) {
  return (
    <label className="ambassade-gift-field">
      <span>{label}</span>
      {children}
      {error ? <small role="alert">{error.message}</small> : null}
    </label>
  );
}
