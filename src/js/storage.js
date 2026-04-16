/* ══════════════════════════════════════
   StudyFlow · storage.js
   Shared state, store, utilities
   Loaded on every page
══════════════════════════════════════ */

/* ── Shared State ── */
let currentUser   = null;
let currentFilter = 'all';
let currentEnergy = null;
let editingTaskId = null;
let selectedLoad  = null;
let focusTaskId   = null;
let localTasksCache = [];

/* ── Timer State ── */
let timerInterval   = null;
let timerConfigMins = 25;
let timerDuration   = 25 * 60;
let timerRemaining  = 25 * 60;
let timerRunning    = false;
const RING_CIRC     = 2 * Math.PI * 88; // ≈ 553

/* ── localStorage Helper ── */
const store = {
  get:    (k, d = null) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
  set:    (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.warn('Storage full:', e); } },
  remove: (k)           => { localStorage.removeItem(k); }
};

/* ── Task CRUD ── */
function getTasks() { return localTasksCache; }

async function fetchTasks() {
  if (!currentUser) return;
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase fetchTasks err:', error);
  } else if (data) {
    localTasksCache = data;
  }
}

async function insertTaskDB(task) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase.from('tasks').insert([{
    id: task.id,
    user_id: session.user.id,
    title: task.title,
    description: task.description || null,
    deadline: task.deadline || null,
    load: task.load || 'medium',
    status: task.status || 'pending',
    subtasks: task.subtasks || [],
    is_deleted: false,
    created_at: new Date(task.createdAt || Date.now()).toISOString()
  }]);
  if (error) console.error('Supabase insertTaskDB err:', error);
}

async function updateTaskDB(id, updates) {
  const { error } = await supabase.from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('Supabase updateTaskDB err:', error);
}

async function softDeleteTaskDB(id) {
  const { error } = await supabase.from('tasks')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('Supabase softDeleteTaskDB err:', error);
}

/* ── Streak ── */
function checkStreak() {
  if (!currentUser) return;
  const k = `sf_streak_${currentUser.email}`;
  const s = store.get(k, { count: 0, last: '' });
  if (s.last && s.last < yesterdayStr()) { s.count = 0; store.set(k, s); }
}
function recordCompletion() {
  if (!currentUser) return;
  const k     = `sf_streak_${currentUser.email}`;
  const s     = store.get(k, { count: 0, last: '' });
  const today = todayStr();
  if (s.last === today) return;
  s.count = s.last === yesterdayStr() ? s.count + 1 : 1;
  s.last  = today;
  store.set(k, s);
}

/* ── Utilities ── */
function todayStr()     { return new Date().toISOString().split('T')[0]; }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; }

function fmtDate(str) {
  if (!str) return '';
  const [, m, d] = str.split('-');
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1]} ${+d}`;
}
function fmtTime(sec) {
  return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
}
function genId()       { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function escHtml(s)    { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function escAttr(s)    { return s.replace(/'/g,"&#39;").replace(/"/g,"&quot;"); }
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function hashPw(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) - h) + pw.charCodeAt(i); h |= 0; }
  return 'h' + Math.abs(h).toString(36);
}