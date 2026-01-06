import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateFlavorText = async (context: {
  level: number;
  kills: number;
  healthPercent: number;
  situation: 'LEVEL_UP' | 'GAME_OVER' | 'BOSS_SPAWN';
}): Promise<string> => {
  if (!ai) return getDefaultFlavorText(context.situation);

  try {
    const prompt = `
      You are the Dark Narrator of a survival rogue-lite game. 
      The player is a survivor fighting hordes of monsters.
      
      Current Stats:
      - Level: ${context.level}
      - Kills: ${context.kills}
      - Health: ${Math.round(context.healthPercent)}%
      
      Situation: ${context.situation}
      
      Write a SINGLE sentence, short (max 15 words), atmospheric, dark fantasy comment.
      Do not use quotes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text?.trim() || getDefaultFlavorText(context.situation);
  } catch (error) {
    console.warn("Gemini API failed, using fallback.", error);
    return getDefaultFlavorText(context.situation);
  }
};

const getDefaultFlavorText = (situation: string) => {
  switch (situation) {
    case 'LEVEL_UP': return "Power surges through your veins.";
    case 'GAME_OVER': return "The darkness consumes you.";
    case 'BOSS_SPAWN': return "A terrible presence approaches.";
    default: return "Survive.";
  }
};
