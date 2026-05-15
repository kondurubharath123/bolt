const LLM_API_URL = "https://genailab.tcs.in/v1/chat/completions";
const LLM_MODEL = "azure_ai/genailab-maas-DeepSeek-V3-0324";
const LLM_SYSTEM_PROMPT =
  "You are a strict Compliance AI Agent for a Telecom company. Review the requested deviation and provide a professional, 1-paragraph business justification. Assign a Risk Score of LOW, MEDIUM, or HIGH based on the deviation type. Format your response exactly as: 'Risk Score: [SCORE] \n Justification: [TEXT]'.";

export async function generateAIJustification(
  deviationType: string,
  businessJustification: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_TCS_LLM_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_TCS_LLM_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: LLM_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Deviation Type: ${deviationType}\nBusiness Justification: ${businessJustification}`,
          },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(`API returned ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("LLM API returned empty response");
    }
    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}
