// ============================================================
// API CLIENT — Intranet Corporativa v3
// Reemplaza data.js — conecta con el backend en Railway
// ============================================================

// 🔧 CAMBIA ESTA URL por la de tu proyecto en Railway
const API_URL = 'https://TU-PROYECTO.railway.app/api';

// ============================================================
// HTTP HELPERS
// ============================================================
function getToken() {
  const s = sessionStorage.getItem('intranet_session');
  return s ? JSON.parse(s).token : null;
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error de red');
  return data;
}

// ============================================================
// AUTH
// ============================================================
async function doLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  if (!username || !password) {
    errorMsg.textContent = 'Completa todos los campos.';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    // Save session with token
    sessionStorage.setItem('intranet_session', JSON.stringify({
      ...data.user,
      token: data.token
    }));

    window.location.href = 'pages/dashboard.html';
  } catch (e) {
    errorMsg.textContent = e.message || 'Usuario o contraseña incorrectos.';
    errorMsg.style.display = 'block';
  }
}

function getSession() {
  const s = sessionStorage.getItem('intranet_session');
  return s ? JSON.parse(s) : null;
}

function getCurrentSession() {
  return getSession();
}

function logout() {
  sessionStorage.removeItem('intranet_session');
  window.location.href = '../index.html';
}

// ============================================================
// USERS
// ============================================================
async function getUsers() {
  return await apiFetch('/users');
}

async function getUserById(id) {
  return await apiFetch('/users/' + id);
}

async function createUser(data) {
  return await apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
}

async function updateUser(id, data) {
  return await apiFetch('/users/' + id, { method: 'PUT', body: JSON.stringify(data) });
}

async function deleteUser(id) {
  return await apiFetch('/users/' + id, { method: 'DELETE' });
}

async function toggleUserActive(id, active) {
  return await apiFetch('/users/' + id + '/toggle', { method: 'PATCH', body: JSON.stringify({ active }) });
}

// ============================================================
// PANELS
// ============================================================
async function getPanels() {
  return await apiFetch('/panels');
}

async function getPanelById(id) {
  return await apiFetch('/panels/' + id);
}

async function getUserPanels(userId) {
  return await apiFetch('/panels/user/' + userId);
}

async function createPanel(data) {
  return await apiFetch('/panels', { method: 'POST', body: JSON.stringify(data) });
}

async function updatePanel(id, data) {
  return await apiFetch('/panels/' + id, { method: 'PUT', body: JSON.stringify(data) });
}

async function deletePanel(id) {
  return await apiFetch('/panels/' + id, { method: 'DELETE' });
}

// ============================================================
// PERMISSIONS
// ============================================================
async function getPanelPermissions(panelId) {
  return await apiFetch('/permissions/' + panelId);
}

async function setPanelPermissions(panelId, userIds) {
  return await apiFetch('/permissions/' + panelId, {
    method: 'POST',
    body: JSON.stringify({ userIds })
  });
}

// ============================================================
// FAVORITES
// ============================================================
async function getFavorites(userId) {
  return await apiFetch('/favorites/' + userId);
}

async function toggleFavorite(userId, panelId) {
  const res = await apiFetch('/favorites/toggle', {
    method: 'POST',
    body: JSON.stringify({ userId, panelId })
  });
  return res.added;
}

async function isFavorite(userId, panelId) {
  const favs = await getFavorites(userId);
  return favs.includes(Number(panelId));
}

// ============================================================
// LOGS
// ============================================================
async function getLogs() {
  return await apiFetch('/logs');
}

// ============================================================
// NOTIFICATIONS
// ============================================================
async function getNotifications(userId) {
  return await apiFetch('/notifications/' + userId);
}

async function getUnreadCount(userId) {
  const res = await apiFetch('/notifications/' + userId + '/unread');
  return res.count;
}

async function markAllRead(userId) {
  return await apiFetch('/notifications/' + userId + '/read-all', { method: 'PATCH' });
}

// ============================================================
// HELPERS
// ============================================================
function makeInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function avatarColor(id) {
  const colors = ['#E3000F','#2563EB','#1A9B3C','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316'];
  return colors[Number(id) % colors.length];
}

// requireAuth — checks session and redirects if not logged in
function requireAuth(adminOnly = false) {
  const session = getSession();
  if (!session) {
    window.location.href = '../index.html';
    return null;
  }
  if (adminOnly && session.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return null;
  }
  return session;
}
