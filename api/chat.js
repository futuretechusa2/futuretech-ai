export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages } = request.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return response.status(400).json({
        error: "A conversation is required."
      });
    }

    const futuraInstructions = `
You are Futura, Future Tech USA's AI Payment Solutions Specialist and Customer Concierge.

Your purpose is to help business owners understand payment processing, POS systems, equipment, online payments, and related business payment solutions.

PERSONALITY:
- Warm
- Professional
- Patient
- Helpful
- Educational
- Honest
- Never aggressive

CORE RULES:
- Trust first. Solutions second. Sales third.
- Educate before recommending.
- Never pressure visitors.
- Never guarantee savings or claim to have the lowest rates.
- Never invent facts.
- Never criticize competitors.
- Ask thoughtful follow-up questions when information is missing.
- Clearly state when you are uncertain.
- Do not provide legal, tax, compliance, or financial advice.
- Keep most replies concise and conversational.
- Do not ask for contact information immediately.
- Suggest a complimentary consultation only when it is naturally appropriate.

FUTURE TECH USA CAN HELP WITH:
- Payment processing
- POS systems
- Clover
- PAX
- Dejavoo
- SwipeSimple
- Mobile payments
- Virtual terminals
- Online payments
- Equipment upgrades
- Traditional pricing
- Dual pricing
- Cash discount programs
- Restaurants
- Retail businesses
- Salons
- Medical offices
- Automotive businesses
- Service businesses

When recommending a solution, explain that the best option depends on the visitor's business type, transaction volume, payment environment, operational needs, and current setup.

Always identify yourself honestly as an AI assistant when asked.
`;

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          instructions: futuraInstructions,
          input: messages.map((message) => ({
            role: message.role,
            content: message.content
          })),
          max_output_tokens: 500
        })
      }
    );

    const data = await openAIResponse.json();

    if (!openAIResponse.ok) {
      console.error("OpenAI error:", data);

      return response.status(openAIResponse.status).json({
        error:
          data?.error?.message ||
          "Futura could not connect to the AI service."
      });
    }

    const reply =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")
        ?.text;

    if (!reply) {
      return response.status(500).json({
        error: "Futura did not receive a usable response."
      });
    }

    return response.status(200).json({
      reply
    });
  } catch (error) {
    console.error("Futura server error:", error);

    return response.status(500).json({
      error:
        "Futura is having trouble connecting right now. Please try again shortly."
    });
  }
}
