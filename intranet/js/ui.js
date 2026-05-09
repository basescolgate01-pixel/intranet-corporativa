// ============================================================
// UI UTILITIES — Intranet Corporativa v2
// ============================================================

// ---- Avatar colors ----
const AVATAR_COLORS = ['#E3000F','#2563EB','#1A9B3C','#F59E0B','#8B5CF6','#06B6D4'];
function avatarColor(id) { return AVATAR_COLORS[Number(id) % AVATAR_COLORS.length]; }

// ---- Date format ----
function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Ahora mismo';
  if (m < 60) return `Hace ${m} min`;
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${d}d`;
}

// ---- SIDEBAR ----
function renderSidebar(session, activePage) {
  const isAdmin = session.role === 'admin';
  const sidebar = document.getElementById('sidebar');
  const unread = getUnreadCount(session.id);

  // Avatar: photo or initials
  const avatarHtml = session.profilePhoto
    ? `<img src="${session.profilePhoto}" alt="${session.name}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.35)"/>`
    : `<div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;">${session.avatar}</div>`;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-mark" style="background:transparent;padding:0;border-radius:0;height:44px;display:flex;align-items:center;box-shadow:none">
        <img src="${typeof COLGATE_LOGO !== 'undefined' ? COLGATE_LOGO : ''}" alt="Colgate" style="height:44px;width:auto;border-radius:8px;display:block"/>
      </div>
      <div class="logo-text">
        <h2>Intranet</h2>
        <span>Portal Corporativo</span>
      </div>
    </div>

    <div class="sidebar-user" onclick="openProfileModal()" style="cursor:pointer" title="Ver mi perfil">
      ${avatarHtml}
      <div class="user-info">
        <div class="name">${session.name}</div>
        <span class="role-badge ${session.role}">${isAdmin ? 'Administrador' : 'Usuario'}</span>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" style="width:14px;height:14px;margin-left:auto;flex-shrink:0">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-title">Principal</div>
      <a class="nav-item ${activePage==='dashboard'?'active':''}" href="dashboard.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        Dashboard
      </a>
      <a class="nav-item ${activePage==='panels'?'active':''}" href="panels.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
        </svg>
        Paneles Power BI
      </a>

      ${isAdmin ? `
      <div class="nav-section-title">Administración</div>
      <a class="nav-item ${activePage==='users'?'active':''}" href="users.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Gestión de Usuarios
      </a>
      <a class="nav-item ${activePage==='permissions'?'active':''}" href="permissions.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Permisos y Accesos
      </a>
      <a class="nav-item ${activePage==='logs'?'active':''}" href="logs.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Registro de Actividad
      </a>
      ` : ''}
    </nav>

    <div class="sidebar-bottom">
      <button class="nav-item danger" onclick="logout()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Cerrar Sesión
      </button>
    </div>
  `;

  // Inject modals + overlay into body
  injectGlobalUI(session);
}

// ---- GLOBAL UI (modals, search overlay, notifications panel) ----
function injectGlobalUI(session) {
  const existing = document.getElementById('globalUI');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'globalUI';
  div.innerHTML = `
    <!-- Notification panel -->
    <div id="notifPanel" style="
      position:fixed;top:0;right:-360px;bottom:0;width:340px;
      background:var(--bg-card);border-left:1px solid var(--border);
      z-index:400;display:flex;flex-direction:column;
      box-shadow:-8px 0 40px rgba(0,0,0,0.2);
      transition:right 0.3s cubic-bezier(.4,0,.2,1);
    ">
      <div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;text-transform:uppercase;color:var(--text-primary)">Notificaciones</div>
          <div id="notifSubtitle" style="font-size:11px;color:var(--text-muted);margin-top:1px"></div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button onclick="markAllReadUI()" title="Marcar todo leído" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:11px;font-weight:600;padding:4px 8px;border-radius:6px;transition:all .15s" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--text-muted)'">
            Todo leído
          </button>
          <button onclick="closeNotifPanel()" style="width:30px;height:30px;border-radius:50%;background:var(--bg-input);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-secondary)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div id="notifList" style="flex:1;overflow-y:auto;padding:8px 0"></div>
    </div>
    <div id="notifOverlay" onclick="closeNotifPanel()" style="position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:399;display:none;backdrop-filter:blur(2px)"></div>

    <!-- Search overlay -->
    <div id="searchOverlay" style="
      position:fixed;inset:0;z-index:500;
      background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
      display:none;align-items:flex-start;justify-content:center;padding-top:80px;
    " onclick="closeSearch(event)">
      <div style="width:100%;max-width:600px;padding:0 20px" onclick="event.stopPropagation()">
        <div style="background:var(--bg-card);border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,0.4);border:1px solid var(--border);overflow:hidden">
          <div style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="width:20px;height:20px;flex-shrink:0">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input id="globalSearchInput" type="text" placeholder="Buscar paneles, categorías..."
              style="flex:1;border:none;outline:none;background:transparent;font-family:'Barlow',sans-serif;font-size:16px;color:var(--text-primary)"
              oninput="runSearch(this.value)" onkeydown="searchKeyNav(event)"/>
            <kbd style="background:var(--bg-input);border:1px solid var(--border);border-radius:5px;padding:2px 7px;font-size:11px;color:var(--text-muted);font-family:monospace">ESC</kbd>
          </div>
          <div id="searchResults" style="max-height:400px;overflow-y:auto;padding:8px 0;min-height:60px">
            <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">Escribe para buscar paneles...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile modal -->
    <div id="profileModal" class="modal-overlay">
      <div class="modal" style="max-width:480px">
        <div class="modal-header">
          <h3>Mi Perfil</h3>
          <button class="modal-close" onclick="closeModal('profileModal')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body" id="profileModalBody"></div>
      </div>
    </div>

    <div class="toast-container" id="toastContainer"></div>
  `;
  document.body.appendChild(div);
}

// ---- NOTIFICATIONS ----
function openNotifPanel(session) {
  const panel = document.getElementById('notifPanel');
  const overlay = document.getElementById('notifOverlay');
  panel.style.right = '0';
  overlay.style.display = 'block';
  renderNotifList(session);
}

function closeNotifPanel() {
  document.getElementById('notifPanel').style.right = '-360px';
  document.getElementById('notifOverlay').style.display = 'none';
}

function renderNotifList(session) {
  const notifs = getNotifications(session.id);
  const unread = notifs.filter(n => !n.read).length;
  document.getElementById('notifSubtitle').textContent =
    unread > 0 ? `${unread} sin leer` : 'Todo al día';

  const icons = {
    NEW_PANEL:        { icon:'📊', color:'#2563EB' },
    ACCESS_REVOKED:   { icon:'🔒', color:'#E3000F' },
    PASSWORD_CHANGED: { icon:'🔑', color:'#F59E0B' },
    ACCOUNT_DISABLED: { icon:'⛔', color:'#E3000F' },
    NEW_USER:         { icon:'👤', color:'#1A9B3C' },
    DEFAULT:          { icon:'🔔', color:'#6B7A90' }
  };

  const list = document.getElementById('notifList');
  if (!notifs.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-muted)">
      <div style="font-size:32px;margin-bottom:12px">🔔</div>
      <div style="font-size:14px;font-weight:600;color:var(--text-secondary)">Sin notificaciones</div>
      <div style="font-size:12px;margin-top:4px">Todo está al día</div>
    </div>`;
    return;
  }

  list.innerHTML = notifs.map(n => {
    const cfg = icons[n.type] || icons.DEFAULT;
    return `<div onclick="clickNotif(${n.id},${session.id})" style="
      display:flex;gap:12px;padding:14px 20px;cursor:pointer;
      border-bottom:1px solid var(--border-light);
      background:${n.read ? 'transparent' : 'var(--info-bg)'};
      transition:background .15s;
    " onmouseover="this.style.background='var(--table-hover)'" onmouseout="this.style.background='${n.read ? 'transparent' : 'var(--info-bg)'}'">
      <div style="width:36px;height:36px;border-radius:10px;background:${cfg.color}18;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${cfg.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:var(--text-primary);line-height:1.4;${n.read ? '' : 'font-weight:600'}">${n.message}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${timeAgo(n.ts)}</div>
      </div>
      ${!n.read ? `<div style="width:8px;height:8px;border-radius:50%;background:var(--red);flex-shrink:0;margin-top:4px"></div>` : ''}
    </div>`;
  }).join('');
}

function clickNotif(notifId, userId) {
  const db = getDB();
  const n = db.notifications.find(n => n.id === notifId);
  if (n) { n.read = true; saveDB(db); }
  renderNotifList(getSession());
  updateBellBadge(userId);
}

function markAllReadUI() {
  const s = getSession();
  if (!s) return;
  markAllRead(s.id);
  renderNotifList(s);
  updateBellBadge(s.id);
}

function updateBellBadge(userId) {
  const count = getUnreadCount(userId);
  const badge = document.getElementById('bellBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ---- SEARCH ----
let _searchSession = null;
function openSearch(session) {
  _searchSession = session;
  const overlay = document.getElementById('searchOverlay');
  overlay.style.display = 'flex';
  setTimeout(() => document.getElementById('globalSearchInput').focus(), 50);
}

function closeSearch(e) {
  document.getElementById('searchOverlay').style.display = 'none';
  document.getElementById('globalSearchInput').value = '';
  document.getElementById('searchResults').innerHTML =
    `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">Escribe para buscar paneles...</div>`;
}

function runSearch(q) {
  const res = document.getElementById('searchResults');
  if (!q.trim()) {
    res.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">Escribe para buscar paneles...</div>`;
    return;
  }
  const session = _searchSession || getSession();
  const userPanels = getUserPanels(session.id);
  const favs = new Set(getFavorites(session.id));
  const q2 = q.toLowerCase();
  const matches = userPanels.filter(p =>
    p.title.toLowerCase().includes(q2) ||
    (p.category || '').toLowerCase().includes(q2) ||
    (p.description || '').toLowerCase().includes(q2)
  );

  if (!matches.length) {
    res.innerHTML = `<div style="text-align:center;padding:28px;color:var(--text-muted);font-size:13px">Sin resultados para "<strong>${q}</strong>"</div>`;
    return;
  }

  res.innerHTML = matches.map((p, i) => `
    <div data-search-idx="${i}" onclick="searchOpen(${p.id})" style="
      display:flex;align-items:center;gap:14px;padding:12px 20px;cursor:pointer;
      transition:background .12s;border-bottom:1px solid var(--border-light);
    " onmouseover="this.style.background='var(--table-hover)'" onmouseout="this.style.background='transparent'">
      <div style="width:40px;height:40px;border-radius:10px;background:${p.color}22;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${p.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${p.title}</div>
        <div style="font-size:12px;color:var(--text-muted)">${p.category || ''} ${p.description ? '· '+p.description : ''}</div>
      </div>
      ${favs.has(p.id) ? `<span style="font-size:16px" title="Favorito">⭐</span>` : ''}
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><path d="M9 18l6-6-6-6"/></svg>
    </div>`).join('');
}

function searchKeyNav(e) {
  if (e.key === 'Escape') closeSearch();
}

function searchOpen(panelId) {
  closeSearch();
  // Try to open panel viewer if function exists (panels.html / dashboard.html)
  if (typeof openPanelViewer === 'function') {
    const p = getPanelById(panelId);
    if (p) openPanelViewer(p);
  } else {
    window.location.href = `panels.html#panel-${panelId}`;
  }
}

// ---- PROFILE MODAL ----
function openProfileModal() {
  const session = getSession();
  if (!session) return;
  const user = getUserById(session.id);
  if (!user) return;

  const myPanels = getUserPanels(session.id);
  const favIds = new Set(getFavorites(session.id));

  const avatarHtml = user.profilePhoto
    ? `<img src="${user.profilePhoto}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid var(--border)"/>`
    : `<div style="width:90px;height:90px;border-radius:50%;background:${avatarColor(user.id)};display:flex;align-items:center;justify-content:center;color:white;font-size:28px;font-weight:700;border:3px solid var(--border)">${user.avatar}</div>`;

  document.getElementById('profileModalBody').innerHTML = `
    <!-- Avatar + upload -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:20px">
      <div style="position:relative">
        ${avatarHtml}
        <label title="Cambiar foto" style="
          position:absolute;bottom:2px;right:2px;
          width:28px;height:28px;border-radius:50%;
          background:var(--red);border:2px solid var(--bg-card);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
        ">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="width:13px;height:13px">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <input type="file" accept="image/*" style="display:none" onchange="uploadProfilePhoto(event)"/>
        </label>
      </div>
      <div style="text-align:center">
        <div style="font-size:17px;font-weight:700;color:var(--text-primary)">${user.name}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">@${user.username} · ${user.department || ''}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;border-bottom:2px solid var(--border);margin-bottom:16px;gap:0">
      ${['info','password','panels'].map((t,i) => `
        <button onclick="switchProfileTab('${t}')" id="ptab-${t}" style="
          flex:1;padding:8px;background:none;border:none;cursor:pointer;
          font-family:'Barlow',sans-serif;font-size:13px;font-weight:600;
          color:${i===0 ? 'var(--red)' : 'var(--text-muted)'};
          border-bottom:${i===0 ? '2px solid var(--red)' : '2px solid transparent'};
          margin-bottom:-2px;transition:all .15s;
        ">${['Información','Contraseña','Mis Paneles'][i]}</button>`).join('')}
    </div>

    <!-- Tab: Info -->
    <div id="ptab-info-content">
      <div class="form-group">
        <label>Nombre completo</label>
        <input type="text" id="prof-name" value="${user.name}"/>
      </div>
      <div class="form-group">
        <label>Correo electrónico</label>
        <input type="email" id="prof-email" value="${user.email || ''}"/>
      </div>
      <div class="form-group">
        <label>Departamento</label>
        <input type="text" id="prof-dept" value="${user.department || ''}" ${user.role !== 'admin' ? 'readonly style="opacity:.6"' : ''}/>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="saveProfileInfo()">Guardar cambios</button>
    </div>

    <!-- Tab: Password -->
    <div id="ptab-password-content" style="display:none">
      <div class="form-group">
        <label>Contraseña actual</label>
        <input type="password" id="prof-curpass" placeholder="••••••••"/>
      </div>
      <div class="form-group">
        <label>Nueva contraseña</label>
        <input type="password" id="prof-newpass" placeholder="Mínimo 6 caracteres"/>
      </div>
      <div class="form-group">
        <label>Confirmar nueva contraseña</label>
        <input type="password" id="prof-confpass" placeholder="Repite la nueva contraseña"/>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="saveProfilePassword()">Cambiar contraseña</button>
    </div>

    <!-- Tab: Panels -->
    <div id="ptab-panels-content" style="display:none">
      ${myPanels.length === 0
        ? `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px">Sin paneles asignados</div>`
        : myPanels.map(p => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-light)">
            <div style="width:36px;height:36px;border-radius:9px;background:${p.color}22;display:flex;align-items:center;justify-content:center;font-size:18px">${p.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${p.title}</div>
              <div style="font-size:11px;color:var(--text-muted)">${p.category || ''}</div>
            </div>
            <span style="font-size:16px" title="${favIds.has(p.id) ? 'Favorito' : ''}">${favIds.has(p.id) ? '⭐' : ''}</span>
          </div>`).join('')}
    </div>
  `;

  openModal('profileModal');
}

function switchProfileTab(tab) {
  ['info','password','panels'].forEach(t => {
    document.getElementById(`ptab-${t}-content`).style.display = t === tab ? '' : 'none';
    const btn = document.getElementById(`ptab-${t}`);
    btn.style.color = t === tab ? 'var(--red)' : 'var(--text-muted)';
    btn.style.borderBottom = t === tab ? '2px solid var(--red)' : '2px solid transparent';
  });
}

function uploadProfilePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('La imagen no puede superar 2MB.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const session = getSession();
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === session.id);
    if (idx !== -1) { db.users[idx].profilePhoto = dataUrl; saveDB(db); }
    // Update session
    session.profilePhoto = dataUrl;
    sessionStorage.setItem('intranet_session', JSON.stringify(session));
    // Re-render
    renderSidebar(session, window._activePage || 'dashboard');
    openProfileModal();
    showToast('Foto de perfil actualizada.', 'success');
  };
  reader.readAsDataURL(file);
}

function saveProfileInfo() {
  const session = getSession();
  const name  = document.getElementById('prof-name').value.trim();
  const email = document.getElementById('prof-email').value.trim();
  const dept  = document.getElementById('prof-dept').value.trim();
  if (!name) { showToast('El nombre no puede estar vacío.', 'error'); return; }
  const updated = updateUser(session.id, { name, email, department: dept, avatar: makeInitials(name) });
  const newSession = refreshSession();
  renderSidebar(newSession, window._activePage || 'dashboard');
  openProfileModal();
  showToast('Perfil actualizado correctamente.', 'success');
}

function saveProfilePassword() {
  const session = getSession();
  const user = getUserById(session.id);
  const cur  = document.getElementById('prof-curpass').value;
  const nw   = document.getElementById('prof-newpass').value;
  const conf = document.getElementById('prof-confpass').value;
  if (user.password !== cur) { showToast('La contraseña actual es incorrecta.', 'error'); return; }
  if (nw.length < 6)         { showToast('La nueva contraseña debe tener al menos 6 caracteres.', 'error'); return; }
  if (nw !== conf)           { showToast('Las contraseñas no coinciden.', 'error'); return; }
  const db = getDB();
  const idx = db.users.findIndex(u => u.id === session.id);
  db.users[idx].password = nw;
  saveDB(db);
  addLog(session.id, 'UPDATE_USER', 'Cambió su propia contraseña');
  closeModal('profileModal');
  showToast('Contraseña cambiada. Vuelve a iniciar sesión.', 'success');
  setTimeout(logout, 2000);
}

// ---- MODAL HELPERS ----
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ---- DARK MODE ----
const THEME_KEY = 'intranet_theme';
function getTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.innerHTML = theme === 'dark' ? iconSun() : iconMoon();
    btn.title = theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  });
}
function toggleTheme() { applyTheme(getTheme() === 'dark' ? 'light' : 'dark'); }
function iconMoon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}
function iconSun() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`;
}
(function() { document.documentElement.setAttribute('data-theme', localStorage.getItem(THEME_KEY) || 'light'); })();
document.addEventListener('DOMContentLoaded', () => applyTheme(getTheme()));

// ---- TOAST ----
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type]||icons.info}<span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
