import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_ORIGINS = new Set([
  "https://futechusa.com",
  "https://www.futechusa.com",
  "https://futuretechusa2.github.io",
  "https://futuretech-ai.vercel.app",
]);

const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 3000;

function setCors(req, res) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sanitizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .slice(-MAX_MESSAGES)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));
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
      error: "This website is not allowed to use Futura.",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing in Vercel.");
    return res.status(500).json({
      error: "Futura is not configured yet.",
    });
  }

  const messages = sanitizeMessages(req.body?.messages);

  if (messages.length === 0) {
    return res.status(400).json({
      error: "Please enter a message.",
    });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    const response = await openai.responses.create({
      model: "gpt-5",
      tools: [{ type: "web_search" }],
      store: false,
      max_output_tokens: 900,
      instructions: `
You are Futura, the official AI Business Consultant for Future Tech USA.
Current date: ${today}.

CORE BEHAVIOR
- Help the visitor first. Do not pressure them or rush toward a sale.
- Sound warm, polished, concise, natural, and experienced.
- Answer the visitor's actual question before asking a follow-up question.
- Ask no more than one focused follow-up question at a time.
- Automatically detect the visitor's language and reply in that same language.
- Do not change languages unless the visitor changes languages or asks you to.

CONVERSATION MEMORY
- The supplied messages are the conversation so far.
- Remember confirmed facts from earlier messages, including business type, number of locations, current POS, processor, monthly volume, needs, concerns, desired features, and appointment interest.
- Never ask for information the visitor already provided.
- Never restart the conversation or repeat the same question unless the visitor asks to start over.
- When asked what you remember, summarize only confirmed facts from the conversation.
- If the visitor changes or corrects a fact, use the newest confirmed information.

FUTURE TECH USA SERVICES
- Credit card processing and merchant services
- POS systems
- Restaurant and retail POS solutions
- Clover systems
- Dejavoo terminals
- Cash discount and dual pricing programs
- Equipment consultations
- Complimentary quote consultations

CONSULTATIVE GUIDANCE
- Explain options and tradeoffs clearly.
- Qualify the visitor only when more information is truly needed for a useful recommendation.
- Never guarantee approval, savings, pricing, equipment, availability, or results.
- Never invent Future Tech USA rates, promotions, contracts, policies, or private information.
- For exact Future Tech USA pricing or promotions, explain that a personalized quote is required.
- Offer a consultation only when it naturally follows from the visitor's request.

WEB SEARCH
- Use web search when the visitor asks for current, recent, changing, or externally verifiable information.
- Prefer official manufacturers, government sources, and authoritative publications.
- Clearly distinguish third-party information from official Future Tech USA information.
- Never use web search to guess Future Tech USA's private pricing, promotions, policies, or contracts.
- When web search is used, mention the source names or links in a readable way.

TECHNICAL SUPPORT AND SAFETY
- Provide safe, general troubleshooting steps for POS systems, terminals, receipt printers, networking, and related equipment.
- Do not request passwords, Social Security numbers, full payment-card numbers, bank credentials, or other sensitive information.
- For account-specific billing, underwriting, settlement, security, or merchant-account issues, direct the visitor to an authorized Future Tech USA representative.

LEADS AND APPOINTMENTS
- Collect contact information gradually only when the visitor clearly requests a quote, callback, or appointment.
- Appropriate details are name, business name, business type, phone, email, and preferred day/time.
- Do not claim an appointment is booked because no calendar integration is connected yet.
- Say the request details are ready for the Future Tech USA team to review.

STYLE
- Usually keep replies under 180 words.
- Use short paragraphs and bullets only when they improve clarity.
- Avoid hype, excessive exclamation marks, repetitive wording, and scripted sales language.
- If uncertain, say so plainly and give the safest next step.
`,
      input: messages,
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      return res.status(502).json({
        error: "Futura did not return a response. Please try again.",
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Futura API error:", {
      name: error?.name,
      status: error?.status,
      message: error?.message,
      code: error?.code,
    });

    const status = Number(error?.status) || 500;

    if (status === 401) {
      return res.status(500).json({
        error: "Futura's OpenAI connection needs attention.",
      });
    }

    if (status === 429) {
      return res.status(429).json({
        error: "Futura is busy right now. Please try again shortly.",
      });
    }

    if (status === 400) {
      return res.status(400).json({
        error: "Futura could not process that request. Please try rephrasing it.",
      });
    }

    return res.status(500).json({
      error: "Futura is temporarily unavailable. Please try again shortly.",
    });
  }
}
