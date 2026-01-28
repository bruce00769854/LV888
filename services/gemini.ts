
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSalesMission = async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "作為LV精品店經理，請生成一個有趣的每日銷售任務。格式需包含：任務標題、任務簡介、任務具體目標(Objective)、詳細規則與標準(Rules/Criteria)、獎勵寶石類型(Sapphire, Emerald, Ruby, Diamond)。請用繁體中文。",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          objective: { type: Type.STRING },
          rules: { type: Type.STRING },
          gemType: { type: Type.STRING },
        },
        required: ["title", "content", "objective", "rules", "gemType"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const generateMotivationalMessage = async (teamName: string, score: number) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `請以LV精品店經理的口吻，為目前得分 ${score} 分的 ${teamName} 寫一句優雅且具激勵性的話語，鼓勵他們在下一個月繼續努力。限50字以內，繁體中文。`,
  });
  return response.text;
};
