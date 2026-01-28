import React, { useState, useEffect, useMemo } from 'react';
// 注意：這裡的 import 必須加上 .jsx 副檔名，否則瀏覽器會找不到
import TrunkVisual from './components/TrunkVisual.jsx'; 
import { generateSalesMission } from './services/gemini.js';
import { 
    TEAMS_INITIAL_DATA, 
    MANAGER_PASSWORD, 
    EYE_ICON, 
    EYE_OFF_ICON, 
    LV_LOGO_SVG, 
    LV_TEXT_LOGO_SVG, 
    LV_MONOGRAM_PATTERN,
    GEMS,
    Role
} from './constants.js';

const MAX_MANUAL_ADJUSTMENT = 100000;
const MAX_TOTAL_SCORE = 99999999;
const MAX_HISTORY_LENGTH = 15;
const MAX_LOG_LENGTH = 50;
const GLOBAL_FEED_SIZE = 10;

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lv_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('lv_competition_teams');
    return saved ? JSON.parse(saved) : TEAMS_INITIAL_DATA;
  });

  const [sortConfig, setSortConfig] = useState(() => {
    const saved = localStorage.getItem('lv_team_sort_config');
    return saved ? JSON.parse(saved) : { key: 'id', direction: 'asc' };
  });

  const [dailyMission, setDailyMission] = useState(() => {
    const saved = localStorage.getItem('lv_daily_mission');
    return saved ? JSON.parse(saved) : null;
  });

  // UI 狀態控制
  const [showMissionDetail, setShowMissionDetail] = useState(false);
  const [isLoadingMission, setIsLoadingMission] = useState(false);
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [animatingTeamId, setAnimatingTeamId] = useState(null);
  const [lastGem, setLastGem] = useState('💎');
  const [lastAddedValue, setLastAddedValue] = useState(0);

  const [scoreHistory, setScoreHistory] = useState({});
  const [teamLogs, setTeamLogs] = useState(() => {
    const saved = localStorage.getItem('lv_team_logs');
    return saved ? JSON.parse(saved) : {};
  });

  const [showHistoryTeamId, setShowHistoryTeamId] = useState(null);
  const [pendingScoreAction, setPendingScoreAction] = useState(null);
  const [showPasswordInput, setShowPasswordInput] = useState(null);
  const [passwordEntry, setPasswordEntry] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 編輯任務用
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editGemType, setEditGemType] = useState('Sapphire');

  // 管理控制用
  const [manualAdjustValue, setManualAdjustValue] = useState({});
  const [directSetValue, setDirectSetValue] = useState({});

  // --- 持久化儲存 ---
  useEffect(() => {
    localStorage.setItem('lv_competition_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('lv_team_logs', JSON.stringify(teamLogs));
  }, [teamLogs]);

  useEffect(() => {
    if (user) localStorage.setItem('lv_user', JSON.stringify(user));
    else localStorage.removeItem('lv_user');
  }, [user]);

  // --- 核心邏輯 (移除 TypeScript 類型宣告) ---
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const addLog = (teamId, before, after, type) => {
    if (before === after) return;
    setTeamLogs(prev => {
      const logs = prev[teamId] || [];
      const newLog = { timestamp: Date.now(), before, after, type, teamId };
      return { ...prev, [teamId]: [newLog, ...logs].slice(0, MAX_LOG_LENGTH) };
    });
  };

  const addScore = (teamId, gem) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const newScore = Math.min(MAX_TOTAL_SCORE, team.score + gem.value);
    
    addLog(teamId, team.score, newScore, `寶石獎勵: ${gem.name} ${gem.icon}`);
    setLastGem(gem.icon);
    setLastAddedValue(gem.value);
    setAnimatingTeamId(teamId);
    
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, score: newScore } : t));
    setTimeout(() => setAnimatingTeamId(null), 1000);
  };

  const fetchMission = async () => {
    setIsLoadingMission(true);
    try {
      const mission = await generateSalesMission();
      setDailyMission(mission);
      setEditTitle(mission.title);
      setEditContent(mission.content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMission(false);
    }
  };

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
    
    // 經理或隊長驗證邏輯
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

  const displayTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      const res = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortConfig.direction === 'asc' ? res : -res;
    });
  }, [teams, sortConfig]);

  // --- 渲染部分保持不變但確保沒有類型限制 ---
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-luxury p-6 relative">
        <LV_MONOGRAM_PATTERN />
        <div className="bg-[#2c1e12]/90 border border-lv-gold/30 p-10 rounded-2xl shadow-2xl w-full max-w-md text-center relative z-10">
          <LV_TEXT_LOGO_SVG className="w-full h-12 lv-gold mb-8" />
          <h1 className="text-3xl font-serif lv-gold mb-1 tracking-widest italic uppercase">Fine Jewelry</h1>
          <p className="text-gray-500 mb-12 text-[9px] uppercase tracking-[0.4em]">台北SOGO 復興店</p>
          
          <div className="space-y-4">
            <button onClick={() => initiateLogin('MANAGER', null, 'Store Manager')} className="w-full py-5 bg-lv-gold text-black font-black rounded-xl uppercase text-[10px]">經理登入</button>
            <div className="grid grid-cols-2 gap-3">
              {teams.map(team => (
                <button key={team.id} onClick={() => initiateLogin('LEADER', team.id, team.leader)} className="py-4 bg-black/40 border border-lv-gold/20 lv-gold rounded-xl text-[10px] uppercase font-black">隊長: {team.leader}</button>
              ))}
            </div>
          </div>

          {showPasswordInput && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6">
               <form onSubmit={handlePasswordSubmit} className="bg-[#1a110a] p-8 rounded-2xl border border-lv-gold w-full max-w-sm">
                  <input type="password" value={passwordEntry} onChange={e => setPasswordEntry(e.target.value)} autoFocus className="w-full bg-black border border-lv-gold/30 p-4 rounded text-white mb-4" placeholder="Password" />
                  {loginError && <p className="text-red-500 text-xs mb-4">{loginError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowPasswordInput(null)} className="flex-1 py-3 border border-gray-700 text-gray-500 uppercase text-[10px]">取消</button>
                    <button type="submit" className="flex-1 py-3 bg-lv-gold text-black uppercase text-[10px] font-black">登入</button>
                  </div>
               </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a110a] text-white">
      {/* 這裡請保留你原本 App.tsx 剩下的龐大 HTML 結構，
          但注意要把組件引用（如 <TrunkVisual />）前面的類型限制拿掉 */}
      <header className="p-6 border-b border-lv-gold/20 flex justify-between items-center">
        <LV_LOGO_SVG className="w-8 h-8 lv-gold" />
        <button onClick={() => setUser(null)} className="text-[9px] border border-red-900 px-4 py-2 rounded-full text-red-500">登出</button>
      </header>
      
      <main className="max-w-7xl mx-auto p-8">
        {/* 這裡貼上你原本 App.tsx 裡的任務區塊與隊伍卡片區塊 */}
        <section className="bg-lv-brown/20 p-8 rounded-3xl border border-lv-gold/20 mb-12">
           <div className="flex justify-between mb-4">
             <h2 className="font-serif italic text-2xl lv-gold">每日挑戰</h2>
             {user.role === 'MANAGER' && <button onClick={fetchMission} className="text-xs bg-lv-gold text-black px-4 py-2 rounded">生成任務</button>}
           </div>
           {dailyMission ? (
             <div>
               <p className="text-xl font-bold">{dailyMission.title}</p>
               <p className="text-gray-400 mt-2">{dailyMission.content}</p>
             </div>
           ) : <p className="text-gray-600 italic">尚未發布今日任務</p>}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayTeams.map(team => (
            <div key={team.id} className="bg-[#2c1e12] p-6 rounded-[2rem] border border-white/5 relative">
               <h3 className="font-serif text-xl mb-4 italic">{team.name}</h3>
               {/* 這裡使用 TrunkVisual */}
               <TrunkVisual score={team.score} triggerAnimation={animatingTeamId === team.id} gemIcon={lastGem} addedValue={lastAddedValue} />
               
               <div className="mt-6 flex flex-wrap gap-2">
                  {GEMS.map(gem => (
                    <button key={gem.name} onClick={() => addScore(team.id, gem)} className="p-2 bg-black rounded-lg text-lg hover:scale-110 transition">{gem.icon}</button>
                  ))}
               </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
