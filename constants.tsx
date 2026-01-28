
import React from 'react';

// 精確的 LV 交錯標誌 SVG (Interlocking LV) - 根據官方比例重新繪製
export const LV_LOGO_SVG = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g fill="currentColor">
      {/* V 的部分：兩條大斜線構成的主體 */}
      <path d="M12 18H29L46 72L63 18H80L52 90H38L12 18Z" />
      {/* L 的部分：與 V 交錯穿插的斜筆與橫筆 */}
      <path d="M38 40L44 54L30 84H14V76H23L38 40Z" />
      <path d="M48 84H86V76H51L48 84Z" />
    </g>
  </svg>
);

// LOUIS VUITTON 文字標誌 - 拉開字距的經典幾何無襯線字體
export const LV_TEXT_LOGO_SVG = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 400 60" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <text 
      x="50%" 
      y="40" 
      textAnchor="middle" 
      fill="currentColor" 
      style={{ 
        fontFamily: "'Inter', sans-serif",
        fontWeight: '500',
        letterSpacing: '14px',
        fontSize: '32px'
      }}
    >
      LOUIS VUITTON
    </text>
  </svg>
);

// LV Monogram 背景圖騰組件
export const LV_MONOGRAM_PATTERN = () => (
  <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-0 overflow-hidden select-none" 
       style={{ 
         backgroundImage: `url("data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M35 15L38 32L55 35L38 38L35 55L32 38L15 35L32 32L35 15Z' fill='%23D4AF37'/%3E%3Ccircle cx='105' cy='35' r='12' stroke='%23D4AF37' stroke-width='1.5' fill='none'/%3E%3Cpath d='M100 30L110 40M110 30L100 40' stroke='%23D4AF37' stroke-width='1.5'/%3E%3Crect x='30' y='100' width='12' height='12' stroke='%23D4AF37' stroke-width='1.5' fill='none' transform='rotate(45 36 106)'/%3E%3Ccircle cx='105' cy='105' r='6' fill='%23D4AF37'/%3E%3C/svg%3E")`, 
         backgroundSize: '140px 140px' 
       }}>
  </div>
);

export const LV_TRUNK_SVG = (
  <svg viewBox="0 0 100 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="80" height="50" rx="2" fill="#4a3728" stroke="#D4AF37" strokeWidth="1.5"/>
    <path d="M10 32H90M10 44H90M10 56H90" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.5"/>
    <rect x="44" y="38" width="12" height="18" rx="1" fill="#D4AF37"/>
    <circle cx="50" cy="44" r="1.5" fill="#1a110a"/>
    <rect x="18" y="20" width="3" height="50" fill="#D4AF37" fillOpacity="0.4"/>
    <rect x="79" y="20" width="3" height="50" fill="#D4AF37" fillOpacity="0.4"/>
    <path d="M10 25V20H15" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
    <path d="M85 20H90V25" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 65V70H15" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
    <path d="M85 70H90V65" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const EYE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const EYE_OFF_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

export const TEAMS_INITIAL_DATA = [
  { id: 1, name: 'Heritage Team', leader: 'Alice', score: 0, color: '#D4AF37', password: '123' },
  { id: 2, name: 'Canvas Elite', leader: 'Bob', score: 0, color: '#C5A059', password: '123' },
  { id: 3, name: 'Monogram Kings', leader: 'Charlie', score: 0, color: '#B6914B', password: '123' },
  { id: 4, name: 'Malle Masters', leader: 'Diana', score: 0, color: '#A7823D', password: '123' },
];

export const MANAGER_PASSWORD = 'LV888';
