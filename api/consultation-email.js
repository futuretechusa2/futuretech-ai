import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_ORIGINS = new Set([
  "https://futechusa.com",
  "https://www.futechusa.com",
  "https://futuretechusa2.github.io",
  "https://futuretech-ai.vercel.app",
]);

const RECIPIENT_EMAIL = "ahelena@futechusa.com";
const SENDER_EMAIL = "Future Tech USA <info@futechusa.com>";

function setCors(req, res) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function clean(value, maxLength = 1000) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim()
    )
    .slice(-30)
    .map((message) => ({
      role: message.role,
      content: clean(message.content, 3000),
    }));
}

function buildConversationText(messages) {
  if (messages.length === 0) {
    return "No conversation transcript was provided.";
  }

  return messages
    .map((message) => {
      const speaker =
        message.role === "assistant" ? "FUTURA" : "CUSTOMER";

      return `${speaker}:\n${message.content}`;
    })
    .join("\n\n");
}

function buildConversationHtml(messages) {
  if (messages.length === 0) {
    return "<p>No conversation transcript was provided.</p>";
  }

  return messages
    .map((message) => {
      const speaker =
        message.role === "assistant" ? "FUTURA" : "CUSTOMER";

      return `
        <div style="margin-bottom:16px;">
          <strong>${speaker}</strong>
          <div style="white-space:pre-wrap;margin-top:4px;">
            ${escapeHtml(message.content)}
          </div>
        </div>
      `;
    })
    .join("");
}

function hasContactInformation({ email, phone }) {
  return Boolean(email || phone);
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests are allowed.",
    });
  }

  const origin = req.headers.origin;

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({
      error: "This website is not allowed to submit consultation requests.",
    });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is missing in Vercel.");

    return res.status(500).json({
      error: "The email service is not configured.",
    });
  }

  const name = clean(req.body?.name, 150);
  const businessName = clean(req.body?.businessName, 200);
  const email = clean(req.body?.email, 250);
  const phone = clean(req.body?.phone, 100);
  const businessType = clean(req.body?.businessType, 200);
  const interest = clean(req.body?.interest, 500);
  const preferredContactTime = clean(
    req.body?.preferredContactTime,
    200
  );
  const summary = clean(req.body?.summary, 5000);
  const messages = normalizeMessages(req.body?.messages);

  if (!name) {
    return res.status(400).json({
      error: "Customer name is required.",
    });
  }

  if (!hasContactInformation({ email, phone })) {
    return res.status(400).json({
      error: "A customer email address or phone number is required.",
    });
  }

  const conversationText = buildConversationText(messages);
  const conversationHtml = buildConversationHtml(messages);

  const subject = `FUTURA customer follow-up: ${
    businessName || name
  }`;

  const text = `
NEW FUTURA CUSTOMER FOLLOW-UP

Customer Name:
${name || "Not provided"}

Business Name:
${businessName || "Not provided"}

Business Type:
${businessType || "Not provided"}

Customer Interest:
${interest || "Not provided"}

Email:
${email || "Not provided"}

Phone:
${phone || "Not provided"}

Preferred Contact Time:
${preferredContactTime || "Not provided"}

SUMMARY

${summary || "No summary was provided."}

CONVERSATION

${conversationText}

Prepared by FUTURA
Future Tech USA
  `.trim();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;color:#111;">
      <h1 style="font-size:24px;">New FUTURA Customer Follow-Up</h1>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Name</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(name) || "Not provided"}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Business</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(businessName) || "Not provided"}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Business Type</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(businessType) || "Not provided"}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Interest</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(interest) || "Not provided"}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Email</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(email) || "Not provided"}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Phone</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(phone) || "Not provided"}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Preferred Contact Time</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(preferredContactTime) || "Not provided"}</td>
        </tr>
      </table>

      <h2 style="font-size:18px;">Summary</h2>
      <div style="white-space:pre-wrap;margin-bottom:24px;">
        ${escapeHtml(summary) || "No summary was provided."}
      </div>

      <h2 style="font-size:18px;">Conversation</h2>
      ${conversationHtml}

      <hr style="margin-top:28px;border:none;border-top:1px solid #ddd;" />

      <p style="font-size:13px;color:#666;">
        Prepared by FUTURA<br />
        Future Tech USA
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [RECIPIENT_EMAIL],
      replyTo: email || undefined,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);

      return res.status(502).json({
        error: "The customer information could not be emailed.",
      });
    }

    return res.status(200).json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Consultation email error:", {
      name: error?.name,
      message: error?.message,
    });

    return res.status(500).json({
      error: "The email service is temporarily unavailable.",
    });
  }
}
