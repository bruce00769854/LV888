
import React, { useState, useEffect, useMemo } from 'react';
import { Role, Team, User, GEMS, GemType } from './types';
import { TEAMS_INITIAL_DATA, MANAGER_PASSWORD, EYE_ICON, EYE_OFF_ICON, LV_LOGO_SVG, LV_TEXT_LOGO_SVG, LV_MONOGRAM_PATTERN } from './constants';
import TrunkVisual from './components/TrunkVisual';
import { generateSalesMission } from './services/gemini';

type SortKey = 'id' | 'name' | 'leader' | 'score';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface Mission {
  title: string;
  content: string;
  objective: string;
  rules: string;
  gemType: string;
}

interface HistoryLog {
  timestamp: number;
  before: number;
  after: number;
  type: string;
  teamId?: number;
}

interface PendingScoreAction {
  teamId: number;
  type: 'adjust' | 'direct';
  value: number;
  isAdding?: boolean;
}

const MAX_MANUAL_ADJUSTMENT = 100000;
const MAX_TOTAL_SCORE = 99999999;
const MAX_HISTORY_LENGTH = 15;
const MAX_LOG_LENGTH = 50;
const GLOBAL_FEED_SIZE = 10;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('lv_competition_teams');
    return saved ? JSON.parse(saved) : TEAMS_INITIAL_DATA;
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem('lv_team_sort_config');
    return saved ? JSON.parse(saved) : { key: 'id', direction: 'asc' };
  });
  
  const [dailyMission, setDailyMission] = useState<Mission | null>(() => {
    const saved = localStorage.getItem('lv_daily_mission');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [showMissionDetail, setShowMissionDetail] = useState(false);
  const [isLoadingMission, setIsLoadingMission] = useState(false);
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [animatingTeamId, setAnimatingTeamId] = useState<number | null>(null);
  const [lastGem, setLastGem] = useState('💎');
  const [lastAddedValue, setLastAddedValue] = useState<number>(0);

  const [scoreHistory, setScoreHistory] = useState<Record<number, number[]>>({});
  const [teamLogs, setTeamLogs] = useState<Record<number, HistoryLog[]>>(() => {
    const saved = localStorage.getItem('lv_team_logs');
    return saved ? JSON.parse(saved) : {};
  });
  const [showHistoryTeamId, setShowHistoryTeamId] = useState<number | null>(null);
  const [pendingScoreAction, setPendingScoreAction] = useState<PendingScoreAction | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [showPasswordInput, setShowPasswordInput] = useState<{role: Role, teamId?: number, name: string} | null>(null);
  const [passwordEntry, setPasswordEntry] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editGemType, setEditGemType] = useState('Sapphire');

  const [editingPasswords, setEditingPasswords] = useState<Record<number, string>>({});
  const [editingNames, setEditingNames] = useState<Record<number, string>>({});
  const [editingLeaders, setEditingLeaders] = useState<Record<number, string>>({});
  const [editingScores, setEditingScores] = useState<Record<number, number>>({});

  const [manualAdjustValue, setManualAdjustValue] = useState<Record<number, string>>({});
  const [directSetValue, setDirectSetValue] = useState<Record<number, string>>({});

  useEffect(() => {
    localStorage.setItem('lv_competition_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('lv_team_logs', JSON.stringify(teamLogs));
  }, [teamLogs]);

  useEffect(() => {
    localStorage.setItem('lv_team_sort_config', JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    if (dailyMission) {
      localStorage.setItem('lv_daily_mission', JSON.stringify(dailyMission));
    }
  }, [dailyMission]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' }; 
    });
  };

  const addLog = (teamId: number, before: number, after: number, type: string) => {
    if (before === after) return;
    setTeamLogs(prev => {
      const logs = prev[teamId] || [];
      const newLog: HistoryLog = { timestamp: Date.now(), before, after, type, teamId };
      return { ...prev, [teamId]: [newLog, ...logs].slice(0, MAX_LOG_LENGTH) };
    });
  };

  const pushToHistory = (teamId: number, currentScore: number) => {
    setScoreHistory(prev => {
      const teamHistory = prev[teamId] || [];
      const newHistory = [currentScore, ...teamHistory].slice(0, MAX_HISTORY_LENGTH);
      return { ...prev, [teamId]: newHistory };
    });
  };

  const handleUndo = (teamId: number) => {
    const teamHistory = scoreHistory[teamId] || [];
    if (teamHistory.length === 0) return;

    const [previousScore, ...remainingHistory] = teamHistory;
    const currentTeam = teams.find(t => t.id === teamId);
    if (!currentTeam) return;

    addLog(teamId, currentTeam.score, previousScore, '復原操作 (Undo) ↩️');
    
    setTeams(prev => prev.map(t => 
      t.id === teamId ? { ...t, score: previousScore } : t
    ));
    
    setScoreHistory(prev => ({ ...prev, [teamId]: remainingHistory }));
    
    setAnimatingTeamId(teamId);
    setLastGem('↩️');
    setLastAddedValue(0);
    setTimeout(() => setAnimatingTeamId(null), 500);
  };

  const initiateLogin = (role: Role, teamId?: number, name: string = 'User') => {
    if (role === Role.MEMBER) {
      setUser({ role, teamId, name });
      return;
    }
    setShowPasswordInput({ role, teamId, name });
    setLoginError('');
    setPasswordEntry('');
    setShowLoginPassword(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordInput) return;
    const { role, teamId, name } = showPasswordInput;
    if (role === Role.MANAGER) {
      if (passwordEntry === MANAGER_PASSWORD) {
        setUser({ role, teamId, name });
        setShowPasswordInput(null);
      } else {
        setLoginError('密碼錯誤，請重新輸入');
      }
    } else if (role === Role.LEADER) {
      const team = teams.find(t => t.id === teamId);
      if (team && passwordEntry === (team.password || '123')) {
        setUser({ role, teamId, name });
        setShowPasswordInput(null);
      } else {
        setLoginError('密碼錯誤，請洽詢經理');
      }
    }
  };

  const addScore = (teamId: number, gem: GemType) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    if (team.score + gem.value > MAX_TOTAL_SCORE) {
      alert('已達到最高積分上限。');
      return;
    }
    pushToHistory(teamId, team.score);
    const newScore = Math.min(MAX_TOTAL_SCORE, team.score + gem.value);
    addLog(teamId, team.score, newScore, `寶石獎勵: ${gem.name} ${gem.icon}`);
    
    setLastGem(gem.icon);
    setLastAddedValue(gem.value);
    setAnimatingTeamId(teamId);
    setTeams(prev => prev.map(t => 
      t.id === teamId ? { ...t, score: newScore } : t
    ));
    setTimeout(() => setAnimatingTeamId(null), 1000);
  };

  const handleManualAdjustRequest = (teamId: number, isAdding: boolean, customVal?: number) => {
    let val = customVal;
    if (val === undefined) {
      const valStr = manualAdjustValue[teamId] || '0';
      val = parseInt(valStr);
    }
    if (isNaN(val) || val <= 0) return;
    if (val > MAX_MANUAL_ADJUSTMENT) {
      alert(`單次手動調整數值不得超過 ${MAX_MANUAL_ADJUSTMENT.toLocaleString()}。`);
      return;
    }
    setPendingScoreAction({ teamId, type: 'adjust', value: val, isAdding });
  };

  const handleDirectSetRequest = (teamId: number) => {
    const valStr = directSetValue[teamId];
    if (valStr === undefined || valStr === '') return;
    const val = parseInt(valStr);
    if (isNaN(val) || val < 0) return;
    setPendingScoreAction({ teamId, type: 'direct', value: val });
  };

  const executePendingScoreAction = () => {
    if (!pendingScoreAction) return;
    const { teamId, type, value, isAdding } = pendingScoreAction;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    pushToHistory(teamId, team.score);
    let newScore = team.score;
    let logType = '';
    let gemIcon = '';
    let addedVal = 0;

    if (type === 'adjust') {
      const adjustment = isAdding ? value : -value;
      newScore = Math.max(0, Math.min(MAX_TOTAL_SCORE, team.score + adjustment));
      logType = `手動校準: ${isAdding ? '+' : ''}${adjustment} ${isAdding ? '⭐' : '⚠️'}`;
      gemIcon = isAdding ? '⭐' : '⚠️';
      addedVal = adjustment;
    } else {
      newScore = Math.min(MAX_TOTAL_SCORE, value);
      logType = `管理員總分覆寫: ${value.toLocaleString()} 🎯`;
      gemIcon = '🎯';
      addedVal = 0;
    }

    addLog(teamId, team.score, newScore, logType);
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, score: newScore } : t));
    
    if (type === 'adjust') setManualAdjustValue(prev => ({ ...prev, [teamId]: '' }));
    if (type === 'direct') setDirectSetValue(prev => ({ ...prev, [teamId]: '' }));

    setLastGem(gemIcon);
    setLastAddedValue(addedVal);
    setAnimatingTeamId(teamId);
    setPendingScoreAction(null);
    setTimeout(() => setAnimatingTeamId(null), 1000);
  };

  const resetAllScores = () => {
    teams.forEach(t => {
      pushToHistory(t.id, t.score);
      addLog(t.id, t.score, 0, '競賽點數重置歸零 (System Reset) 🔄');
    });
    setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
    setShowResetConfirm(false);
    alert('所有隊伍點數已成功歸零。');
  };

  const handleManagementChange = (teamId: number, field: 'password' | 'name' | 'leader' | 'score', value: string) => {
    if (field === 'password') setEditingPasswords(prev => ({ ...prev, [teamId]: value }));
    if (field === 'name') setEditingNames(prev => ({ ...prev, [teamId]: value }));
    if (field === 'leader') setEditingLeaders(prev => ({ ...prev, [teamId]: value }));
    if (field === 'score') {
      const parsed = Math.max(0, Math.min(MAX_TOTAL_SCORE, parseInt(value) || 0));
      setEditingScores(prev => ({ ...prev, [teamId]: parsed }));
    }
  };

  const saveTeamManagementChanges = (teamId: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        if (editingScores[teamId] !== undefined) {
           pushToHistory(teamId, t.score);
           addLog(teamId, t.score, editingScores[teamId], `後台得分修改: ${editingScores[teamId].toLocaleString()} 🔧`);
        }
        return {
          ...t,
          password: editingPasswords[teamId] !== undefined ? editingPasswords[teamId] : t.password,
          name: editingNames[teamId] !== undefined ? editingNames[teamId] : t.name,
          leader: editingLeaders[teamId] !== undefined ? editingLeaders[teamId] : t.leader,
          score: editingScores[teamId] !== undefined ? editingScores[teamId] : t.score,
        };
      }
      return t;
    }));
    setEditingPasswords(prev => { const n = {...prev}; delete n[teamId]; return n; });
    setEditingNames(prev => { const n = {...prev}; delete n[teamId]; return n; });
    setEditingLeaders(prev => { const n = {...prev}; delete n[teamId]; return n; });
    setEditingScores(prev => { const n = {...prev}; delete n[teamId]; return n; });
    alert('隊伍資訊已成功更新');
  };

  const fetchMission = async () => {
    setIsLoadingMission(true);
    try {
      const mission = await generateSalesMission();
      setDailyMission(mission);
      setEditTitle(mission.title);
      setEditContent(mission.content);
      setEditObjective(mission.objective || '');
      setEditRules(mission.rules || '');
      setEditGemType(mission.gemType);
    } catch (error) { console.error(error); } finally { setIsLoadingMission(false); }
  };

  const startEditingMission = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(dailyMission?.title || '');
    setEditContent(dailyMission?.content || '');
    setEditObjective(dailyMission?.objective || '');
    setEditRules(dailyMission?.rules || '');
    setEditGemType(dailyMission?.gemType || 'Sapphire');
    setIsEditingMission(true);
  };

  const saveMission = () => {
    setDailyMission({ title: editTitle, content: editContent, objective: editObjective, rules: editRules, gemType: editGemType });
    setIsEditingMission(false);
  };

  const displayTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      let comparison = 0;
      if (sortConfig.key === 'score' || sortConfig.key === 'id') {
        comparison = (a[sortConfig.key] || 0) - (b[sortConfig.key] || 0);
      } else {
        comparison = (a[sortConfig.key] || '').localeCompare(b[sortConfig.key] || '');
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [teams, sortConfig]);

  const globalFeed = useMemo(() => {
    const all = Object.values(teamLogs).flat();
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, GLOBAL_FEED_SIZE);
  }, [teamLogs]);

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <span className="opacity-20 ml-1">⇅</span>;
    return <span className="lv-gold ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-luxury relative overflow-hidden p-6">
        <LV_MONOGRAM_PATTERN />
        <div className="bg-[#2c1e12]/90 border border-lv-gold/30 p-10 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] w-full max-w-md text-center backdrop-blur-xl relative z-10 border-t-2 border-t-lv-gold animate-scaleIn">
          <div className="relative mb-12 flex flex-col items-center">
            <LV_TEXT_LOGO_SVG className="w-full h-12 lv-gold" />
          </div>
          
          <h1 className="text-3xl font-serif lv-gold mb-1 tracking-[0.2em] uppercase italic">Fine Jewelry</h1>
          <p className="text-gray-500 mb-12 tracking-[0.4em] uppercase text-[9px] font-black opacity-60">路易威登台北SOGO 復興店</p>
          
          {!showPasswordInput ? (
            <div className="space-y-4">
              <button onClick={() => initiateLogin(Role.MANAGER, undefined, 'Store Manager')} className="w-full py-5 bg-gradient-to-b from-[#E5C36E] to-[#D4AF37] text-[#1a110a] font-black rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-[10px]">經理登入</button>
              <div className="grid grid-cols-2 gap-3">
                {teams.map(team => (
                  <button key={team.id} onClick={() => initiateLogin(Role.LEADER, team.id, team.leader)} className="py-4 bg-black/40 border border-lv-gold/20 lv-gold rounded-xl hover:bg-lv-brown/40 hover:border-lv-gold transition-all text-[10px] font-black uppercase tracking-tighter">隊長: {team.leader}</button>
                ))}
              </div>
              <button onClick={() => initiateLogin(Role.MEMBER, teams[0]?.id || 1, 'Guest')} className="w-full py-4 text-gray-500 border border-gray-800 rounded-xl hover:border-gray-500 transition text-[9px] uppercase tracking-[0.3em] mt-6 font-black opacity-70">隊員瀏覽模式</button>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <h3 className="text-[10px] text-lv-gold mb-8 font-black uppercase tracking-[0.4em]">{showPasswordInput.role === Role.MANAGER ? '管理員驗證' : `隊長驗證: ${showPasswordInput.name}`}</h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="relative">
                  <input type={showLoginPassword ? "text" : "password"} autoFocus value={passwordEntry} onChange={e => setPasswordEntry(e.target.value)} placeholder="請輸入密碼" className="w-full bg-black/60 border border-lv-gold/30 p-5 pr-14 rounded-2xl text-center text-white focus:border-lv-gold outline-none transition-all placeholder:text-gray-800" />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-lv-gold transition">{showLoginPassword ? EYE_OFF_ICON : EYE_ICON}</button>
                </div>
                {loginError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{loginError}</p>}
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowPasswordInput(null)} className="flex-1 py-4 text-gray-600 border border-gray-800 rounded-2xl hover:bg-gray-900 transition text-[10px] font-black uppercase tracking-widest">取消</button>
                  <button type="submit" className="flex-1 py-4 bg-lv-gold text-[#1a110a] font-black rounded-2xl hover:brightness-110 transition shadow-lg text-[10px] uppercase tracking-widest">驗證登入</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a110a] text-white pb-24 md:pb-12 relative font-sans">
      <LV_MONOGRAM_PATTERN />
      <header className="sticky top-0 z-50 bg-[#2c1e12]/95 backdrop-blur-2xl border-b border-lv-gold/20 px-8 py-5 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-6">
           <button onClick={() => setUser(null)} className="p-3 border border-lv-gold/20 rounded-2xl hover:bg-lv-brown transition text-lv-gold shadow-xl">
             <LV_LOGO_SVG className="w-6 h-6" />
           </button>
           <div className="hidden lg:block">
             <LV_TEXT_LOGO_SVG className="w-40 h-8 lv-gold" />
           </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => handleSort('score')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-[9px] font-black transition-all uppercase tracking-[0.2em] ${sortConfig.key === 'score' ? 'bg-lv-gold text-black border-lv-gold' : 'border-gray-800 text-gray-400 hover:border-lv-gold'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            {sortConfig.key === 'score' ? (sortConfig.direction === 'desc' ? '高資產優先' : '低資產優先') : '競爭排名'}
          </button>
          <button onClick={() => setUser(null)} className="text-[9px] font-black border border-red-900/30 px-5 py-2.5 rounded-full hover:bg-red-950 transition text-red-500/80 uppercase tracking-widest">登出系統</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 relative z-10">
        <section onClick={() => dailyMission && !isEditingMission && setShowMissionDetail(true)} className={`bg-[#2c1e12]/80 border border-lv-gold/40 p-12 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 shadow-[0_30px_70px_rgba(0,0,0,0.6)] group cursor-pointer hover:shadow-lv-gold/10 hover:translate-y-[-5px] ${isLoadingMission ? 'animate-pulse' : ''} border-l-[12px] border-l-lv-gold backdrop-blur-md`}>
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-3xl font-serif lv-gold uppercase tracking-[0.1em] mb-1 italic">每日挑戰指引</h3>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em] mt-2">卓越門市銷售績效指標</p>
            </div>
            <div className="flex gap-4">
              {user.role === Role.MANAGER && (
                <>
                  <button onClick={startEditingMission} className="text-[10px] font-black border border-lv-gold/20 px-6 py-2.5 rounded-full hover:bg-lv-brown transition z-10 uppercase tracking-widest text-lv-gold bg-black/30">修改任務</button>
                  <button onClick={(e) => { e.stopPropagation(); fetchMission(); }} disabled={isLoadingMission} className="text-[10px] font-black bg-lv-gold/10 border border-lv-gold/40 px-6 py-2.5 rounded-full hover:bg-lv-gold hover:text-black transition z-10 uppercase tracking-widest">{isLoadingMission ? '生成中...' : '生成新任務'}</button>
                </>
              )}
            </div>
          </div>
          {isEditingMission ? (
            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/60 border border-lv-gold/20 p-5 rounded-2xl text-white font-serif italic text-xl outline-none focus:border-lv-gold transition-all" placeholder="輸入任務標題" />
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-black/60 border border-lv-gold/20 p-5 rounded-2xl text-white min-h-[120px] outline-none focus:border-lv-gold" placeholder="定義挑戰參數與細節..." />
              <div className="flex gap-4 pt-4">
                <button onClick={saveMission} className="bg-lv-gold text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl">套用挑戰</button>
                <button onClick={() => setIsEditingMission(false)} className="text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white px-6">捨棄變更</button>
              </div>
            </div>
          ) : dailyMission ? (
            <div className="animate-fadeIn">
              <p className="font-bold text-3xl text-white mb-4 group-hover:text-lv-gold transition font-serif italic leading-tight">{dailyMission.title}</p>
              <p className="text-gray-400 text-lg line-clamp-2 leading-relaxed max-w-4xl opacity-80 group-hover:opacity-100 transition-opacity">{dailyMission.content}</p>
              <div className="flex items-center gap-5 mt-10">
                <div className="flex items-center gap-3 bg-lv-gold/10 text-lv-gold px-6 py-3 rounded-full border border-lv-gold/30 shadow-inner">
                  <span className="text-2xl">{GEMS.find(g => g.name === dailyMission.gemType)?.icon || '💎'}</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">{dailyMission.gemType} 等級挑戰</span>
                </div>
                <span className="text-base lv-gold font-serif font-bold tracking-[0.2em]">+ {GEMS.find(g => g.name === dailyMission.gemType)?.value} JOYAUX 資產</span>
              </div>
            </div>
          ) : <p className="text-gray-700 italic text-lg font-serif">經理正在為今日策劃專屬的精緻銷售挑戰...</p>}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {displayTeams.map(team => (
            <div key={team.id} className={`bg-[#2c1e12]/70 border-2 ${animatingTeamId === team.id ? 'border-lv-gold shadow-[0_0_60px_rgba(212,175,55,0.4)] scale-[1.05]' : 'border-white/5'} rounded-[2.5rem] p-8 transition-all duration-700 relative shadow-2xl overflow-hidden group backdrop-blur-xl`}>
              <div className="absolute top-0 right-0 p-6 opacity-[0.04] group-hover:opacity-[0.12] transition-opacity duration-1000 pointer-events-none">
                <LV_LOGO_SVG className="w-20 h-20" />
              </div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-700 font-black uppercase tracking-[0.4em]">經典部門單元 {team.id}</span>
                  <h4 className="text-2xl font-serif truncate mt-2 group-hover:text-lv-gold transition-all duration-500 italic">{team.name}</h4>
                </div>
                <button 
                  onClick={() => setShowHistoryTeamId(team.id)} 
                  className="p-4 text-lv-gold hover:text-white transition-all bg-black/50 rounded-2xl border border-lv-gold/10 hover:border-lv-gold active:scale-90 shadow-2xl"
                  title="查看歷史日誌"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              
              <TrunkVisual 
                score={team.score} 
                triggerAnimation={animatingTeamId === team.id} 
                gemIcon={lastGem} 
                addedValue={animatingTeamId === team.id ? lastAddedValue : 0}
              />
              
              <div className="mt-6 text-center pb-8 border-b border-white/5">
                 <span className="text-[11px] text-gray-500 font-black tracking-[0.3em] uppercase bg-black/30 px-5 py-2 rounded-full border border-white/5">隊長: {team.leader}</span>
              </div>
              
              {(user.role === Role.MANAGER || (user.role === Role.LEADER && user.teamId === team.id)) && (
                <div className="mt-6 space-y-6 pt-10 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    {GEMS.map(gem => (
                      <button key={gem.name} onClick={() => addScore(team.id, gem)} className="group text-[10px] py-4 bg-black/60 border border-white/5 hover:border-lv-gold/50 rounded-2xl flex flex-col items-center transition-all active:scale-95 hover:bg-black shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <span className="text-3xl group-hover:scale-125 transition-transform duration-700 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] mb-3">{gem.icon}</span>
                        <span className="text-gray-600 group-hover:text-lv-gold font-black uppercase tracking-widest">{gem.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  {user.role === Role.MANAGER && (
                    <div className="space-y-6 pt-6">
                      <div className="bg-black/90 p-6 rounded-3xl border border-lv-gold/10 space-y-6 shadow-2xl relative overflow-hidden group/controls">
                        <div className="flex items-center justify-between relative z-10">
                          <p className="text-[10px] text-lv-gold uppercase font-black tracking-[0.4em]">資產校正</p>
                          {scoreHistory[team.id]?.length > 0 && (
                            <button onClick={() => handleUndo(team.id)} className="text-[10px] text-gray-700 hover:text-lv-gold flex items-center gap-2 transition-all group/undo uppercase font-black">
                              <span className="group-hover/undo:-translate-x-2 transition-transform">↩</span> 撤銷輸入
                            </button>
                          )}
                        </div>

                        <div className="space-y-4 relative z-10">
                          <div className="flex gap-3">
                            <input 
                              type="number" 
                              value={directSetValue[team.id] ?? ''} 
                              onChange={(e) => setDirectSetValue(prev => ({ ...prev, [team.id]: e.target.value }))}
                              placeholder="重設總分"
                              className="flex-1 bg-black border border-white/10 p-3.5 rounded-2xl text-[11px] text-center focus:border-lv-gold outline-none transition-all placeholder:text-gray-800"
                            />
                            <button 
                              onClick={() => handleDirectSetRequest(team.id)}
                              className="px-6 bg-lv-gold text-black rounded-2xl hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl"
                            >
                              設定
                            </button>
                          </div>
                          
                          <div className="flex gap-3">
                            <input 
                              type="number" 
                              value={manualAdjustValue[team.id] || ''} 
                              onChange={(e) => setManualAdjustValue(prev => ({ ...prev, [team.id]: e.target.value }))}
                              placeholder="增減數值"
                              className="flex-1 bg-black border border-white/10 p-3.5 rounded-2xl text-[11px] text-center focus:border-lv-gold outline-none transition-all placeholder:text-gray-800"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleManualAdjustRequest(team.id, true)} className="w-12 bg-lv-gold/10 border border-lv-gold/30 text-lv-gold rounded-2xl font-black hover:bg-lv-gold hover:text-black transition-all shadow-xl">+</button>
                              <button onClick={() => handleManualAdjustRequest(team.id, false)} className="w-12 bg-red-950/20 border border-red-900/40 text-red-500 rounded-2xl font-black hover:bg-red-900 hover:text-white transition-all shadow-xl">-</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {user.role === Role.MANAGER && (
          <section className="mt-20 space-y-20 animate-fadeIn pb-32">
             <div className="bg-[#2c1e12]/80 border border-lv-gold/20 rounded-[3rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none select-none">
                  <LV_LOGO_SVG className="w-[30rem] h-[30rem]" />
                </div>
                <div className="flex items-center justify-between mb-12 relative z-10 border-b border-white/5 pb-10">
                  <div>
                    <h3 className="text-4xl font-serif lv-gold uppercase tracking-[0.15em] italic">奧德賽 動態日誌</h3>
                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-[0.5em] mt-3">全店競賽即時洞察</p>
                  </div>
                  <div className="bg-lv-gold/10 px-8 py-3.5 rounded-full border border-lv-gold/30 flex items-center gap-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.8)]"></span>
                    <span className="text-[11px] text-lv-gold font-black uppercase tracking-[0.4em]">即時串流中</span>
                  </div>
                </div>

                <div className="space-y-5 relative z-10">
                  {globalFeed.length > 0 ? globalFeed.map((log, i) => {
                    const team = teams.find(t => t.id === log.teamId);
                    const diff = log.after - log.before;
                    return (
                      <div key={i} className="flex items-center justify-between bg-black/40 border border-white/5 p-7 rounded-3xl hover:bg-black/70 hover:border-lv-gold/40 transition-all duration-500 group shadow-xl">
                        <div className="flex items-center gap-7">
                          <div className="w-4 h-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] border-2 border-white/10" style={{ backgroundColor: team?.color || '#D4AF37' }}></div>
                          <div>
                            <p className="text-[10px] text-gray-700 uppercase font-black tracking-[0.2em]">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</p>
                            <p className="text-xl font-serif text-white group-hover:text-lv-gold transition-colors italic leading-none mt-1">{team?.name}</p>
                          </div>
                        </div>
                        <div className="flex-1 px-20">
                          <p className="text-sm text-gray-500 font-medium truncate italic opacity-70 group-hover:opacity-100 transition-opacity tracking-wide">{log.type}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-black font-mono tracking-tighter ${diff >= 0 ? 'text-green-400' : 'text-red-400'} drop-shadow-xl`}>
                            {diff > 0 ? '+' : ''}{diff.toLocaleString()} <span className="text-[11px] uppercase ml-2 opacity-50">JY</span>
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-32 text-center text-gray-800 italic text-2xl font-serif opacity-40">正在等待首場精彩挑戰的足跡...</div>
                  )}
                </div>
             </div>

             <div className="p-12 bg-[#2c1e12]/60 border border-lv-gold/20 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.7)] backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-16 relative z-10">
                  <div>
                    <h3 className="text-4xl font-serif lv-gold uppercase tracking-[0.15em] italic">經典登記冊</h3>
                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-[0.5em] mt-3">團隊資產分配管理</p>
                  </div>
                  <button onClick={() => setShowResetConfirm(true)} className="px-10 py-4 border-2 border-red-900/40 text-red-500/90 hover:bg-red-950/70 hover:border-red-500 rounded-2xl text-[11px] font-black transition-all uppercase tracking-[0.4em] shadow-2xl">清空所有餘額</button>
                </div>
                <div className="overflow-x-auto relative z-10">
                  <table className="w-full text-left text-sm min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-700 uppercase text-[11px] font-black tracking-[0.4em]">
                        <th className="pb-10 cursor-pointer hover:text-lv-gold transition-colors" onClick={() => handleSort('name')}>部門識別 <SortIndicator column="name" /></th>
                        <th className="pb-10 cursor-pointer hover:text-lv-gold transition-colors" onClick={() => handleSort('leader')}>負責隊長 <SortIndicator column="leader" /></th>
                        <th className="pb-10 cursor-pointer hover:text-lv-gold transition-colors" onClick={() => handleSort('score')}>淨 JOYAUX 資產 <SortIndicator column="score" /></th>
                        <th className="pb-10">登入憑證</th>
                        <th className="pb-10 text-right">日誌審核</th>
                        <th className="pb-10 text-right">維護操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {displayTeams.map(team => (
                        <tr key={team.id} className="hover:bg-white/5 transition-all duration-300 group">
                          <td className="py-8"><input type="text" value={editingNames[team.id] ?? team.name} onChange={e => handleManagementChange(team.id, 'name', e.target.value)} className="bg-transparent border-none text-white font-serif italic text-2xl outline-none focus:bg-black/50 rounded-2xl px-5 py-3 w-full transition-all duration-300" /></td>
                          <td className="py-8"><input type="text" value={editingLeaders[team.id] ?? team.leader} onChange={e => handleManagementChange(team.id, 'leader', e.target.value)} className="bg-transparent border-none text-gray-500 font-black outline-none focus:bg-black/50 rounded-2xl px-5 py-3 w-full transition-all duration-300" /></td>
                          <td className="py-8"><input type="number" value={editingScores[team.id] !== undefined ? editingScores[team.id] : team.score} onChange={e => handleManagementChange(team.id, 'score', e.target.value)} className="bg-transparent border-none text-lv-gold font-black font-mono text-3xl outline-none w-48 focus:bg-black/50 rounded-2xl px-5 py-3 transition-all duration-300" /></td>
                          <td className="py-8"><input type="text" value={editingPasswords[team.id] ?? team.password} onChange={e => handleManagementChange(team.id, 'password', e.target.value)} className="bg-transparent border-none font-mono text-gray-700 outline-none focus:bg-black/50 rounded-2xl px-5 py-3 w-32 transition-all duration-300" /></td>
                          <td className="py-8 text-right">
                            <button 
                              onClick={() => setShowHistoryTeamId(team.id)} 
                              className="text-lv-gold hover:text-white transition-all p-5 bg-lv-gold/5 border border-lv-gold/20 rounded-2xl hover:bg-lv-gold/20 shadow-xl"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </td>
                          <td className="py-8 text-right space-x-4">
                            {(editingPasswords[team.id] !== undefined || editingNames[team.id] !== undefined || editingLeaders[team.id] !== undefined || editingScores[team.id] !== undefined) && (
                               <button onClick={() => saveTeamManagementChanges(team.id)} className="text-[11px] bg-lv-gold text-black px-8 py-3 rounded-2xl font-black uppercase hover:brightness-110 shadow-2xl tracking-[0.2em] transition-all">更新登記名冊</button>
                            )}
                            <button className="text-[11px] text-red-900/30 hover:text-red-500 transition-all uppercase font-black tracking-widest p-4">移除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </section>
        )}
      </main>

      {/* History Modal */}
      {showHistoryTeamId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#1a110a]/99 backdrop-blur-3xl animate-fadeIn" onClick={() => setShowHistoryTeamId(null)}>
          <div className="bg-[#2c1e12] border-2 border-lv-gold/40 p-16 rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,1)] w-full max-w-4xl relative overflow-y-auto max-h-[90vh] scale-in border-t-[12px] border-t-lv-gold" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowHistoryTeamId(null)} className="absolute top-10 right-10 text-gray-700 hover:text-lv-gold transition-all bg-black/50 p-4 rounded-full shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center mb-16">
              <div className="mb-8 relative inline-block">
                <LV_LOGO_SVG className="w-20 h-20 mx-auto lv-gold opacity-50 drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
                <div className="absolute inset-0 bg-lv-gold/20 blur-3xl rounded-full scale-200 -z-10 animate-pulse" />
              </div>
              <h3 className="text-5xl font-serif text-white uppercase tracking-[0.25em] italic mb-4">登記日誌</h3>
              <p className="lv-gold text-[12px] tracking-[0.6em] uppercase font-black opacity-90">{teams.find(t => t.id === showHistoryTeamId)?.name}</p>
            </div>
            <div className="space-y-8">
              {(teamLogs[showHistoryTeamId] || []).length > 0 ? (
                (teamLogs[showHistoryTeamId] || []).map((log, i) => {
                  const diff = log.after - log.before;
                  const isPositive = diff > 0;
                  return (
                    <div key={i} className="bg-black/60 border border-white/5 p-10 rounded-[2.5rem] flex items-center justify-between group hover:border-lv-gold/40 transition-all duration-500 shadow-2xl relative overflow-hidden">
                      <div className="flex-1 relative z-10">
                        <div className="flex items-center gap-6 mb-5">
                          <p className="text-[11px] text-gray-700 uppercase font-black tracking-[0.3em]">{new Date(log.timestamp).toLocaleString('zh-TW', { hour12: false, minute:'2-digit', second: '2-digit' })}</p>
                          {diff !== 0 && (
                            <span className={`text-[11px] font-black px-6 py-2 rounded-full border shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] ${isPositive ? 'bg-green-900/15 text-green-400 border-green-500/30' : 'bg-red-900/15 text-red-400 border-red-500/30'}`}>
                              {isPositive ? '+' : ''}{diff.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-serif text-gray-200 tracking-wider italic leading-relaxed">{log.type}</p>
                      </div>
                      <div className="text-right flex items-center gap-12 border-l border-white/10 pl-14 ml-14 relative z-10">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-700 uppercase font-black mb-3 tracking-[0.3em]">起始數值</p>
                          <p className="text-lg text-gray-600 font-mono tracking-tighter">{log.before.toLocaleString()}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-lv-gold/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <div className="text-center">
                          <p className="text-[10px] lv-gold uppercase font-black mb-3 tracking-[0.3em]">結算數值</p>
                          <p className="text-4xl lv-gold font-black font-mono drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]">{log.after.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }} />
                    </div>
                  );
                })
              ) : (
                <div className="py-40 text-center border-[6px] border-dashed border-white/5 rounded-[4rem]">
                  <p className="text-gray-800 italic font-serif text-2xl opacity-40 tracking-widest">此尊榮日誌中目前尚無任何紀錄。</p>
                </div>
              )}
            </div>
            <button onClick={() => setShowHistoryTeamId(null)} className="w-full mt-16 py-6 bg-lv-gold text-black font-black rounded-3xl hover:brightness-110 transition-all shadow-[0_30px_60px_rgba(212,175,55,0.4)] uppercase tracking-[0.5em] text-[12px]">關閉登記簿</button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingScoreAction && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-[#1a110a]/99 backdrop-blur-3xl animate-fadeIn">
          <div className="bg-[#2c1e12] border-2 border-lv-gold/60 p-14 rounded-[3rem] shadow-[0_0_200px_rgba(0,0,0,1)] w-full max-w-lg text-center scale-in border-t-[14px] border-t-lv-gold">
            <h3 className="text-4xl font-serif lv-gold mb-3 uppercase tracking-[0.25em] italic">身份驗證</h3>
            <p className="text-gray-600 text-[11px] mb-12 tracking-[0.6em] uppercase font-black">安全資產修訂程序</p>
            
            <div className="bg-black/70 border border-white/5 p-12 rounded-[2.5rem] mb-14 space-y-10 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]">
              <div className="flex justify-between items-center text-left">
                <span className="text-gray-700 text-[11px] uppercase font-black tracking-[0.3em]">受影響單元</span>
                <span className="text-white font-serif italic text-2xl tracking-wide">{teams.find(t => t.id === pendingScoreAction.teamId)?.name}</span>
              </div>
              <div className="flex justify-between items-center text-left">
                <span className="text-gray-700 text-[11px] uppercase font-black tracking-[0.3em]">操作類型</span>
                <span className="lv-gold text-[11px] font-black uppercase tracking-[0.5em]">{pendingScoreAction.type === 'adjust' ? '數值修訂' : '資產重設'}</span>
              </div>
              <div className="flex justify-around items-center pt-10 border-t border-white/15">
                <div className="text-center">
                  <p className="text-[11px] text-gray-700 uppercase mb-4 font-black tracking-[0.4em]">目前資產</p>
                  <p className="text-2xl text-gray-500 font-mono tracking-tighter">{(teams.find(t => t.id === pendingScoreAction.teamId)?.score || 0).toLocaleString()}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-lv-gold/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="text-center">
                  <p className="text-[11px] lv-gold uppercase mb-4 font-black tracking-[0.4em]">修訂後資產</p>
                  <p className="text-4xl lv-gold font-black font-mono drop-shadow-[0_0_25px_rgba(212,175,55,0.7)]">
                    {pendingScoreAction.type === 'adjust' 
                      ? Math.max(0, (teams.find(t => t.id === pendingScoreAction.teamId)?.score || 0) + (pendingScoreAction.isAdding ? pendingScoreAction.value : -pendingScoreAction.value)).toLocaleString()
                      : pendingScoreAction.value.toLocaleString()
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-8">
              <button onClick={() => setPendingScoreAction(null)} className="flex-1 py-6 border border-gray-800 text-gray-700 rounded-3xl hover:bg-gray-900 transition-all font-black uppercase text-[11px] tracking-[0.4em]">中止</button>
              <button onClick={executePendingScoreAction} className="flex-1 py-6 bg-lv-gold text-black rounded-3xl hover:brightness-110 transition-all font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_20px_50px_rgba(212,175,55,0.4)]">授權變更</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fadeIn">
          <div className="bg-[#2c1e12] border-4 border-red-900/40 p-14 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] w-full max-w-lg text-center transform scale-in">
            <h3 className="text-4xl font-serif text-red-500 mb-6 uppercase tracking-[0.2em] italic">重大重設警告</h3>
            <p className="text-gray-400 text-sm mb-12 leading-loose opacity-80 tracking-widest font-medium">此操作將立即清除所有部門累積的 JOYAUX 資產，並將排行榜重置為零。此傳奇性的修改將無法復原。</p>
            <div className="flex flex-col gap-5">
              <button onClick={resetAllScores} className="w-full py-6 bg-red-800 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-2xl uppercase text-[11px] tracking-[0.4em]">執行全面清除</button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full py-6 border border-gray-800 text-gray-700 rounded-2xl hover:bg-gray-900 transition-all font-bold uppercase text-[11px] tracking-[0.4em]">中止操作</button>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-[#2c1e12]/99 backdrop-blur-3xl border-t border-lv-gold/30 md:hidden z-50 shadow-[0_-20px_60px_rgba(0,0,0,1)] px-4">
        <div className="flex items-center overflow-x-auto no-scrollbar py-6 px-8 gap-12 scroll-smooth">
          {displayTeams.map((t, index) => (
            <div key={t.id} className="flex-shrink-0 min-w-[160px] border-l-4 pl-6 flex flex-col justify-center animate-fadeIn" style={{ borderLeftColor: t.color || '#D4AF37' }}>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">排名 {index + 1}</span>
                <span className="text-[11px] text-lv-gold font-serif truncate max-w-[100px] font-bold uppercase tracking-[0.2em] italic">{t.name}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl lv-gold font-serif font-black italic tracking-tighter">{t.score.toLocaleString()}</span>
                <span className="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em]">JY</span>
              </div>
            </div>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        
        input:focus {
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
          border-color: #D4AF37 !important;
        }

        .gradient-luxury {
          background: radial-gradient(circle at center, #3d2a1a 0%, #1a110a 100%);
        }
      `}</style>
    </div>
  );
};

export default App;
