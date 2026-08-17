import SibApiV3Sdk from "sib-api-v3-sdk";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatHtmlText(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

async function sendTransactionalEmail(params) {
  // Configuration du client avec la clé API
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    sender: {
      email: "no-reply@gusto-manager.com",
      name: "Formulaire Contact",
    },
    to: params.to,
    subject: params.subject,
    htmlContent: `
      <html>
        <body>
          <p><strong>Restaurant:</strong> ${escapeHtml(params.restaurantName)}</p>
          <p><strong>Nom:</strong> ${escapeHtml(params.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
          <p><strong>Téléphone:</strong> ${escapeHtml(params.phone)}</p>
          <p><strong>Sujet:</strong> ${escapeHtml(params.subject)}</p>
          <p><strong>Message:</strong><br />${formatHtmlText(params.message)}</p>
        </body>
      </html>`,
    replyTo: {
      email: params.email,
      name: params.name,
    },
  };

  try {
    return await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email:",
      error.response ? error.response.body : error,
    );
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Méthode non autorisée" });
    return;
  }

  const data = req.body || {};
  const recipientEmail = String(data.restaurantEmail || "").trim();
  const senderEmail = String(data.email || "").trim();

  if (!recipientEmail || !senderEmail || !String(data.name || "").trim()) {
    return res.status(400).json({ message: "Données invalides" });
  }

  const params = {
    to: [
      {
        email: recipientEmail,
        name:
          String(data.restaurantName || "Restaurant").trim() || "Restaurant",
      },
    ],
    subject: String(
      data.subject || "Nouveau message via le formulaire de contact",
    ).trim(),
    name: data.name,
    email: senderEmail,
    phone: data.phone,
    message: data.message,
    restaurantName: data.restaurantName,
  };

  try {
    await sendTransactionalEmail(params);
    return res.status(200).json({ message: "Email envoyé avec succès" });
  } catch (error) {
    console.error("Erreur d'envoi :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'envoi de l'email" });
  }
}
