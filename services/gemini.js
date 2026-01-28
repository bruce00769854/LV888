/**
 * LV 珠寶競賽 - Gemini AI 通訊服務 (純 JS 版)
 * 透過呼叫 Netlify Functions 確保 API Key 安全
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

    return await response.json();
  } catch (error) {
    console.error("生成任務失敗:", error);
    throw error;
  }
};

// 修正：移除參數後的 : string 與 : number
export const generateMotivationalMessage = async (teamName, score) => {
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
    return data.reply;
  } catch (error) {
    console.error("激勵語生成失敗:", error);
    return "期待各位在高級珠寶領域展現卓越表現。"; 
  }
};
