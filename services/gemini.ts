/**
 * 透過 Netlify Function 安全地呼叫 Gemini API
 * 避免在瀏覽器端暴露 API KEY
 */

export const generateSalesMission = async () => {
  try {
    const response = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "generateMission" }),
    });

    if (!response.ok) {
      throw new Error("伺服器回應錯誤，無法生成任務");
    }

    // 取得 JSON 格式的任務內容
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("generateSalesMission 發生錯誤:", error);
    throw error;
  }
};

export const generateMotivationalMessage = async (teamName: string, score: number) => {
  try {
    const response = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        action: "motivate", 
        teamName, 
        score 
      }),
    });

    if (!response.ok) {
      throw new Error("伺服器回應錯誤，無法生成激勵語");
    }

    const data = await response.json();
    // 假設後端回傳格式為 { reply: "內容" }
    return data.reply;
  } catch (error) {
    console.error("generateMotivationalMessage 發生錯誤:", error);
    return "期待各位在高級珠寶領域展現卓越表現。"; // 發生錯誤時的回傳預設優雅語句
  }
};
