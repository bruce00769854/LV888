import React from 'react';

/**
 * LV 經典硬箱視覺組件 (純 JS 版)
 * 移除 TypeScript 類型與 Framer Motion 以確保免編譯環境相容性
 */
const TrunkVisual = ({ score = 0, triggerAnimation = false, gemIcon = '💎', addedValue = 0 }) => {
  // 根據分數計算硬箱等級 (0-3級)
  const getTrunkLevel = (s) => {
    if (s >= 500000) return 3; // 旗艦大硬箱
    if (s >= 100000) return 2; // 中型衣物箱
    return 1; // 經典手提箱
  };

  const level = getTrunkLevel(score);

  return React.createElement('div', { className: "relative w-full aspect-square flex items-center justify-center p-4" },
    // 背景光暈
    React.createElement('div', { 
      className: `absolute inset-0 bg-radial-gradient from-lv-gold/10 to-transparent transition-opacity duration-1000 ${triggerAnimation ? 'opacity-100' : 'opacity-40'}` 
    }),

    // 硬箱主體 (使用簡單的 CSS 類別控制)
    React.createElement('div', { 
      className: "relative z-10 w-full h-full flex items-center justify-center transition-transform duration-500 hover:scale-105"
    },
      // 這裡使用文字符號代替，或你可以放入你的 SVG 路徑
      React.createElement('div', { className: "text-8xl filter drop-shadow-2xl" }, 
        level === 3 ? '🧳' : level === 2 ? '📦' : '💼'
      )
    ),

    // 分數增加時的浮動動畫
    triggerAnimation && React.createElement('div', {
      className: "absolute top-0 animate-bounce text-[#d4af37] font-bold text-xl z-20"
    }, `${gemIcon} +${addedValue.toLocaleString()}`)
  );
};

export default TrunkVisual;
