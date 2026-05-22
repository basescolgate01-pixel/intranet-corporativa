/* ═══════════════════════════════════════════════════
   data.js — API client layer
   Todas las funciones llaman a /api/* con JWT
   ═══════════════════════════════════════════════════ */

const API = '';

/* ── HTTP helper ── */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('intranet_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API + path, { ...options, headers });

  if (res.status === 401) {
    // silent: true → no redirigir (usado por el sidebar para evitar
    // interrumpir la página si el token expiró entre navegaciones)
    if (!options.silent) {
      localStorage.removeItem('intranet_token');
      sessionStorage.removeItem('intranet_session');
      window.location.href = '../index.html';
    }
    return null;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error del servidor');
  }

  return res.json();
}

/* ── AUTH ── */
async function validateLogin(username, password) {
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!data) return null;
    localStorage.setItem('intranet_token', data.token);
    return data.user;
  } catch (e) {
    console.error('Login error:', e.message);
    return null;
  }
}

/* ── SESSION ── */

/* ── HELPERS ── */
function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric' })
       + ' ' + d.toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' });
}
function makeInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
}
function avatarColor(id) {
  const colors = ['#E3000F','#003DA5','#1A9B3C','#7C3AED','#D97706','#0891B2','#BE185D','#065F46','#9333EA','#B45309'];
  return colors[Math.abs(Number(id) % colors.length)];
}

/* ── Normalizers ── */
function normalizePanel(p) {
  if (!p) return null;
  return {
    id:          p.id,
    title:       p.title,
    description: p.description || '',
    embedUrl:    p.embed_url,
    category:    p.category || '',
    icon:        p.icon || '📊',
    iconUrl:     p.icon_url || null,
    color:       p.color || '#E3000F',
    createdAt:   p.created_at,
  };
}
function normalizeUser(u) {
  if (!u) return null;
  return {
    id:           u.id,
    name:         u.name,
    username:     u.username,
    email:        u.email || '',
    department:   u.department || '',
    role:         u.role,
    active:       u.active,
    avatar:       u.avatar || makeInitials(u.name),
    profilePhoto: u.profile_photo || null,
    createdAt:    formatDate(u.created_at),
  };
}
function normalizeMenuItem(m) {
  if (!m) return null;
  // Normalizar ruta: si no comienza con /, agregarlo (excepto si es #)
  let path = m.path || '#';
  if (path !== '#' && !path.startsWith('/')) {
    path = '/' + path;
  }
  return {
    id:          m.id,
    label:       m.label,
    icon:        m.icon || '',
    path:        path,
    parentId:    m.parent_id || null,
    orderIndex:  m.order_index || 0,
    isActive:    m.is_active,
    createdAt:   m.created_at,
  };
}

/* ── USERS ── */
async function getUsers()      { const r = await apiFetch('/api/users'); return (r||[]).map(normalizeUser); }
async function getUserById(id) { const r = await apiFetch(`/api/users/${id}`); return normalizeUser(r); }
async function createUser(data) {
  return apiFetch('/api/users', { method:'POST', body: JSON.stringify(data) });
}
async function updateUser(id, data) {
  return apiFetch(`/api/users/${id}`, { method:'PUT', body: JSON.stringify(data) });
}
async function deleteUser(id) {
  return apiFetch(`/api/users/${id}`, { method:'DELETE' });
}
async function toggleUserActive(id, active) {
  return apiFetch(`/api/users/${id}/toggle`, { method:'PATCH', body: JSON.stringify({ active }) });
}

/* ── PANELS ── */
async function getPanels()              { const r = await apiFetch('/api/panels'); return (r||[]).map(normalizePanel); }
async function getPanelById(id)         { const r = await apiFetch(`/api/panels/${id}`); return normalizePanel(r); }
async function getAccessiblePanels(uid) { const r = await apiFetch(`/api/panels/user/${uid}`); return (r||[]).map(normalizePanel); }
async function createPanel(data) {
  const r = await apiFetch('/api/panels', {
    method:'POST',
    body: JSON.stringify({ title:data.title, description:data.description, embed_url:data.embedUrl, category:data.category, icon:data.icon, icon_url:data.iconUrl, color:data.color }),
  });
  return normalizePanel(r);
}
async function updatePanel(id, data) {
  const r = await apiFetch(`/api/panels/${id}`, {
    method:'PUT',
    body: JSON.stringify({ title:data.title, description:data.description, embed_url:data.embedUrl, category:data.category, icon:data.icon, icon_url:data.iconUrl, color:data.color }),
  });
  return normalizePanel(r);
}
async function deletePanel(id) {
  return apiFetch(`/api/panels/${id}`, { method:'DELETE' });
}

/* ── PERMISSIONS (paneles) ── */
async function getPanelPermissions(panelId) { return await apiFetch(`/api/permissions/${panelId}`) || []; }
async function setPanelPermissions(panelId, userIds) {
  return apiFetch(`/api/permissions/${panelId}`, { method:'POST', body: JSON.stringify({ userIds }) });
}

/* ── MENU ITEMS  ← NUEVO ── */
async function getMenuItems() {
  const r = await apiFetch('/api/menu');
  return (r||[]).map(normalizeMenuItem);
}
async function getMenuForUser(userId) {
  const r = await apiFetch(`/api/menu/user/${userId}`);
  return (r||[]).map(normalizeMenuItem);
}
/* Versiones silenciosas para el sidebar: no redirigen si el token expiró */
async function getMenuItemsSilent() {
  const r = await apiFetch('/api/menu', { silent: true });
  return (r||[]).map(normalizeMenuItem);
}
async function getMenuForUserSilent(userId) {
  const r = await apiFetch(`/api/menu/user/${userId}`, { silent: true });
  return (r||[]).map(normalizeMenuItem);
}
async function createMenuItem(data) {
  const r = await apiFetch('/api/menu', {
    method: 'POST',
    body: JSON.stringify({
      label:       data.label,
      icon:        data.icon || '',
      path:        data.path || '#',
      parent_id:   data.parentId || null,
      order_index: data.orderIndex || 0,
      is_active:   data.isActive !== false,
    }),
  });
  return normalizeMenuItem(r);
}
async function updateMenuItem(id, data) {
  const r = await apiFetch(`/api/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      label:       data.label,
      icon:        data.icon || '',
      path:        data.path || '#',
      parent_id:   data.parentId || null,
      order_index: data.orderIndex || 0,
      is_active:   data.isActive !== false,
    }),
  });
  return normalizeMenuItem(r);
}
async function deleteMenuItem(id) {
  return apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
}

/* ── MENU PERMISSIONS  ← NUEVO ── */
async function getMenuPermissionsForUser(userId) {
  return await apiFetch(`/api/menu-permissions/user/${userId}`) || [];
}
async function setMenuPermissionsForUser(userId, menuItemIds) {
  return apiFetch(`/api/menu-permissions/user/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ menuItemIds }),
  });
}

/* ── Organizar menú en árbol (padre → hijos) ── */
function buildMenuTree(flatItems) {
  const map = {};
  flatItems.forEach(item => { map[item.id] = { ...item, children: [] }; });
  const roots = [];
  flatItems.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  const sort = arr => arr.sort((a,b) => a.orderIndex - b.orderIndex).map(n => ({ ...n, children: sort(n.children) }));
  return sort(roots);
}

/* ── FAVORITES ── */
async function getFavorites(userId)        { return await apiFetch(`/api/favorites/${userId}`) || []; }
async function isFavorite(userId, panelId) { const f = await getFavorites(userId); return f.map(Number).includes(Number(panelId)); }
async function toggleFavorite(userId, panelId) {
  const r = await apiFetch('/api/favorites/toggle', { method:'POST', body: JSON.stringify({ userId, panelId }) });
  return r?.added ?? false;
}

/* ── LOGS ── */
async function getLogs() { return await apiFetch('/api/logs') || []; }
function addLog() {}

/* ── NOTIFICATIONS ── */
async function getNotifications(userId)  { return await apiFetch(`/api/notifications/${userId}`) || []; }
async function getUnreadCount(userId)    { const r = await apiFetch(`/api/notifications/${userId}/unread`); return r?.count || 0; }
async function markAllRead(userId)       { return apiFetch(`/api/notifications/${userId}/read-all`, { method:'PATCH' }); }

/* ── Expose all globally ── */
window.validateLogin=validateLogin;
window.getUsers=getUsers; window.getUserById=getUserById;
window.createUser=createUser; window.updateUser=updateUser; window.deleteUser=deleteUser;
window.toggleUserActive=toggleUserActive; window.getPanels=getPanels; window.getPanelById=getPanelById;
window.getAccessiblePanels=getAccessiblePanels; window.createPanel=createPanel;
window.updatePanel=updatePanel; window.deletePanel=deletePanel;
window.getPanelPermissions=getPanelPermissions; window.setPanelPermissions=setPanelPermissions;
window.getMenuItems=getMenuItems; window.getMenuForUser=getMenuForUser;
window.getMenuItemsSilent=getMenuItemsSilent; window.getMenuForUserSilent=getMenuForUserSilent;
window.createMenuItem=createMenuItem; window.updateMenuItem=updateMenuItem; window.deleteMenuItem=deleteMenuItem;
window.getMenuPermissionsForUser=getMenuPermissionsForUser; window.setMenuPermissionsForUser=setMenuPermissionsForUser;
window.buildMenuTree=buildMenuTree;
window.getFavorites=getFavorites; window.isFavorite=isFavorite; window.toggleFavorite=toggleFavorite;
window.getLogs=getLogs; window.addLog=addLog;
window.getNotifications=getNotifications; window.getUnreadCount=getUnreadCount; window.markAllRead=markAllRead;
window.formatDate=formatDate; window.makeInitials=makeInitials; window.avatarColor=avatarColor;
