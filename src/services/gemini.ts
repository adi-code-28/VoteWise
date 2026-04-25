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

export async function getChatResponse(message: string, history: any[] = []) {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: message,
        history: history,
        systemInstruction: SYSTEM_INSTRUCTION
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    return "I'm experiencing some technical difficulties. Please try again later.";
  }
}

export async function explainEligibility(age: number, isCitizen: boolean, otherConstraints: string) {
  const prompt = `Determine voter eligibility for a person who is ${age} years old, is ${isCitizen ? '' : 'not '}a citizen, and has these conditions: ${otherConstraints}. Explain the next steps clearly.`;
  
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        systemInstruction: "You are an Indian election eligibility expert. Provide a detailed, structured eligibility report using markdown (bolding, lists, etc.). Be professional and authoritative. Use bold headers for sections."
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Eligibility analysis error:", error);
    return "Could not determine eligibility at this time.";
  }
}
