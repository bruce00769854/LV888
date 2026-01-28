/**
 * LV 珠寶競賽 - 全域常數設定 (純 JS 版)
 */

export const MANAGER_PASSWORD = "888";

export const TEAMS_INITIAL_DATA = [
  { id: 1, name: 'SOGO 復興一組', leader: 'Alice', score: 0, password: '123' },
  { id: 2, name: 'SOGO 復興二組', leader: 'Bob', score: 0, password: '456' },
  { id: 3, name: 'SOGO 復興三組', leader: 'Charlie', score: 0, password: '789' },
  { id: 4, name: 'SOGO 復興四組', leader: 'David', score: 0, password: '000' }
];

export const GEMS = [
  { name: 'Sapphire', icon: '🔹', value: 1000 },
  { name: 'Emerald', icon: '💚', value: 5000 },
  { name: 'Ruby', icon: '🌹', value: 10000 },
  { name: 'Diamond', icon: '💎', value: 50000 }
];

// 將原本的 Role Enum 改為純物件
export const Role = {
  MANAGER: 'MANAGER',
  LEADER: 'LEADER',
  MEMBER: 'MEMBER'
};

// SVG 圖標部分保持不變，但確保沒有 TypeScript 標記
export const LV_LOGO_SVG = (props) => React.createElement('svg', { 
  viewBox: "0 0 100 100", 
  fill: "currentColor", 
  ...props 
}, React.createElement('path', { d: "M20 20h10v50h30v10H20V20z M50 20h10l15 45 15-45h10L80 80H70L50 20z" }));

export const LV_TEXT_LOGO_SVG = (props) => React.createElement('div', { 
  className: "font-serif tracking-[1em] uppercase text-xl " + (props.className || "") 
}, "Louis Vuitton");

// 其他視覺常數...
export const EYE_ICON = "👁️";
export const EYE_OFF_ICON = "🙈";

export const LV_MONOGRAM_PATTERN = () => React.createElement('div', {
  className: "absolute inset-0 opacity-[0.03] pointer-events-none",
  style: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20l10-10l10 10l-10 10z' fill='%23d4af37'/%3E%3C/svg%3E")`,
    backgroundSize: '40px 40px'
  }
});
