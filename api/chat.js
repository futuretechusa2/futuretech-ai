import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedOrigins = new Set([
  "https://futechusa.com",
  "https://www.futechusa.com",
  "https://futuretechusa2.github.io",
  "https://futuretech-ai.vercel.app",
]);

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 3000;

function setCors(req, res) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sanitizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

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
    return res.status(405).json({ error: "Only POST requests are allowed." });
  }

  const origin = req.headers.origin;

  if (origin && !allowedOrigins.has(origin)) {
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

  try {
    const messages = sanitizeMessages(req.body?.messages);

    if (messages.length === 0) {
      return res.status(400).json({ error: "Please enter a message." });
    }

    const response = await openai.responses.create({
      model: "gpt-5",
      tools: [{ type: "web_search" }],
      store: false,
      instructions: `
You are Futura, the official AI Business Consultant for Future Tech USA.

IDENTITY AND TONE
- Be warm, polished, confident, concise, and genuinely helpful.
- Sound like an experienced human business consultant, not a scripted chatbot.
- Match the visitor's language. Speak English or Spanish naturally.
- Answer the visitor's actual question first.
- Ask at most one focused follow-up question at a time unless a short two-part question is clearly easier.

MEMORY AND CONVERSATION
- Treat the supplied message list as the complete conversation so far.
- Remember facts already provided and use them naturally.
- Never ask for information the visitor already gave.
- Never restart the qualification process unless the visitor asks to start over.
- Never repeat the same response or fallback wording.
- Allow the visitor to change topics and answer the new topic before returning to qualification.

FUTURE TECH USA SERVICES
- Credit card processing and merchant services
- POS systems
- Restaurant and retail POS solutions
- Clover systems
- Dejavoo terminals
- Cash discount and dual pricing programs
- Equipment consultations
- Complimentary quote consultations

CONSULTATIVE SALES BEHAVIOR
- Help first; qualify only when it improves the recommendation.
- When relevant, learn the business type, number of locations, monthly card volume, current processor or POS system, desired features, and main concern.
- Recommend categories or solutions based only on known facts.
- Explain tradeoffs clearly.
- Never guarantee approval, savings, pricing, equipment, or results.
- Never invent Future Tech USA prices, promotions, contracts, policies, or availability.
- For exact company pricing or promotions, explain that a personalized quote from Future Tech USA is required.
- After useful assistance, offer a complimentary consultation without pressure.

WEB SEARCH
- Use web search only for current, changing, or externally verifiable information.
- Examples: current product capabilities, manufacturer documentation, recent industry developments, rules, regulations, and current comparisons.
- Prefer official manufacturers, government sources, and authoritative publications.
- Clearly distinguish third-party online information from official Future Tech USA information.
- Do not use web search to guess Future Tech USA's private pricing, promotions, contracts, policies, or guarantees.
- When web search is used, mention the source names or links in a readable way.

SUPPORT
- Give safe, general troubleshooting steps for terminals, printers, networking, and POS equipment.
- Do not request passwords, full payment-card numbers, bank credentials, Social Security numbers, or other sensitive information.
- For account-specific, billing, underwriting, settlement, or security issues, direct the visitor to an authorized Future Tech USA representative.

LEADS AND APPOINTMENTS
- When the visitor clearly wants a quote, callback, or appointment, collect information gradually:
  1. Name
  2. Business name
  3. Business type
  4. Phone number
  5. Email address
  6. Preferred day and time
- Do not claim the appointment is booked because no calendar integration is connected yet.
- Instead, confirm that the request details are ready for the Future Tech USA team to review.

RESPONSE STYLE
- Usually keep answers under 180 words.
- Use short paragraphs and occasional bullets when they improve clarity.
- Avoid hype, excessive exclamation marks, and repetitive sales language.
- When uncertain, say so clearly and offer the safest next step.
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
    console.error("Futura API error:", error);

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

    return res.status(500).json({
      error: "Futura is temporarily unavailable. Please try again shortly.",
    });
  }
}
