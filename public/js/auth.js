/* ═══════════════════════════════════════════════════
   auth.js — Session management con JWT
   ═══════════════════════════════════════════════════ */

const SESSION_KEY = 'intranet_session';

function saveSession(user) {
  const session = {
    id:           user.id,
    name:         user.name,
    username:     user.username,
    role:         user.role,
    department:   user.department || '',
    email:        user.email || '',
    avatar:       user.avatar || (user.name ? user.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : '?'),
    profilePhoto: user.profile_photo || user.profilePhoto || null,
    loginAt:      Date.now(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('intranet_token');
}

/* Todos los HTMLs viven en /pages/ → login en ../index.html */
function requireAuth(adminOnly = false) {
  const session = getSession();
  if (!session) { window.location.href = '../index.html'; return null; }
  if (adminOnly && session.role !== 'admin') { window.location.href = 'panels.html'; return null; }
  return session;
}

function requireUser() {
  const session = getSession();
  if (!session) { window.location.href = '../index.html'; return null; }
  return session;
}

async function logout(userId) {
  clearSession();
  window.location.href = '../index.html';
}

window.saveSession  = saveSession;
window.getSession   = getSession;
window.clearSession = clearSession;
window.requireAuth  = requireAuth;
window.requireUser  = requireUser;
window.logout       = logout;
