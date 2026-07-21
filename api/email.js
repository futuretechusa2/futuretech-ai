export function buildFutureTechEmail(summary) {
  return {
    subject: "New FUTURA Consultation Request",

    message: `
A new consultation request has been submitted.

--------------------------------------------------

${summary}

--------------------------------------------------

Prepared By:

FUTURA
Senior AI Business Consultant
Future Tech USA

--------------------------------------------------
`,
  };
}

export function buildCustomerConfirmation(name) {
  return {
    subject: "Future Tech USA Consultation Confirmation",

    message: `
Hello ${name},

Thank you for contacting Future Tech USA.

Your consultation request has been successfully submitted and has been forwarded to our team for review.

We appreciate the opportunity to learn more about your business and look forward to speaking with you.

--------------------------------------------------

Prepared By:

FUTURA
Senior AI Business Consultant
Future Tech USA

--------------------------------------------------

This is an automated confirmation email.

--------------------------------------------------
`,
  };
}

export function validateEmailSubmission(consultation) {
  if (!consultation.customer.name) {
    return false;
  }

  if (!consultation.customer.email) {
    return false;
  }

  if (!consultation.consultation.requested) {
    return false;
  }

  return true;
}

export function prepareFutureTechNotification(summary) {
  return {
    to: "ahelena@futechusa.com",
    ...buildFutureTechEmail(summary),
  };
}

export function prepareCustomerNotification(consultation) {
  return {
    to: consultation.customer.email,
    ...buildCustomerConfirmation(consultation.customer.name),
  };
}
