// ============================================================
// AUTH — Intranet Corporativa v2
// ============================================================

function getSession() {
  const s = sessionStorage.getItem('intranet_session');
  return s ? JSON.parse(s) : null;
}

function setSession(user) {
  const session = {
    id:           user.id,
    username:     user.username,
    name:         user.name,
    role:         user.role,
    department:   user.department,
    avatar:       user.avatar,
    email:        user.email,
    profilePhoto: user.profilePhoto || null
  };
  sessionStorage.setItem('intranet_session', JSON.stringify(session));
  return session;
}

function refreshSession() {
  const s = getSession();
  if (!s) return null;
  const u = getUserById(s.id);
  if (!u) return null;
  return setSession(u);
}

function clearSession() {
  sessionStorage.removeItem('intranet_session');
}

function doLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const err = document.getElementById('errorMsg');

  if (!username || !password) {
    err.textContent = 'Por favor ingresa usuario y contraseña.';
    err.style.display = 'block';
    return;
  }

  const db = getDB();
  const user = db.users.find(u => u.username === username && u.password === password);

  if (!user) {
    err.textContent = 'Usuario o contraseña incorrectos.';
    err.style.display = 'block';
    document.getElementById('password').value = '';
    return;
  }

  if (!user.active) {
    err.textContent = 'Tu cuenta está desactivada. Contacta al administrador.';
    err.style.display = 'block';
    return;
  }

  err.style.display = 'none';
  setSession(user);
  addLog(user.id, 'LOGIN', `Inicio de sesión exitoso desde ${navigator.platform}`);
  window.location.href = 'pages/dashboard.html';
}

function requireAuth(adminOnly = false) {
  const session = getSession();
  if (!session) { window.location.href = '../index.html'; return null; }
  if (adminOnly && session.role !== 'admin') { window.location.href = 'dashboard.html'; return null; }
  return session;
}

function logout() {
  const session = getSession();
  if (session) addLog(session.id, 'LOGOUT', 'Cierre de sesión');
  clearSession();
  window.location.href = '../index.html';
}
