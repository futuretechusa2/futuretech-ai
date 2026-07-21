export const CONSULTATION_STATUS = {
  NOT_REQUESTED: "NOT REQUESTED",
  IN_PROGRESS: "IN PROGRESS",
  WAITING_FOR_INFORMATION: "WAITING FOR INFORMATION",
  READY_FOR_REVIEW: "READY FOR REVIEW",
  READY_TO_SUBMIT: "READY TO_SUBMIT",
  SUBMITTED: "SUBMITTED",
  COMPLETE: "COMPLETE",
};

export function createConsultation() {
  return {
    status: CONSULTATION_STATUS.IN_PROGRESS,

    customer: {
      name: "",
      businessName: "",
      email: "",
      phone: "",
      preferredContactTime: "",
    },

    business: {
      type: "",
      locations: "",
      monthlyVolume: "",
      currentPOS: "",
      currentProcessor: "",
      goals: "",
      painPoints: "",
      timeline: "",
    },

    consultation: {
      type: "",
      requested: false,
      recommendedDirection: "",
      conversationSummary: "",
    },
  };
}

export function updateConsultation(consultation, updates) {
  return {
    ...consultation,
    ...updates,
  };
}

export function isReadyForReview(consultation) {
  const customer = consultation.customer;
  const consultationInfo = consultation.consultation;

  return (
    customer.name &&
    customer.email &&
    consultationInfo.requested === true
  );
}

export function isReadyToSubmit(consultation) {
  const customer = consultation.customer;
  const consultationInfo = consultation.consultation;

  return (
    customer.name &&
    customer.email &&
    consultationInfo.requested === true &&
    consultationInfo.conversationSummary
  );
}

export function buildSummary(consultation) {
  return `
-------------------------------------------------

NEW FUTURA CONSULTATION REQUEST

-------------------------------------------------

CUSTOMER INFORMATION

Name:
${consultation.customer.name}

Business Name:
${consultation.customer.businessName}

Email:
${consultation.customer.email}

Phone Number:
${consultation.customer.phone}

Preferred Contact Time:
${consultation.customer.preferredContactTime}

-------------------------------------------------

BUSINESS INFORMATION

Industry:
${consultation.business.type}

Locations:
${consultation.business.locations}

Monthly Volume:
${consultation.business.monthlyVolume}

Current POS:
${consultation.business.currentPOS}

Current Processor:
${consultation.business.currentProcessor}

Goals:
${consultation.business.goals}

Pain Points:
${consultation.business.painPoints}

Timeline:
${consultation.business.timeline}

-------------------------------------------------

CONSULTATION INFORMATION

Consultation Type:
${consultation.consultation.type}

Recommended Direction:
${consultation.consultation.recommendedDirection}

-------------------------------------------------

CONVERSATION SUMMARY

${consultation.consultation.conversationSummary}

-------------------------------------------------

Prepared By:

FUTURA
Senior AI Business Consultant
Future Tech USA

-------------------------------------------------
`;
}

export function submitConsultation(consultation) {

  if (!isReadyToSubmit(consultation)) {
    throw new Error(
      "Consultation is not ready for submission."
    );
  }

  consultation.status =
    CONSULTATION_STATUS.SUBMITTED;

  return {
    success: true,
    status: consultation.status,
    summary: buildSummary(consultation),
  };
}
