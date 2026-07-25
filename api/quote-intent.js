const QUOTE_TERMS = [
  // English
  "quote",
  "quotation",
  "estimate",
  "proposal",
  "pricing",

  // Spanish
  "cotizacion",
  "presupuesto",
  "propuesta",
  "precio",
  "precios",
  "tarifa",
  "tarifas",
];

const REQUEST_TERMS = [
  // English
  "send",
  "email",
  "give",
  "prepare",
  "create",
  "want",
  "need",
  "receive",
  "get",

  // Spanish
  "envia",
  "enviar",
  "enviame",
  "manda",
  "mandar",
  "mandame",
  "correo",
  "quiero",
  "necesito",
  "recibir",
  "prepara",
  "preparar",
  "crea",
  "crear",
  "dame",
];

export function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isQuoteRequest(message = "") {
  const text = normalizeText(message);

  if (!text) {
    return false;
  }

  const hasQuoteTerm = QUOTE_TERMS.some((term) =>
    text.includes(term)
  );

  const hasRequestTerm = REQUEST_TERMS.some((term) =>
    text.includes(term)
  );

  return hasQuoteTerm && hasRequestTerm;
}

export function detectLanguage(message = "") {
  const text = normalizeText(message);

  const spanishTerms = [
    "cotizacion",
    "presupuesto",
    "propuesta",
    "enviame",
    "mandame",
    "quiero",
    "necesito",
    "correo",
    "precio",
    "precios",
    "por favor",
  ];

  return spanishTerms.some((term) => text.includes(term))
    ? "es"
    : "en";
}
