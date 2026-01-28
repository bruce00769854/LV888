const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { action, teamName, score } = JSON.parse(event.body);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // 2026 推薦穩定版

    if (action === "generateMission") {
      const prompt = "作為LV精品店經理，請生成一個有趣的每日銷售任務。格式需包含：任務標題、任務簡介、任務具體目標(Objective)、詳細規則與標準(Rules/Criteria)、獎勵寶石類型(Sapphire, Emerald, Ruby, Diamond)。請用繁體中文。";
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              content: { type: SchemaType.STRING },
              objective: { type: SchemaType.STRING },
              rules: { type: SchemaType.STRING },
              gemType: { type: SchemaType.STRING },
            },
            required: ["title", "content", "objective", "rules", "gemType"],
          },
        },
      });
      return { statusCode: 200, body: result.response.text() };
    }

    if (action === "motivate") {
      const prompt = `請以LV精品店經理的口吻，為目前得分 ${score} 分的 ${teamName} 寫一句優雅且具激勵性的話語，鼓勵他們在下一個月繼續努力。限50字以內，繁體中文。`;
      const result = await model.generateContent(prompt);
      return { statusCode: 200, body: JSON.stringify({ reply: result.response.text() }) };
    }

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
