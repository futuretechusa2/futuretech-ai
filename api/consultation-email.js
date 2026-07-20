import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FUTURE_TECH_EMAIL = "ahelena@futechusa.com";
const CUSTOMER_FROM_EMAIL = "Future Tech USA <info@futechusa.com>";

function clean(value, fallback = "Not provided") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing in Vercel.");
    }

    const {
      name,
      email,
      phone,
      businessName,
      businessType,
      locations,
      monthlyVolume,
      monthlyFees,
      currentProcessor,
      currentPos,
      services,
      consultationNotes,
      leadScore,
      leadPriority,
    } = req.body || {};

    const customerName = clean(name);
    const customerEmail = clean(email, "");
    const customerPhone = clean(phone);
    const companyName = clean(businessName);
    const companyType = clean(businessType);
    const numberOfLocations = clean(locations);
    const processingVolume = clean(monthlyVolume);
    const processingFees = clean(monthlyFees);
    const processor = clean(currentProcessor);
    const posSystem = clean(currentPos);
    const requestedServices = clean(services);
    const notes = clean(consultationNotes);
    const score = clean(String(leadScore || ""));
    const priority = clean(leadPriority, "NEW CONSULTATION REQUEST");

    if (!customerEmail || !customerEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "A valid customer email address is required.",
      });
    }

    const referenceNumber = `FTUSA-${new Date()
      .getFullYear()
      .toString()}-${Date.now().toString().slice(-6)}`;

    const safe = {
      customerName: escapeHtml(customerName),
      customerEmail: escapeHtml(customerEmail),
      customerPhone: escapeHtml(customerPhone),
      companyName: escapeHtml(companyName),
      companyType: escapeHtml(companyType),
      numberOfLocations: escapeHtml(numberOfLocations),
      processingVolume: escapeHtml(processingVolume),
      processingFees: escapeHtml(processingFees),
      processor: escapeHtml(processor),
      posSystem: escapeHtml(posSystem),
      requestedServices: escapeHtml(requestedServices),
      notes: escapeHtml(notes),
      score: escapeHtml(score),
      priority: escapeHtml(priority),
      referenceNumber: escapeHtml(referenceNumber),
    };

    const internalEmail = await resend.emails.send({
      from: CUSTOMER_FROM_EMAIL,
      to: [FUTURE_TECH_EMAIL],
      replyTo: customerEmail,
      subject: `${priority}: ${companyType} — ${customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #1d2939;">
          <div style="background: #071b33; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 25px;">
              New FUTURA Sales Lead
            </h1>
            <p style="color: #cbd5e1; margin: 8px 0 0;">
              Reference: ${safe.referenceNumber}
            </p>
          </div>

          <div style="border: 1px solid #d0d5dd; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <h2 style="margin-top: 0;">Lead Summary</h2>

            <p><strong>Priority:</strong> ${safe.priority}</p>
            <p><strong>Lead Score:</strong> ${safe.score}</p>
            <p><strong>Name:</strong> ${safe.customerName}</p>
            <p><strong>Email:</strong> ${safe.customerEmail}</p>
            <p><strong>Phone:</strong> ${safe.customerPhone}</p>

            <hr style="border: none; border-top: 1px solid #eaecf0; margin: 24px 0;">

            <h2>Business Information</h2>

            <p><strong>Business Name:</strong> ${safe.companyName}</p>
            <p><strong>Business Type:</strong> ${safe.companyType}</p>
            <p><strong>Locations:</strong> ${safe.numberOfLocations}</p>
            <p><strong>Monthly Processing Volume:</strong> ${safe.processingVolume}</p>
            <p><strong>Monthly Processing Fees:</strong> ${safe.processingFees}</p>
            <p><strong>Current Processor:</strong> ${safe.processor}</p>
            <p><strong>Current POS System:</strong> ${safe.posSystem}</p>

            <hr style="border: none; border-top: 1px solid #eaecf0; margin: 24px 0;">

            <h2>Customer Needs</h2>

            <p><strong>Requested Services:</strong><br>${safe.requestedServices}</p>
            <p><strong>Consultation Notes:</strong><br>${safe.notes}</p>

            <p style="margin-top: 28px; font-size: 13px; color: #667085;">
              Submitted through FUTURA on futechusa.com
            </p>
          </div>
        </div>
      `,
    });

    if (internalEmail.error) {
      throw new Error(
        internalEmail.error.message || "The internal notification email failed."
      );
    }

    const customerConfirmation = await resend.emails.send({
      from: CUSTOMER_FROM_EMAIL,
      to: [customerEmail],
      replyTo: "info@futechusa.com",
      subject: "We received your Future Tech USA consultation request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1d2939;">
          <div style="background: #071b33; padding: 26px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 25px;">
              Thank you for contacting Future Tech USA
            </h1>
          </div>

          <div style="border: 1px solid #d0d5dd; border-top: none; padding: 26px; border-radius: 0 0 12px 12px;">
            <p>Hello ${safe.customerName},</p>

            <p>
              We received your consultation request. A Future Tech USA
              specialist will review your information and contact you shortly.
            </p>

            <div style="background: #f2f4f7; padding: 18px; border-radius: 8px; margin: 22px 0;">
              <p style="margin: 0 0 8px;">
                <strong>Reference number:</strong> ${safe.referenceNumber}
              </p>

              <p style="margin: 0 0 8px;">
                <strong>Business:</strong> ${safe.companyName}
              </p>

              <p style="margin: 0;">
                <strong>Requested services:</strong> ${safe.requestedServices}
              </p>
            </div>

            <p>
              Questions can be sent directly to
              <strong>info@futechusa.com</strong>.
            </p>

            <p style="margin-top: 28px;">
              Sincerely,<br>
              <strong>FUTURA</strong><br>
              Future Tech USA<br>
              AI Business Consultant
            </p>
          </div>
        </div>
      `,
    });

    if (customerConfirmation.error) {
      throw new Error(
        customerConfirmation.error.message ||
          "The customer confirmation email failed."
      );
    }

    return res.status(200).json({
      success: true,
      message: "Consultation emails sent successfully.",
      referenceNumber,
    });
  } catch (error) {
    console.error("Consultation email error:", error);

    return res.status(500).json({
      success: false,
      message: "The consultation email could not be sent.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
