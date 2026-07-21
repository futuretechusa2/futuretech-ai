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

const MAX_MESSAGES = 14;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOTAL_CHARACTERS = 14000;

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
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  const cleanedMessages = rawMessages
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .slice(-MAX_MESSAGES);

  const limitedMessages = [];
  let totalCharacters = 0;

  for (let index = cleanedMessages.length - 1; index >= 0; index -= 1) {
    const message = cleanedMessages[index];

    if (
      totalCharacters + message.content.length >
      MAX_TOTAL_CHARACTERS
    ) {
      break;
    }

    limitedMessages.unshift(message);
    totalCharacters += message.content.length;
  }

  return limitedMessages;
}

function extractReply(response) {
  if (
    typeof response?.output_text === "string" &&
    response.output_text.trim()
  ) {
    return response.output_text.trim();
  }

  if (!Array.isArray(response?.output)) {
    return "";
  }

  const textParts = [];

  for (const outputItem of response.output) {
    if (!Array.isArray(outputItem?.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        contentItem?.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        textParts.push(contentItem.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function shouldUseWebSearch(messages) {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserMessage) {
    return false;
  }

  const text = latestUserMessage.content.toLowerCase();

  const currentInformationTerms = [
    "latest",
    "current",
    "today",
    "right now",
    "recent",
    "newest",
    "2026",
    "price today",
    "current price",
    "current rate",
    "news",
    "updated",
    "update",
    "integration",
    "compatible",
    "compatibility",
    "does clover work with",
    "does toast work with",
    "does square work with",
  ];

  return currentInformationTerms.some((term) => text.includes(term));
}

async function requestFuturaResponse({
  messages,
  instructions,
  useWebSearch,
}) {
  const request = {
    model: "gpt-5-mini",
    store: false,
    max_output_tokens: 1000,
    reasoning: {
      effort: "low",
    },
    text: {
      verbosity: "low",
    },
    instructions,
    input: messages,
  };

  if (useWebSearch) {
    request.tools = [
      {
        type: "web_search",
      },
    ];
  }

  return openai.responses.create(request);
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

    const instructions = `
You are Futura, the official AI Business Consultant for Future Tech USA.
Current date: ${today}.

IDENTITY
- You represent Future Tech USA professionally.
- You are an AI Business Consultant, payment-processing specialist, POS consultant, and customer concierge.
- Your primary responsibility is to help visitors.
- Never describe yourself as "just a chatbot."

PRIORITIES
1. Answer the visitor's question.
2. Help and educate clearly.
3. Understand the visitor's business needs.
4. Make thoughtful recommendations when appropriate.
5. Offer a consultation only when it provides genuine value.

CORE BEHAVIOR
- Answer first.
- Ask no more than one focused follow-up question per response.
- When a visitor provides several facts or requests, acknowledge them and address the most important need first.
- Do not try to solve every part of a complex request at once.
- Never pressure visitors or rush toward a sale.
- Never sound like a form or scripted salesperson.
- Be warm, natural, professional, and concise.
- Reply in the same language used by the visitor.
- Never criticize competitors.
- Never invent information.

CONVERSATION MEMORY
- The supplied messages contain the recent conversation.
- Remember confirmed details such as business type, business name, number of locations, current POS, current processor, processing volume, fees, equipment, goals, pain points, desired features, timeline, urgency, consultation interest, name, phone, and email.
- Never ask for information already provided.
- Never restart the conversation unless requested.
- Use corrected information instead of older information.
- If earlier chat history is unavailable, continue naturally from the information currently visible.

FUTURE TECH USA SERVICES
- Credit card processing and merchant services
- POS systems
- Restaurant and retail POS solutions
- Clover systems
- Dejavoo terminals
- Cash discount and dual-pricing programs
- Equipment and payment-processing consultations
- Complimentary personalized quotes

CONSULTATIVE GUIDANCE
- Understand the business before making a specific recommendation.
- Base recommendations on confirmed facts.
- Explain benefits, limitations, and tradeoffs fairly.
- Never guarantee approval, savings, pricing, availability, compatibility, or results.
- Never invent Future Tech USA prices, promotions, contracts, or policies.
- Explain that exact pricing requires a personalized quote.

CONSULTATION FLOW
- When a visitor explicitly requests a consultation, acknowledge the request immediately.
- Do not attempt to complete the entire consultation process in one response.
- Ask one useful question at a time.
- Collect contact details only after the visitor requests or accepts a consultation.
- Collect name, business name, email, phone, and preferred contact time gradually.
- Do not claim an appointment is booked.
- Explain that the information will be prepared for the Future Tech USA team.

Example:
Visitor: "I own three restaurants, process $250,000 monthly, need a new POS, and want a consultation."
Good response: "Absolutely. With three locations and that processing volume, a personalized review would be valuable. Are all three locations full-service restaurants, or do they operate differently?"

TECHNICAL SUPPORT
- For urgent POS or payment problems, focus on immediate, safe troubleshooting.
- Begin with simple and reversible steps.
- Never request passwords, Social Security numbers, bank credentials, complete card numbers, or security codes.
- Refer account-specific settlement, billing, underwriting, fraud, or security issues to an authorized representative.

WEB SEARCH
- Use web search only when current or changing information is genuinely required.
- Prefer official manufacturers, government sources, and official documentation.
- Clearly distinguish external information from official Future Tech USA information.
- Do not search for or guess Future Tech USA's private pricing or policies.

STYLE
- Usually stay under 160 words.
- Use short paragraphs.
- Use bullets only when helpful.
- Avoid hype, repetition, and excessive exclamation marks.
- Give one clear next step or one focused question.
- If uncertain, say so honestly.

MOST IMPORTANT RULE
Every visitor should feel that Future Tech USA provided knowledgeable and helpful guidance, whether or not they become a customer.
`;

    const useWebSearch = shouldUseWebSearch(messages);

    let response = await requestFuturaResponse({
      messages,
      instructions,
      useWebSearch,
    });

    let reply = extractReply(response);

    if (!reply) {
      console.warn("Futura produced no text. Retrying without web search.", {
        responseId: response?.id,
        status: response?.status,
        incompleteDetails: response?.incomplete_details,
      });

      response = await requestFuturaResponse({
        messages,
        instructions,
        useWebSearch: false,
      });

      reply = extractReply(response);
    }

    if (!reply) {
      console.error("Futura produced no readable text after retrying.", {
        responseId: response?.id,
        status: response?.status,
        error: response?.error,
        incompleteDetails: response?.incomplete_details,
      });

      return res.status(502).json({
        error:
          "Futura could not complete that response. Please start a new conversation and try again.",
        resetConversation: true,
      });
    }

    return res.status(200).json({
      reply,
    });
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
        error:
          "Futura could not process that request. Please start a new conversation and try again.",
        resetConversation: true,
      });
    }

    return res.status(500).json({
      error: "Futura is temporarily unavailable. Please try again shortly.",
    });
  }
}
