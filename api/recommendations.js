const POS_SYSTEMS = {
  restaurant: [
    "Toast",
    "Clover",
    "SkyTab",
    "Lightspeed",
    "Restaurant365",
  ],

  retail: [
    "Clover",
    "Square",
    "Shopify",
    "Lightspeed",
  ],

  medical: [
    "Clover",
    "Square",
  ],

  automotive: [
    "Clover",
    "Lightspeed",
    "Square",
  ],

  professional: [
    "Clover",
    "Square",
  ],
};


export function recommendPOS(intelligence) {

  switch (intelligence.industry) {

    case "Restaurant":
      return POS_SYSTEMS.restaurant;

    case "Retail":
      return POS_SYSTEMS.retail;

    case "Medical":
      return POS_SYSTEMS.medical;

    case "Automotive":
      return POS_SYSTEMS.automotive;

    case "Professional Services":
      return POS_SYSTEMS.professional;

    default:
      return [
        "Clover",
        "Square",
      ];
  }

}


export function recommendConsultation(
  intelligence
) {

  if (intelligence.enterprise) {
    return true;
  }

  if (intelligence.consultationRequested) {
    return true;
  }

  if (intelligence.replacement) {
    return true;
  }

  if (intelligence.growth) {
    return true;
  }

  if (
    intelligence.locations &&
    intelligence.locations >= 2
  ) {
    return true;
  }

  return false;

}


export function recommendTechnicalSupport(
  intelligence
) {

  return intelligence.technical;

}


export function recommendPriority(
  intelligence
) {

  if (intelligence.urgency === "URGENT") {
    return "HIGH";
  }

  if (intelligence.enterprise) {
    return "HIGH";
  }

  if (intelligence.growth) {
    return "MEDIUM";
  }

  return "NORMAL";

}


export function buildRecommendationSummary(
  intelligence
) {

  return {

    recommendedPOS:
      recommendPOS(intelligence),

    consultationRecommended:
      recommendConsultation(
        intelligence
      ),

    technicalSupportRecommended:
      recommendTechnicalSupport(
        intelligence
      ),

    priority:
      recommendPriority(
        intelligence
      ),

    recommendedDirection:
      intelligence.recommendedDirection,

  };

}
