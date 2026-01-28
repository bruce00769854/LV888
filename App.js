/** @jsx React.createElement */
import React, { useState, useEffect, useMemo } from 'react';
// 必須加上 .js 副檔名，瀏覽器才找得到檔案
import TrunkVisual from './components/TrunkVisual.js'; 
import { generateSalesMission } from './services/gemini.js';
import { 
    TEAMS_INITIAL_DATA, 
    MANAGER_PASSWORD, 
    GEMS 
} from './constants.js';

// 移除所有 interface 和 type 定義，改為純 JS 物件或直接使用

const App = () => {
  // 移除所有 <User | null> 這種類型宣告
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lv_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('lv_competition_teams');
    return saved ? JSON.parse(saved) : TEAMS_INITIAL_DATA;
  });

  const [dailyMission, setDailyMission] = useState(() => {
    const saved = localStorage.getItem('lv_daily_mission');
    return saved ? JSON.parse(saved) : null;
  });

  // UI 狀態
  const [showPasswordInput, setShowPasswordInput] = useState(null);
  const [passwordEntry, setPasswordEntry] = useState('');
  const [loginError, setLoginError] = useState('');

  // 1. 修正：移除所有變數後面的 : string, : number 等標記
  const initiateLogin = (role, teamId, name = 'User') => {
    if (role === 'MEMBER') {
      setUser({ role, teamId, name });
      return;
    }
    setShowPasswordInput({ role, teamId, name });
    setLoginError('');
    setPasswordEntry('');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!showPasswordInput) return;
    const { role, teamId, name } = showPasswordInput;
    
    const isManager = role === 'MANAGER' && passwordEntry === MANAGER_PASSWORD;
    const team = teams.find(t => t.id === teamId);
    const isLeader = role === 'LEADER' && team && passwordEntry === (team.password || '123');

    if (isManager || isLeader) {
      setUser({ role, teamId, name });
      setShowPasswordInput(null);
    } else {
      setLoginError('密碼錯誤');
    }
  };

  // 登入介面
  if (!user) {
    return React.createElement('div', { className: "min-h-screen flex items-center justify-center bg-[#1a110a] p-6" },
      React.createElement('div', { className: "bg-[#2c1e12] p-10 rounded-2xl border border-[#d4af37]/30 w-full max-w-md text-center" },
        React.createElement('h1', { className: "text-[#d4af37] text-3xl mb-8 italic" }, "LV Fine Jewelry"),
        React.createElement('div', { className: "space-y-4" },
          React.createElement('button', { 
            onClick: () => initiateLogin('MANAGER', null, 'Store Manager'),
            className: "w-full py-4 bg-[#d4af37] text-black font-bold rounded-xl"
          }, "經理登入"),
          React.createElement('div', { className: "grid grid-cols-2 gap-3" },
            teams.map(team => React.createElement('button', {
              key: team.id,
              onClick: () => initiateLogin('LEADER', team.id, team.leader),
              className: "py-3 bg-black/40 border border-[#d4af37]/20 text-[#d4af37] rounded-xl text-xs"
            }, `隊長: ${team.leader}`))
          )
        ),
        showPasswordInput && React.createElement('div', { className: "fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6" },
          React.createElement('form', { onSubmit: handlePasswordSubmit, className: "bg-[#1a110a] p-8 rounded-2xl border border-[#d4af37] w-full max-w-sm" },
            React.createElement('input', { 
              type: "password", 
              value: passwordEntry, 
              onChange: e => setPasswordEntry(e.target.value),
              className: "w-full bg-black border border-[#d4af37]/30 p-4 rounded text-white mb-4",
              placeholder: "輸入密碼"
            }),
            loginError && React.createElement('p', { className: "text-red-500 text-xs mb-4" }, loginError),
            React.createElement('button', { type: "submit", className: "w-full py-3 bg-[#d4af37] text-black font-bold" }, "確認登入")
          )
        )
      )
    );
  }

  // 主介面
  return React.createElement('div', { className: "min-h-screen bg-[#1a110a] text-white p-8" },
    React.createElement('header', { className: "flex justify-between items-center mb-12" },
      React.createElement('span', { className: "text-[#d4af37] font-serif text-2xl" }, "LV ODYSSEY"),
      React.createElement('button', { onClick: () => setUser(null), className: "text-xs border border-red-900 px-4 py-2 rounded-full" }, "登出")
    ),
    React.createElement('main', null,
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" },
        teams.map(team => React.createElement('div', { key: team.id, className: "bg-[#2c1e12] p-6 rounded-3xl border border-white/5" },
          React.createElement('h3', { className: "text-[#d4af37] mb-4" }, team.name),
          // 呼叫 TrunkVisual 組件
          React.createElement(TrunkVisual, { score: team.score }),
          React.createElement('div', { className: "mt-4 text-center font-mono text-xl" }, team.score.toLocaleString())
        ))
      )
    )
  );
};

export default App;
