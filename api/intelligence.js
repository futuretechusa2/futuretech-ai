const INDUSTRY_PATTERNS = [
  {
    industry: "Restaurant",
    terms: [
      "restaurant",
      "bar",
      "cafe",
      "coffee shop",
      "bakery",
      "pizzeria",
      "pizza shop",
      "food truck",
      "ghost kitchen",
      "fast casual",
      "quick service",
      "fine dining",
    ],
  },
  {
    industry: "Retail",
    terms: [
      "retail",
      "store",
      "boutique",
      "clothing store",
      "liquor store",
      "convenience store",
      "grocery store",
      "jewelry store",
      "smoke shop",
      "vape shop",
    ],
  },
  {
    industry: "Medical",
    terms: [
      "medical",
      "doctor",
      "dental",
      "dentist",
      "chiropractic",
      "veterinary",
      "clinic",
      "wellness center",
      "healthcare",
    ],
  },
  {
    industry: "Automotive",
    terms: [
      "automotive",
      "auto repair",
      "repair shop",
      "tire shop",
      "collision center",
      "body shop",
      "dealership",
      "fleet service",
      "mechanic",
    ],
  },
  {
    industry: "Professional Services",
    terms: [
      "law firm",
      "accounting firm",
      "insurance agency",
      "consulting firm",
      "salon",
      "spa",
      "barbershop",
      "professional services",
    ],
  },
];

const TECHNICAL_TERMS = [
  "not working",
  "stopped working",
  "offline",
  "won't connect",
  "will not connect",
  "error message",
  "not printing",
  "printer issue",
  "payment declined",
  "cannot process",
  "can't process",
  "pos is down",
  "system is down",
  "terminal is down",
  "wifi problem",
  "network problem",
];

const CONSULTATION_TERMS = [
  "consultation",
  "speak with someone",
  "talk to someone",
  "call me",
  "contact me",
  "callback",
  "quote",
  "proposal",
  "appointment",
];

const REPLACEMENT_TERMS = [
  "replace",
  "replacement",
  "switching",
  "switch processor",
  "new pos",
  "leaving",
  "unhappy with",
  "current system",
];

const GROWTH_TERMS = [
  "opening another",
  "opening a new",
  "expanding",
  "expansion",
  "new location",
  "more locations",
  "growing",
  "franchise",
];

function normalizeText(value) {
  return typeof value === "string"
    ? value.toLowerCase().replace(/\s+/g, " ").trim()
    : "";
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function getConversationText(messages) {
  if (!Array.isArray(messages)) {
    return "";
  }

  return normalizeText(
    messages
      .filter(
        (message) =>
          message &&
          message.role === "user" &&
          typeof message.content === "string"
      )
      .map((message) => message.content)
      .join(" ")
  );
}

function detectIndustry(text) {
  for (const group of INDUSTRY_PATTERNS) {
    if (includesAny(text, group.terms)) {
      return group.industry;
    }
  }

  return "Unknown";
}

function detectLocations(text) {
  const patterns = [
    /(\d+)\s+(?:restaurant|store|shop|office|clinic|location|locations)/i,
    /(?:own|operate|have|manage)\s+(\d+)/i,
    /(\d+)\s+(?:businesses|branches|sites)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      const locations = Number.parseInt(match[1], 10);

      if (Number.isFinite(locations) && locations > 0) {
        return locations;
      }
    }
  }

  return null;
}

function convertVolumeValue(value, suffix) {
  const number = Number.parseFloat(value.replace(/,/g, ""));

  if (!Number.isFinite(number)) {
    return null;
  }

  if (suffix === "k") {
    return number * 1000;
  }

  if (suffix === "m") {
    return number * 1000000;
  }

  return number;
}

function detectMonthlyVolume(text) {
  const patterns = [
    /\$\s?([\d,.]+)\s*(k|m)?\s*(?:per month|monthly|a month)/i,
    /(?:process|processing|volume)[^\d$]{0,20}\$?\s?([\d,.]+)\s*(k|m)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return convertVolumeValue(
        match[1],
        match[2]?.toLowerCase() || ""
      );
    }
  }

  return null;
}

function formatMonthlyVolume(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function detectCurrentPOS(text) {
  const systems = [
    "Clover",
    "Toast",
    "Square",
    "SkyTab",
    "Lightspeed",
    "Shopify",
    "NCR",
    "Micros",
    "Dejavoo",
    "Restaurant365",
  ];

  return (
    systems.find((system) =>
      text.includes(system.toLowerCase())
    ) || "Unknown"
  );
}

function determineUrgency(text) {
  const urgentTerms = [
    "opening today",
    "opening tomorrow",
    "open in an hour",
    "open in two hours",
    "system is down",
    "pos is down",
    "cannot process payments",
    "can't process payments",
    "all locations are down",
  ];

  if (includesAny(text, urgentTerms)) {
    return "URGENT";
  }

  if (
    includesAny(text, TECHNICAL_TERMS) ||
    text.includes("opening this week")
  ) {
    return "HIGH";
  }

  return "NORMAL";
}

function determineRecommendedDirection({
  industry,
  technical,
  replacement,
  growth,
  locations,
}) {
  if (technical) {
    return "Technical Support";
  }

  if (industry === "Restaurant" && locations >= 2) {
    return "Multi-location Restaurant Solution";
  }

  if (industry === "Retail" && locations >= 2) {
    return "Multi-location Retail Solution";
  }

  if (replacement) {
    return "POS and Payment Technology Review";
  }

  if (growth) {
    return "Business Expansion Technology Review";
  }

  if (industry !== "Unknown") {
    return `${industry} Technology Consultation`;
  }

  return "Business Technology Consultation";
}

function determineNextQuestion({
  technical,
  consultationRequested,
  industry,
  locations,
  currentPOS,
}) {
  if (technical) {
    return "What device or system is affected, and what error are you seeing?";
  }

  if (consultationRequested && industry === "Unknown") {
    return "What type of business do you operate?";
  }

  if (industry === "Restaurant" && !locations) {
    return "How many restaurant locations do you operate?";
  }

  if (currentPOS === "Unknown") {
    return "What POS system are you currently using?";
  }

  return "What is the main problem you want the new solution to address?";
}

export function analyzeBusinessIntelligence(messages) {
  const text = getConversationText(messages);

  const industry = detectIndustry(text);
  const locations = detectLocations(text);
  const monthlyVolume = detectMonthlyVolume(text);
  const currentPOS = detectCurrentPOS(text);

  const technical = includesAny(text, TECHNICAL_TERMS);
  const consultationRequested = includesAny(
    text,
    CONSULTATION_TERMS
  );
  const replacement = includesAny(text, REPLACEMENT_TERMS);
  const growth = includesAny(text, GROWTH_TERMS);
  const urgency = determineUrgency(text);

  const enterprise =
    (locations !== null && locations >= 5) ||
    (monthlyVolume !== null && monthlyVolume >= 500000);

  const consultationOpportunity =
    consultationRequested ||
    replacement ||
    growth ||
    enterprise ||
    (locations !== null && locations >= 2);

  const recommendedDirection = determineRecommendedDirection({
    industry,
    technical,
    replacement,
    growth,
    locations,
  });

  const nextQuestion = determineNextQuestion({
    technical,
    consultationRequested,
    industry,
    locations,
    currentPOS,
  });

  return {
    industry,
    locations,
    monthlyVolume,
    monthlyVolumeFormatted: formatMonthlyVolume(monthlyVolume),
    currentPOS,
    technical,
    consultationRequested,
    consultationOpportunity,
    replacement,
    growth,
    enterprise,
    urgency,
    recommendedDirection,
    nextQuestion,
  };
}
