import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are VoteWise AI, a specialized election assistant. Your goal is to help users understand the election process in a simple, non-partisan, and accurate way.
Key Guidelines:
- Be neutral and objective.
- Simplify complex procedures.
- Focus on voter registration, eligibility, documents, and finding polling booths.
- Debunk myths with facts (Myth vs. Fact).
- If you don't know something for a specific region, advise the user to check their official Election Commission website.
- Support English, Hindi, Bengali, Tamil, and Marathi.
- Keep responses encouraging for first-time voters.
- Use bullet points for checklists.
- ALWAYS respond in the primary language selected by the user.
`;

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm experiencing some technical difficulties. Please try again later.";
  }
}

export async function explainEligibility(age: number, isCitizen: boolean, otherConstraints: string) {
  const prompt = `Determine voter eligibility for a person who is ${age} years old, is ${isCitizen ? '' : 'not '}a citizen, and has these conditions: ${otherConstraints}. Explain the next steps clearly.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an Indian election eligibility expert. Provide a detailed, structured eligibility report using markdown (bolding, lists, etc.). Be professional and authoritative. If a value like 't' or numeric garbage is provided for a location, ignore it and treat the context as general Indian elections. Use bold headers for sections.",
      }
    });
    return response.text;
  } catch (error) {
    return "Could not determine eligibility at this time.";
  }
}
