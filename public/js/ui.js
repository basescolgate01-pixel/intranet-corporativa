/* ui.js — Colgate Intranet */

(function(){ if(localStorage.getItem('intranet_theme')==='dark') document.body.classList.add('dark'); })();
function toggleTheme(){ const d=document.body.classList.toggle('dark'); localStorage.setItem('intranet_theme',d?'dark':'light'); }

function renderSidebar(session, activePage) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const isAdmin = session.role === 'admin';

  const nav = [
    { key:'panels',      label:'Mis Paneles', href:'panels.html',
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
    { key:'dashboard',   label:'Dashboard',   href:'dashboard.html',   admin:true,
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
    { key:'users',       label:'Usuarios',    href:'users.html',       admin:true,
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { key:'permissions', label:'Permisos',    href:'permissions.html', admin:true,
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
    { key:'logs',        label:'Registro',    href:'logs.html',        admin:true,
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  ];

  const avatarBg = session.profilePhoto ? 'transparent' : avatarColor(session.id);
  const avatarContent = session.profilePhoto
    ? '<img src="' + session.profilePhoto + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
    : '<span style="font-size:12px;font-weight:700;color:white">' + (session.avatar || makeInitials(session.name)) + '</span>';

  // Build nav links using string concatenation (no template literal nesting issues)
  var linksHtml = '';
  nav.filter(function(n){ return !n.admin || isAdmin; }).forEach(function(n) {
    var on = activePage === n.key;
    var bg    = on ? '#FFFFFF'              : 'transparent';
    var color = on ? '#E3000F'             : 'rgba(255,255,255,0.80)';
    var fw    = on ? '700'                 : '500';
    var dot   = on ? '<span style="width:6px;height:6px;border-radius:50%;background:#E3000F;flex-shrink:0;margin-left:auto"></span>' : '';
    linksHtml +=
      '<a href="' + n.href + '"' +
      ' style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;' +
      'color:' + color + ';background:' + bg + ';font-size:13px;font-weight:' + fw + ';' +
      'text-decoration:none;white-space:nowrap;font-family:Barlow,sans-serif;transition:background 0.12s,color 0.12s;"' +
      ' onmouseover="if(this.style.backgroundColor!=\'rgb(255, 255, 255)\'){this.style.background=\'rgba(0,0,0,0.15)\';this.style.color=\'white\'}"' +
      ' onmouseout="if(this.style.backgroundColor!=\'rgb(255, 255, 255)\'){this.style.background=\'transparent\';this.style.color=\'rgba(255,255,255,0.80)\'}">' +
      '<span style="width:17px;height:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:inherit">' + n.svg + '</span>' +
      '<span style="flex:1">' + n.label + '</span>' +
      dot +
      '</a>';
  });

  sidebar.style.cssText =
    'width:220px;min-height:100vh;background:#E3000F;' +
    'position:fixed;left:0;top:0;bottom:0;display:flex;flex-direction:column;' +
    'z-index:100;overflow-y:auto;overflow-x:hidden;' +
    'box-shadow:3px 0 16px rgba(180,0,10,0.35);font-family:Barlow,sans-serif;';

  sidebar.innerHTML =
    // Logo area
    '<div style="padding:20px 16px 14px;border-bottom:1px solid rgba(255,255,255,0.15);flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px">' +
      '<img src="/colgate-logo-transparent.png" alt="Colgate" id="sbLogo"' +
      ' style="height:46px;object-fit:contain;max-width:155px;display:block;"' +
      ' onerror="this.style.display=\'none\';document.getElementById(\'sbLogoFallback\').style.display=\'block\'"/>' +
      '<span id="sbLogoFallback" style="display:none;font-family:\'Barlow Condensed\',sans-serif;font-size:24px;font-weight:800;color:white;letter-spacing:1px">COLGATE</span>' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:3px;margin-top:3px">Intranet</div>' +
    '</div>' +
    // User
    '<div style="padding:11px 14px;border-bottom:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;gap:10px;flex-shrink:0;background:rgba(0,0,0,0.10)">' +
      '<div style="width:34px;height:34px;border-radius:50%;background:' + avatarBg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2px solid rgba(255,255,255,0.3)">' +
        avatarContent +
      '</div>' +
      '<div style="min-width:0">' +
        '<div style="font-size:13px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + session.name + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.55);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">' + (isAdmin ? 'Administrador' : 'Usuario') + '</div>' +
      '</div>' +
    '</div>' +
    // Nav
    '<div style="padding:10px;flex:1">' +
      '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:8px 8px 6px">Navegación</div>' +
      linksHtml +
    '</div>' +
    // Logout
    '<div style="padding:12px 10px;border-top:1px solid rgba(255,255,255,0.12);flex-shrink:0">' +
      '<button onclick="logout(' + session.id + ')"' +
      ' style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;width:100%;border:none;background:none;cursor:pointer;color:rgba(255,255,255,0.45);font-size:13px;font-weight:500;text-align:left;font-family:Barlow,sans-serif;"' +
      ' onmouseover="this.style.background=\'rgba(0,0,0,0.18)\';this.style.color=\'white\'"' +
      ' onmouseout="this.style.background=\'transparent\';this.style.color=\'rgba(255,255,255,0.45)\'">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
        'Cerrar sesión' +
      '</button>' +
    '</div>';

  // Fix main content margin
  var main = document.querySelector('.main');
  if (main) main.style.marginLeft = '220px';
}

async function updateBellBadge(userId) {
  try {
    const count = await getUnreadCount(userId);
    const badge = document.getElementById('bellBadge');
    if (!badge) return;
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.textContent = count > 99 ? '99+' : String(count);
  } catch(e) {}
}

function showToast(message, type, duration) {
  type = type || 'info'; duration = duration || 3500;
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const colors = { success:'#1A9B3C', error:'#E3000F', info:'#003DA5', warn:'#D97706' };
  const icons  = { success:'✓', error:'✕', info:'ℹ', warn:'⚠' };
  const toast = document.createElement('div');
  toast.style.cssText = 'padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;color:white;background:' + (colors[type]||colors.info) + ';display:flex;align-items:center;gap:10px;box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:240px;max-width:380px;font-family:Barlow,sans-serif;';
  toast.innerHTML = '<span style="font-size:16px">' + (icons[type]||'ℹ') + '</span>' + message;
  container.appendChild(toast);
  setTimeout(function(){ toast.remove(); }, duration);
}

function openModal(id) { var el=document.getElementById(id); if(el){el.classList.add('open');document.body.style.overflow='hidden';} }
function closeModal(id){ var el=document.getElementById(id); if(el){el.classList.remove('open');document.body.style.overflow='';} }

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) { e.target.classList.remove('open'); document.body.style.overflow=''; }
});
document.addEventListener('keydown', function(e) {
  if (e.key==='Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(function(el){ el.classList.remove('open'); document.body.style.overflow=''; });
    closeSearch(); closeNotifPanel();
  }
});

var _searchSession = null;
function openSearch(session) {
  _searchSession = session;
  var overlay = document.getElementById('searchOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'searchOverlay';
    overlay.innerHTML = '<div class="search-box"><div class="search-input-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="searchInput" placeholder="Buscar paneles..." autocomplete="off"/><button onclick="closeSearch()" style="border:none;background:none;color:var(--text-muted);cursor:pointer;font-size:18px">✕</button></div><div class="search-results" id="searchResults"><div class="search-empty">Escribe para buscar...</div></div><div class="search-footer"><span>↵ abrir</span><span>ESC cerrar</span></div></div>';
    document.body.appendChild(overlay);
    document.getElementById('searchInput').addEventListener('input', doSearch);
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeSearch(); });
  }
  overlay.classList.add('open');
  setTimeout(function(){ var si=document.getElementById('searchInput'); if(si) si.focus(); }, 50);
}
function closeSearch(){ var o=document.getElementById('searchOverlay'); if(o) o.classList.remove('open'); }
async function doSearch() {
  var q = document.getElementById('searchInput').value.trim().toLowerCase();
  var el = document.getElementById('searchResults');
  if (!el) return;
  if (!q) { el.innerHTML='<div class="search-empty">Escribe para buscar...</div>'; return; }
  var panels = (_searchSession && _searchSession.role!=='admin') ? await getAccessiblePanels(_searchSession.id) : await getPanels();
  var matches = panels.filter(function(p){ return p.title.toLowerCase().includes(q)||(p.description||'').toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q); });
  if (!matches.length) { el.innerHTML='<div class="search-empty">No se encontraron paneles.</div>'; return; }
  el.innerHTML = matches.map(function(p){ return '<div class="search-result-item" onclick="openPanelFromSearch('+p.id+')"><div class="search-result-icon" style="background:'+(p.color||'#E3000F')+'22">'+(p.icon||'📊')+'</div><div><div class="search-result-title">'+p.title+'</div><div class="search-result-sub">'+(p.category||'')+'</div></div></div>'; }).join('');
}
function openPanelFromSearch(id){ closeSearch(); if(typeof openViewer==='function') openViewer(id); }

async function openNotifPanel(session) {
  var panel = document.getElementById('notifPanel');
  if (!panel) { panel=document.createElement('div'); panel.id='notifPanel'; document.body.appendChild(panel); }
  if (panel.classList.contains('open')) { panel.classList.remove('open'); return; }
  var notifs = await getNotifications(session.id);
  await markAllRead(session.id);
  updateBellBadge(session.id);
  var items = !notifs.length ? '<div class="notif-empty">Sin notificaciones</div>' :
    notifs.slice(0,20).map(function(n){ return '<div class="notif-item"><div class="notif-dot" style="background:'+(n.read?'var(--border)':'#E3000F')+'"></div><div><div class="notif-text">'+n.message+'</div><div class="notif-time">'+formatDate(n.ts)+'</div></div></div>'; }).join('');
  panel.innerHTML = '<div class="notif-header"><h4>Notificaciones</h4><button onclick="document.getElementById(\'notifPanel\').classList.remove(\'open\')" style="border:none;background:none;cursor:pointer;font-size:18px;color:var(--text-muted)">✕</button></div><div class="notif-body">'+items+'</div>';
  panel.classList.add('open');
  setTimeout(function(){
    document.addEventListener('click', function h(e){ if(!panel.contains(e.target)){panel.classList.remove('open');document.removeEventListener('click',h);} });
  }, 10);
}
function closeNotifPanel(){ var p=document.getElementById('notifPanel'); if(p) p.classList.remove('open'); }


/* ══════════════════════════════════════════════════
   MOBILE MENU
   ══════════════════════════════════════════════════ */
function toggleMobileMenu() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  
  var isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileMenu() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close menu when clicking a link
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.sidebar a').forEach(function(link) {
    link.addEventListener('click', closeMobileMenu);
  });
  
  // Close on overlay click
  var overlay = document.getElementById('sidebarOverlay');
  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
  }
});


window.toggleTheme=toggleTheme; window.renderSidebar=renderSidebar; window.updateBellBadge=updateBellBadge;
window.showToast=showToast; window.openModal=openModal; window.closeModal=closeModal;
window.openSearch=openSearch; window.closeSearch=closeSearch;
window.openNotifPanel=openNotifPanel; window.closeNotifPanel=closeNotifPanel;
