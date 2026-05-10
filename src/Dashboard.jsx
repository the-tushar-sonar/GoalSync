// src/Dashboard.jsx
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { ActivityCalendar } from 'react-activity-calendar';
import confetti from 'canvas-confetti';
import toast, { Toaster } from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const getTodayString = () => new Date().toLocaleDateString('en-CA');

const calculateStreak = (completions = []) => {
  if (completions.length === 0) return 0;
  const sortedDates = [...new Set(completions)].sort((a, b) => new Date(b) - new Date(a));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let streak = 0;
  let currentDate = new Date(sortedDates[0]); currentDate.setHours(0,0,0,0);
  const diffDays = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const d = new Date(sortedDates[i]); d.setHours(0, 0, 0, 0);
    const expectedDate = new Date(currentDate); expectedDate.setDate(currentDate.getDate() - i);
    if (d.getTime() === expectedDate.getTime()) streak++; else break;
  }
  return streak;
};

const getLast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString('en-CA'));
  }
  return dates;
};

const calculateSuccessRate = (habit) => {
  if (!habit.createdAt) return 0;
  const createdDate = habit.createdAt.toDate ? habit.createdAt.toDate() : new Date();
  const today = new Date();
  const daysSinceCreation = Math.max(1, Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24)));
  const completions = habit.completions?.length || 0;
  return Math.min(100, Math.round((completions / daysSinceCreation) * 100));
};

const getDaysSinceLastAction = (completions = []) => {
  if (completions.length === 0) return Infinity;
  const sortedDates = [...new Set(completions)].sort((a, b) => new Date(b) - new Date(a));
  const lastDate = new Date(sortedDates[0]);
  const today = new Date();
  return Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
};

function Dashboard({ user }) {
  const [habits, setHabits] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode] = useState('action'); 
  
  // Social States
  const [leaderboard, setLeaderboard] = useState([]);
  const [feed, setFeed] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  const todayStr = getTodayString();
  const completedToday = habits.filter(h => h.completions?.includes(todayStr)).length;
  const completionRate = habits.length === 0 ? 0 : Math.round((completedToday / habits.length) * 100);
  const totalCompletions = habits.reduce((acc, curr) => acc + (curr.completions?.length || 0), 0);
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => calculateStreak(h.completions))) : 0;

  const XP_PER_ACTION = 50; const XP_PER_LEVEL = 500;
  const totalXP = (totalCompletions * XP_PER_ACTION) + (maxStreak * 25);
  const currentLevel = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const levelProgress = ((totalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'habits'), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Sync Profile for Leaderboard
  useEffect(() => {
    if (!user || totalXP === 0) return;
    const syncProfile = async () => {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, displayName: user.displayName || user.email.split('@')[0], photoURL: user.photoURL || '',
        totalXP, level: currentLevel, lastActive: serverTimestamp()
      }, { merge: true });
    };
    syncProfile();
  }, [totalXP, currentLevel, user]);

  // Fetch Social Data
  useEffect(() => {
    if (viewMode !== 'social') return;
    const qLeaderboard = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(10));
    const unsubLeaderboard = onSnapshot(qLeaderboard, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const myProfile = snapshot.docs.find(d => d.id === user.uid)?.data();
      if (myProfile) setCurrentUserProfile(myProfile);
    });
    const qFeed = query(collection(db, 'feed'), orderBy('timestamp', 'desc'), limit(20));
    const unsubFeed = onSnapshot(qFeed, (snapshot) => {
      setFeed(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubLeaderboard(); unsubFeed(); };
  }, [viewMode, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim() === '') return;
    try {
      await addDoc(collection(db, 'habits'), { name, category: category || 'Core', uid: user.uid, createdAt: serverTimestamp(), completions: [] });
      setName(''); setCategory(''); setIsFormOpen(false);
      toast('New protocol initialized.', { icon: '🛰️' });
    } catch (error) { console.error(error); }
  };

  const toggleCompletion = async (habitId, currentCompletions = [], habitName) => {
    const isCompleted = currentCompletions.includes(todayStr);
    const updatedCompletions = isCompleted ? currentCompletions.filter(date => date !== todayStr) : [...currentCompletions, todayStr];
    await updateDoc(doc(db, 'habits', habitId), { completions: updatedCompletions });

    if (!isCompleted) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00ff66', '#00c3ff', '#bc13fe'] });
      toast.success(`+50 XP | ${habitName} Complete!`, { style: { background: 'rgba(20, 20, 22, 0.9)', color: '#fff', border: '1px solid #00ff66' }, iconTheme: { primary: '#00ff66', secondary: '#000' } });
      try {
        await addDoc(collection(db, 'feed'), { uid: user.uid, displayName: user.displayName || user.email.split('@')[0], photoURL: user.photoURL || '', action: `completed protocol: ${habitName}`, xpEarned: 50, timestamp: serverTimestamp() });
      } catch (e) { console.error("Feed error:", e) }
    }
  };

  const handleDelete = async (id) => { if (window.confirm("Erase this habit?")) await deleteDoc(doc(db, 'habits', id)); };

  const handleFollow = async (targetUid) => {
    if (targetUid === user.uid) return;
    const currentFollowing = currentUserProfile?.following || [];
    const isFollowing = currentFollowing.includes(targetUid);
    const newFollowing = isFollowing ? currentFollowing.filter(id => id !== targetUid) : [...currentFollowing, targetUid];
    await updateDoc(doc(db, 'users', user.uid), { following: newFollowing });
    toast(isFollowing ? 'Connection severed.' : 'Connection established.', { icon: '📡' });
  };

  // Analytics Data Prep
  const last7Days = getLast7Days();
  const trendData = last7Days.map(date => ({ name: date.substring(5), completions: habits.filter(h => h.completions?.includes(date)).length }));
  const successRateData = habits.map(h => ({ name: h.name.length > 10 ? h.name.substring(0, 10) + '...' : h.name, rate: calculateSuccessRate(h) }));
  const missedHabits = habits.map(h => ({ ...h, daysMissed: getDaysSinceLastAction(h.completions) })).filter(h => h.daysMissed > 2 && h.daysMissed !== Infinity).sort((a, b) => b.daysMissed - a.daysMissed);
  
  const categoryDataMap = {};
  habits.forEach(h => { const cat = h.category && h.category.trim() !== '' ? h.category : 'Core'; categoryDataMap[cat] = (categoryDataMap[cat] || 0) + (h.completions?.length || 0); });
  const radarData = Object.keys(categoryDataMap).map(key => ({ subject: key, A: categoryDataMap[key] }));

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  habits.forEach(h => { (h.completions || []).forEach(dateStr => { const d = new Date(dateStr + 'T12:00:00'); dowCounts[d.getDay()] += 1; }); });
  const dowData = daysOfWeek.map((day, index) => ({ name: day, actions: dowCounts[index] }));

  const getHeatmapData = () => {
    const dateCounts = {};
    habits.forEach(habit => (habit.completions || []).forEach(date => { dateCounts[date] = (dateCounts[date] || 0) + 1; }));
    const data = [];
    let start = new Date(); start.setMonth(start.getMonth() - 5);
    for (let d = start; d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('en-CA');
      const count = dateCounts[dateStr] || 0;
      data.push({ date: dateStr, count, level: count === 0 ? 0 : count > 3 ? 4 : count });
    }
    return data;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) return ( <div className="chart-tooltip"><p className="label">{`${label}`}</p><p className="intro">{`${payload[0].value} Actions`}</p></div> );
    return null;
  };

  return (
    <div className="dashboard">
      <Toaster position="bottom-center" />

      <div className="view-toggle">
        <motion.button whileTap={{ scale: 0.95 }} className={viewMode === 'action' ? 'active' : ''} onClick={() => setViewMode('action')}>Action Center</motion.button>
        <motion.button whileTap={{ scale: 0.95 }} className={viewMode === 'analytics' ? 'active' : ''} onClick={() => setViewMode('analytics')}>Deep Analytics</motion.button>
        <motion.button whileTap={{ scale: 0.95 }} className={viewMode === 'social' ? 'active' : ''} onClick={() => setViewMode('social')}>The Nexus</motion.button>
      </div>

      {viewMode === 'action' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="level-container">
            <div className="level-header"><div className="level-badge">LVL {currentLevel}</div></div>
            <div className="xp-bar-bg"><motion.div className="xp-bar-fill" initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 1, ease: "easeOut" }} /></div>
          </div>

          <div className="metrics-grid mt-2">
            <motion.div className="metric-card" whileHover={{ scale: 1.02 }}>
              <h4>Daily Sequence</h4>
              <div className="metric-value">{completionRate}%</div>
              <div className="progress-bar-bg"><motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ type: "spring", bounce: 0.4 }} /></div>
              <p className="metric-sub">{completedToday} / {habits.length} Completed</p>
            </motion.div>

            <motion.div className="metric-card" whileHover={{ scale: 1.02 }}>
              <h4>Longest Streak</h4>
              <motion.div className="metric-value" style={{ color: '#ff9900' }} key={maxStreak} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{maxStreak}</motion.div>
              <p className="metric-sub">Consecutive Days</p>
            </motion.div>
          </div>

          <div className="heatmap-container mt-2">
            <h4>Activity Signal</h4>
            <ActivityCalendar data={getHeatmapData()} colorScheme="dark" theme={{ light: ['#1a1a1c', '#004d1f', '#008033', '#00b347', '#00ff66'], dark: ['#1a1a1c', '#004d1f', '#008033', '#00b347', '#00ff66'] }} />
          </div>

          <div className="dashboard-header mt-2">
            <h2>Active Protocols</h2>
            <motion.button whileTap={{ scale: 0.9 }} className="btn-outline" onClick={() => setIsFormOpen(!isFormOpen)}>{isFormOpen ? 'Close Terminal' : '+ Add Habit'}</motion.button>
          </div>

          <AnimatePresence>
            {isFormOpen && (
              <motion.form className="glass-form" onSubmit={handleSubmit} initial={{ opacity: 0, height: 0, overflow: 'hidden' }} animate={{ opacity: 1, height: 'auto', overflow: 'visible' }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}>
                <div className="form-grid">
                  <input type="text" required placeholder="Habit Designation (Name)" value={name} onChange={(e) => setName(e.target.value)} />
                  <input type="text" placeholder="Category (e.g. Health, Work)" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" className="btn-primary mt-2">Deploy</motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <motion.div className="habit-grid" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show">
            <AnimatePresence>
              {habits.map(habit => {
                const isDoneToday = (habit.completions || []).includes(todayStr);
                return (
                  <motion.div key={habit.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} layout exit={{ opacity: 0, scale: 0.8 }} className={`habit-card ${isDoneToday ? 'completed' : ''}`} whileHover={{ scale: 1.02 }}>
                    <div className="habit-card-main">
                      <div className="habit-info">
                        <h3>{habit.name}</h3>
                        <div className="habit-badges">
                           {habit.category && <span className="badge category-badge">{habit.category}</span>}
                           <div className="streak-indicator">🔥 {calculateStreak(habit.completions)} Day Streak</div>
                        </div>
                      </div>
                      <div className="habit-controls">
                        <motion.button whileTap={{ scale: 0.85 }} className={`btn-complete ${isDoneToday ? 'active' : ''}`} onClick={() => toggleCompletion(habit.id, habit.completions, habit.name)}>{isDoneToday ? 'COMPLETED' : 'MARK DONE'}</motion.button>
                        <motion.button whileTap={{ scale: 0.8 }} className="btn-icon delete" onClick={() => handleDelete(habit.id)}>×</motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      {viewMode === 'analytics' && (
        <motion.div className="analytics-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
          <div className="analytics-grid">
            <div className="chart-card">
              <h4>7-Day Trend</h4>
              <div className="chart-wrapper"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00ff66" stopOpacity={0.8}/><stop offset="95%" stopColor="#00ff66" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="name" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="completions" stroke="#00ff66" strokeWidth={3} fillOpacity={1} fill="url(#colorCompletions)" /></AreaChart></ResponsiveContainer></div>
            </div>
            <div className="chart-card">
              <h4>Consistency Rates</h4>
              <div className="chart-wrapper"><ResponsiveContainer width="100%" height="100%"><BarChart data={successRateData}><XAxis dataKey="name" stroke="#8892b0" fontSize={10} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} /><Bar dataKey="rate" fill="#bc13fe" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="chart-card">
              <h4>Protocol Distribution</h4>
              <div className="chart-wrapper"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}><PolarGrid stroke="rgba(255,255,255,0.1)" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#8892b0', fontSize: 12 }} /><PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} /><Radar name="Completions" dataKey="A" stroke="#00c3ff" fill="#00c3ff" fillOpacity={0.4} /><Tooltip content={<CustomTooltip />} /></RadarChart></ResponsiveContainer></div>
            </div>
            <div className="chart-card">
              <h4>Peak Days</h4>
              <div className="chart-wrapper"><ResponsiveContainer width="100%" height="100%"><BarChart data={dowData}><XAxis dataKey="name" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} /><Bar dataKey="actions" fill="#00ff66" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
          </div>
          {missedHabits.length > 0 && (
            <div className="missed-analysis mt-2">
              <h4>⚠️ Degradation Warning</h4>
              <ul className="missed-list">{missedHabits.map(h => (<li key={h.id}><span className="missed-name">{h.name}</span><span className="missed-days">{h.daysMissed} Days Critical</span></li>))}</ul>
            </div>
          )}
        </motion.div>
      )}

      {viewMode === 'social' && (
        <motion.div className="social-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
          <div className="social-grid">
            <div className="social-panel leaderboard-panel">
              <h4>Global Rankings</h4>
              <ul className="leaderboard-list">
                {leaderboard.map((lUser, index) => {
                  const isMe = lUser.uid === user.uid;
                  const isFollowing = (currentUserProfile?.following || []).includes(lUser.uid);
                  return (
                    <li key={lUser.uid} className={`leaderboard-item ${isMe ? 'is-me' : ''}`}>
                      <div className="rank">#{index + 1}</div>
                      <div className="lb-user-info">
                        <img src={lUser.photoURL || 'https://via.placeholder.com/40'} alt="avatar" className="avatar" />
                        <div><p className="lb-name">{lUser.displayName}</p><p className="lb-stats">LVL {lUser.level} • {lUser.totalXP} XP</p></div>
                      </div>
                      {!isMe && <button className={`btn-icon follow-btn ${isFollowing ? 'following' : ''}`} onClick={() => handleFollow(lUser.uid)}>{isFollowing ? 'Unlink' : 'Link'}</button>}
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="social-panel feed-panel">
              <h4>Global Uplink</h4>
              <div className="feed-list">
                {feed.map(post => (
                  <div key={post.id} className="feed-card">
                    <img src={post.photoURL || 'https://via.placeholder.com/40'} alt="avatar" className="avatar" />
                    <div className="feed-content">
                      <p className="feed-text"><span className="feed-name">{post.displayName}</span> {post.action}</p>
                      <div className="feed-meta"><span className="feed-xp">+{post.xpEarned} XP</span><span className="feed-time">Just now</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;