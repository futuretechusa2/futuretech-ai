const QUOTE_PHRASES = [
  // English
  "send me a quote",
  "get a quote",
  "need a quote",
  "want a quote",
  "would like a quote",
  "request a quote",
  "give me a quote",
  "email me a quote",
  "send a quote",
  "need an estimate",
  "want an estimate",
  "send me an estimate",
  "need pricing",
  "want pricing",
  "pricing information",
  "send me pricing",
  "need a proposal",
  "want a proposal",

  // Spanish
  "quiero una cotizacion",
  "quiero cotizacion",
  "necesito una cotizacion",
  "necesito cotizacion",
  "enviame una cotizacion",
  "envia una cotizacion",
  "mandame una cotizacion",
  "manda una cotizacion",
  "me puedes enviar una cotizacion",
  "puedes enviarme una cotizacion",
  "quisiera una cotizacion",
  "solicitar una cotizacion",
  "solicito una cotizacion",

  "quiero un presupuesto",
  "necesito un presupuesto",
  "enviame un presupuesto",
  "mandame un presupuesto",
  "me puedes enviar un presupuesto",
  "quisiera un presupuesto",

  "quiero una propuesta",
  "necesito una propuesta",
  "enviame una propuesta",
  "mandame una propuesta",
  "quisiera una propuesta",

  "quiero saber el precio",
  "necesito saber el precio",
  "cuanto cuesta",
  "cuanto costaria",
  "cual es el precio",
  "informacion de precios",
  "precios por favor",
];

const QUOTE_WORDS = [
  // English
  "quote",
  "estimate",
  "proposal",
  "pricing",

  // Spanish
  "cotizacion",
  "presupuesto",
  "propuesta",
  "precio",
  "precios",
  "costo",
  "costos",
];

const REQUEST_WORDS = [
  // English
  "send",
  "give",
  "get",
  "need",
  "want",
  "request",
  "email",
  "receive",
  "like",

  // Spanish
  "quiero",
  "necesito",
  "enviar",
  "enviame",
  "envia",
  "mandar",
  "mandame",
  "manda",
  "solicitar",
  "solicito",
  "recibir",
  "quisiera",
  "puedes",
  "podrias",
  "deseo",
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
  const normalizedMessage = normalizeText(message);

  if (!normalizedMessage) {
    return false;
  }

  const containsExactPhrase = QUOTE_PHRASES.some((phrase) =>
    normalizedMessage.includes(phrase)
  );

  if (containsExactPhrase) {
    return true;
  }

  const containsQuoteWord = QUOTE_WORDS.some((word) =>
    normalizedMessage.includes(word)
  );

  const containsRequestWord = REQUEST_WORDS.some((word) =>
    normalizedMessage.includes(word)
  );

  return containsQuoteWord && containsRequestWord;
}

export function detectLanguage(message = "") {
  const normalizedMessage = normalizeText(message);

  const spanishIndicators = [
    "quiero",
    "necesito",
    "cotizacion",
    "presupuesto",
    "propuesta",
    "precio",
    "cuanto",
    "enviame",
    "mandame",
    "quisiera",
    "puedes",
    "gracias",
    "negocio",
  ];

  const isSpanish = spanishIndicators.some((word) =>
    normalizedMessage.includes(word)
  );

  return isSpanish ? "es" : "en";
}
