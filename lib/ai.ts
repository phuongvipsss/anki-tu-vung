import { GoogleGenAI } from "@google/genai";

export type AIGeneratedContent = {
  examples: {
    level: string;
    en: string;
    vi: string;
  }[];
  mistakes: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  wordFamily: string[];
};

export async function generateExamples(word: string, meaningVi: string, apiKey: string): Promise<AIGeneratedContent> {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
  You are an expert English teacher. I am learning the word "${word}" (meaning: "${meaningVi}").
  Please generate:
  1. 3 natural example sentences using this word at A1, B1, and B2 CEFR levels.
  2. Translate each sentence into Vietnamese.
  3. Briefly explain 1-2 common usage mistakes for this word (in Vietnamese).
  4. Provide up to 3 synonyms.
  5. Provide up to 3 antonyms (if applicable, else empty array).
  6. Provide up to 3 common collocations (e.g. "make a decision").
  7. Provide the word family (e.g. noun, verb, adjective forms).

  Return ONLY a raw JSON object with the following structure (do not use markdown blocks):
  {
    "examples": [
      { "level": "A1", "en": "...", "vi": "..." },
      { "level": "B1", "en": "...", "vi": "..." },
      { "level": "B2", "en": "...", "vi": "..." }
    ],
    "mistakes": "...",
    "synonyms": ["...", "..."],
    "antonyms": ["...", "..."],
    "collocations": ["...", "..."],
    "wordFamily": ["...", "..."]
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    let text = response.text || "";
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text) as AIGeneratedContent;
  } catch (err: any) {
    throw new Error(`AI generation failed: ${err.message}`);
  }
}
