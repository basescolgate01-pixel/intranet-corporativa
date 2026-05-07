// ============================================================
// DATA STORE — Intranet Corporativa v2
// ============================================================

const DB_KEY = 'intranet_db';

const DEFAULT_DB = {
  users: [
    { id:1, username:'admin',      password:'Admin2025!', name:'Administrador General', role:'admin', email:'admin@empresa.com',      department:'TI / Sistemas', avatar:'A',  profilePhoto:null, active:true,  createdAt:'2025-01-01' },
    { id:2, username:'jlopez',     password:'Pass123!',   name:'Juan López',            role:'user',  email:'jlopez@empresa.com',      department:'Ventas',        avatar:'JL', profilePhoto:null, active:true,  createdAt:'2025-01-15' },
    { id:3, username:'mgarcia',    password:'Pass123!',   name:'María García',          role:'user',  email:'mgarcia@empresa.com',     department:'Marketing',     avatar:'MG', profilePhoto:null, active:true,  createdAt:'2025-02-01' },
    { id:4, username:'crodriguez', password:'Pass123!',   name:'Carlos Rodríguez',      role:'user',  email:'crodriguez@empresa.com',  department:'Finanzas',      avatar:'CR', profilePhoto:null, active:true,  createdAt:'2025-02-10' }
  ],
  panels: [
    { id:1, title:'Dashboard de Ventas',    description:'KPIs y métricas de ventas en tiempo real',   embedUrl:'https://app.powerbi.com/reportEmbed?reportId=DEMO1', category:'Ventas',    icon:'📊', iconUrl:null, color:'#E3000F', createdAt:'2025-01-10', createdBy:1 },
    { id:2, title:'Análisis de Marketing',  description:'Campañas, alcance y conversiones',            embedUrl:'https://app.powerbi.com/reportEmbed?reportId=DEMO2', category:'Marketing', icon:'📈', iconUrl:null, color:'#2563EB', createdAt:'2025-01-20', createdBy:1 },
    { id:3, title:'Reporte Financiero',     description:'P&L, flujo de caja y presupuesto',            embedUrl:'https://app.powerbi.com/reportEmbed?reportId=DEMO3', category:'Finanzas',  icon:'💰', iconUrl:null, color:'#1A9B3C', createdAt:'2025-02-05', createdBy:1 }
  ],
  permissions: { 1:[1,2,3], 2:[1,3], 3:[1,4] },
  logs: [
    { id:1, userId:1, action:'LOGIN', detail:'Inicio de sesión', ts:new Date(Date.now()-3600000).toISOString() }
  ],
  // favorites: { userId: [panelId, ...] }
  favorites: {},
  // notifications: [{ id, userId, type, message, read, ts }]
  notifications: []
};

// ---- Init ----
function initDB() {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
    return;
  }
  // Migrate: add missing fields to existing DB
  const db = JSON.parse(localStorage.getItem(DB_KEY));
  let changed = false;
  if (!db.favorites)     { db.favorites = {};     changed = true; }
  if (!db.notifications) { db.notifications = []; changed = true; }
  db.users.forEach(u => {
    if (u.profilePhoto === undefined) { u.profilePhoto = null; changed = true; }
    if (u.active === undefined)       { u.active = true;       changed = true; }
  });
  if (changed) localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getDB() {
  initDB();
  return JSON.parse(localStorage.getItem(DB_KEY));
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
}

// ---- USERS ----
function getUsers() { return getDB().users; }

function getUserById(id) {
  return getDB().users.find(u => u.id === Number(id)) || null;
}

function createUser(data) {
  const db = getDB();
  const newId = Math.max(...db.users.map(u => u.id), 0) + 1;
  const user = { ...data, id: newId, profilePhoto: null, active: true, createdAt: new Date().toISOString().split('T')[0] };
  if (!user.avatar) user.avatar = makeInitials(user.name);
  db.users.push(user);
  saveDB(db);
  addLog(getCurrentSession()?.id, 'CREATE_USER', `Creó usuario: ${user.username}`);
  // Notify all admins
  pushNotification(null, 'NEW_USER', `Nuevo usuario creado: ${user.name} (${user.department})`, 'admin');
  return user;
}

function updateUser(id, data) {
  const db = getDB();
  const idx = db.users.findIndex(u => u.id === Number(id));
  if (idx === -1) return null;
  const prev = { ...db.users[idx] };
  db.users[idx] = { ...db.users[idx], ...data };
  saveDB(db);
  addLog(getCurrentSession()?.id, 'UPDATE_USER', `Actualizó usuario: ${db.users[idx].username}`);
  // Notify if password changed
  if (data.password && data.password !== prev.password) {
    pushNotification(Number(id), 'PASSWORD_CHANGED', 'El administrador cambió tu contraseña. Por favor inicia sesión de nuevo.');
  }
  return db.users[idx];
}

function deleteUser(id) {
  const db = getDB();
  const u = db.users.find(u => u.id === Number(id));
  db.users = db.users.filter(u => u.id !== Number(id));
  for (const pid in db.permissions) {
    db.permissions[pid] = db.permissions[pid].filter(uid => uid !== Number(id));
  }
  if (db.favorites[id]) delete db.favorites[id];
  db.notifications = db.notifications.filter(n => n.userId !== Number(id));
  saveDB(db);
  if (u) addLog(getCurrentSession()?.id, 'DELETE_USER', `Eliminó usuario: ${u.username}`);
}

function toggleUserActive(id, active) {
  const db = getDB();
  const idx = db.users.findIndex(u => u.id === Number(id));
  if (idx === -1) return;
  db.users[idx].active = active;
  saveDB(db);
  addLog(getCurrentSession()?.id, 'UPDATE_USER', `${active ? 'Activó' : 'Desactivó'} usuario: ${db.users[idx].username}`);
  if (!active) {
    pushNotification(Number(id), 'ACCOUNT_DISABLED', 'Tu cuenta ha sido desactivada. Contacta al administrador.');
  }
}

// ---- PANELS ----
function getPanels() { return getDB().panels; }

function getPanelById(id) {
  return getDB().panels.find(p => p.id === Number(id)) || null;
}

function createPanel(data) {
  const db = getDB();
  const newId = Math.max(...db.panels.map(p => p.id), 0) + 1;
  const panel = { ...data, id: newId, iconUrl: data.iconUrl || null, createdAt: new Date().toISOString().split('T')[0], createdBy: getCurrentSession()?.id };
  db.panels.push(panel);
  db.permissions[newId] = [getCurrentSession()?.id];
  saveDB(db);
  addLog(getCurrentSession()?.id, 'CREATE_PANEL', `Creó panel: ${panel.title}`);
  // Notify all users (new panel available)
  db.users.filter(u => u.role !== 'admin').forEach(u => {
    pushNotification(u.id, 'NEW_PANEL', `Nuevo panel disponible: "${panel.title}" en categoría ${panel.category || 'General'}.`);
  });
  return panel;
}

function updatePanel(id, data) {
  const db = getDB();
  const idx = db.panels.findIndex(p => p.id === Number(id));
  if (idx === -1) return null;
  db.panels[idx] = { ...db.panels[idx], ...data };
  saveDB(db);
  addLog(getCurrentSession()?.id, 'UPDATE_PANEL', `Actualizó panel: ${db.panels[idx].title}`);
  return db.panels[idx];
}

function deletePanel(id) {
  const db = getDB();
  const p = db.panels.find(p => p.id === Number(id));
  db.panels = db.panels.filter(p => p.id !== Number(id));
  delete db.permissions[id];
  // Remove from favorites
  for (const uid in db.favorites) {
    db.favorites[uid] = db.favorites[uid].filter(pid => pid !== Number(id));
  }
  saveDB(db);
  if (p) addLog(getCurrentSession()?.id, 'DELETE_PANEL', `Eliminó panel: ${p.title}`);
}

// ---- PERMISSIONS ----
function getPanelPermissions(panelId) {
  const db = getDB();
  return (db.permissions[panelId] || db.permissions[String(panelId)] || []).map(Number);
}

function setPanelPermissions(panelId, userIds, previousUserIds) {
  const db = getDB();
  const pid = Number(panelId);
  const prev = new Set((previousUserIds || []).map(Number));
  const next = new Set(userIds.map(Number));
  db.permissions[pid] = [...next];
  saveDB(db);
  addLog(getCurrentSession()?.id, 'UPDATE_PERM', `Actualizó permisos del panel ID: ${panelId}`);
  // Notify users who lost access
  prev.forEach(uid => {
    if (!next.has(uid)) {
      const panel = getPanelById(pid);
      pushNotification(uid, 'ACCESS_REVOKED', `Tu acceso al panel "${panel ? panel.title : 'desconocido'}" fue revocado.`);
    }
  });
}

function getUserPanels(userId) {
  const db = getDB();
  return db.panels.filter(p => {
    const perms = (db.permissions[p.id] || db.permissions[String(p.id)] || []).map(Number);
    return perms.includes(Number(userId));
  });
}

// ---- FAVORITES ----
function getFavorites(userId) {
  const db = getDB();
  return (db.favorites[userId] || []).map(Number);
}

function toggleFavorite(userId, panelId) {
  const db = getDB();
  if (!db.favorites[userId]) db.favorites[userId] = [];
  const idx = db.favorites[userId].indexOf(Number(panelId));
  if (idx === -1) {
    db.favorites[userId].push(Number(panelId));
  } else {
    db.favorites[userId].splice(idx, 1);
  }
  saveDB(db);
  return idx === -1; // true = added, false = removed
}

function isFavorite(userId, panelId) {
  const db = getDB();
  return (db.favorites[userId] || []).map(Number).includes(Number(panelId));
}

// ---- NOTIFICATIONS ----
function getNotifications(userId) {
  const db = getDB();
  return db.notifications
    .filter(n => n.userId === Number(userId) || n.userId === null)
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 50);
}

function getUnreadCount(userId) {
  const db = getDB();
  return db.notifications.filter(n =>
    (n.userId === Number(userId) || n.userId === null) && !n.read
  ).length;
}

function markAllRead(userId) {
  const db = getDB();
  db.notifications.forEach(n => {
    if (n.userId === Number(userId) || n.userId === null) n.read = true;
  });
  saveDB(db);
}

function pushNotification(userId, type, message, targetRole) {
  const db = getDB();
  const newId = Math.max(...db.notifications.map(n => n.id), 0) + 1;
  if (targetRole === 'admin') {
    // Notify all admins
    db.users.filter(u => u.role === 'admin').forEach(u => {
      db.notifications.push({ id: newId + u.id, userId: u.id, type, message, read: false, ts: new Date().toISOString() });
    });
  } else {
    db.notifications.push({ id: newId, userId: userId ? Number(userId) : null, type, message, read: false, ts: new Date().toISOString() });
  }
  if (db.notifications.length > 200) db.notifications = db.notifications.slice(-200);
  saveDB(db);
}

// ---- LOGS ----
function addLog(userId, action, detail) {
  const db = getDB();
  const newId = Math.max(...db.logs.map(l => l.id), 0) + 1;
  db.logs.push({ id: newId, userId, action, detail, ts: new Date().toISOString() });
  if (db.logs.length > 500) db.logs = db.logs.slice(-500);
  saveDB(db);
}

function getLogs() {
  return getDB().logs.slice().reverse();
}

// ---- SESSION ----
function getCurrentSession() {
  const s = sessionStorage.getItem('intranet_session');
  return s ? JSON.parse(s) : null;
}

// ---- HELPERS ----
function makeInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
