/* ui.js — Colgate Intranet */

(function(){ if(localStorage.getItem('intranet_theme')==='dark') document.body.classList.add('dark'); })();
function toggleTheme(){ const d=document.body.classList.toggle('dark'); localStorage.setItem('intranet_theme',d?'dark':'light'); }

/* ══════════════════════════════════════════════════════════════
   SIDEBAR DINÁMICO
   — Si el usuario es admin: carga todos los ítems de la API
   — Si es user: carga sólo los ítems asignados a él
   ══════════════════════════════════════════════════════════════ */

/* SVGs por nombre de ícono (feather-style) */
var ICONS = {
  grid:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
  activity:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  users:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  lock:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  'file-text':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  menu:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  settings:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  home:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  chart:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  folder:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  star:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  default:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  chevron:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>',
  chevron_down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>',
};

function getIcon(name) {
  return ICONS[name] || ICONS['default'];
}

/* Estado de submenús abiertos */
var _expandedMenus = {};

function toggleSubmenu(id) {
  _expandedMenus[id] = !_expandedMenus[id];
  var submenu = document.getElementById('submenu_' + id);
  var arrow   = document.getElementById('arrow_' + id);
  if (!submenu) return;
  if (_expandedMenus[id]) {
    submenu.style.maxHeight = submenu.scrollHeight + 'px';
    submenu.style.opacity   = '1';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  } else {
    submenu.style.maxHeight = '0';
    submenu.style.opacity   = '0';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }
}

/* Renderizar un ítem del sidebar (y sus hijos recursivamente) */
function renderSidebarMenuNode(node, activePage, depth) {
  depth = depth || 0;
  var hasChildren = node.children && node.children.length > 0;
  var normalizedPath = node.path.startsWith('/') ? node.path : '/' + node.path;
  var isActive    = window.location.pathname.endsWith(normalizedPath) || activePage === normalizedPath;
  var indent      = depth * 12;

  var bg     = isActive ? 'rgba(255,255,255,0.15)'  : 'transparent';
  var color  = isActive ? 'white'                    : 'rgba(255,255,255,0.7)';
  var fw     = isActive ? '700'                      : '600';
  var indicator = isActive ? '<span style="width:3px;height:20px;background:white;border-radius:2px;margin-left:auto;flex-shrink:0"></span>' : '';

  var iconSvg = '<span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:inherit;opacity:' + (isActive ? '1' : '0.85') + '">' + getIcon(node.icon) + '</span>';

  var html = '';

  if (hasChildren) {
    html +=
      '<div>' +
        '<div style="display:flex;align-items:center;gap:0;padding-left:' + indent + 'px">' +
          '<a href="' + normalizedPath + '"' +
          ' style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;flex:1;' +
          'color:' + color + ';background:' + bg + ';font-size:12px;font-weight:' + fw + ';' +
          'text-decoration:none;font-family:Barlow,sans-serif;transition:all 0.15s ease;"' +
          ' onmouseover="if(this.parentElement.style.backgroundColor!==\'rgba(255, 255, 255, 0.15)\'){this.style.background=\'rgba(255,255,255,0.12)\';this.style.color=\'white\';}"' +
          ' onmouseout="if(this.parentElement.style.backgroundColor!==\'rgba(255, 255, 255, 0.15)\'){this.style.background=\'transparent\';this.style.color=\'rgba(255,255,255,0.7)\'}">' +
          iconSvg +
          '<span style="flex:1;font-size:12px;line-height:1.2">' + node.label + '</span>' +
          indicator +
          '</a>' +
          '<button onclick="toggleSubmenu(' + node.id + ')"' +
          ' id="arrow_' + node.id + '"' +
          ' style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.35);padding:6px 6px;' +
          'border-radius:6px;display:flex;align-items:center;transition:all 0.15s ease;flex-shrink:0"' +
          ' onmouseover="this.style.color=\'rgba(255,255,255,0.9)\'"' +
          ' onmouseout="this.style.color=\'rgba(255,255,255,0.35)\'">' +
          '<span style="width:14px;height:14px;display:flex;transition:transform 0.2s">' + getIcon('chevron') + '</span>' +
          '</button>' +
        '</div>' +
        '<div id="submenu_' + node.id + '"' +
        ' style="max-height:0;overflow:hidden;opacity:0;transition:max-height 0.25s ease,opacity 0.2s ease;">' +
          '<div style="margin-left:' + (indent + 20) + 'px;border-left:1.5px solid rgba(255,255,255,0.12);padding-left:10px;padding-top:2px;padding-bottom:2px">' +
            node.children.map(function(child){ return renderSidebarMenuNode(child, activePage, depth + 1); }).join('') +
          '</div>' +
        '</div>' +
      '</div>';
  } else {
    html +=
      '<a href="' + normalizedPath + '"' +
      ' style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;margin-bottom:2px;' +
      'color:' + color + ';background:' + bg + ';font-size:12px;font-weight:' + fw + ';' +
      'text-decoration:none;white-space:nowrap;font-family:Barlow,sans-serif;transition:all 0.15s ease;' +
      'padding-left:' + (10 + indent) + 'px;"' +
      ' onmouseover="if(this.style.backgroundColor!==\'rgba(255, 255, 255, 0.15)\'){this.style.background=\'rgba(255,255,255,0.12)\';this.style.color=\'white\'}"' +
      ' onmouseout="if(this.style.backgroundColor!==\'rgba(255, 255, 255, 0.15)\'){this.style.background=\'transparent\';this.style.color=\'rgba(255,255,255,0.7)\'}">' +
      iconSvg +
      '<span style="flex:1;font-size:12px;line-height:1.2">' + node.label + '</span>' +
      indicator +
      '</a>';
  }

  return html;
}

/* Función principal: renderiza el sidebar con menús dinámicos de la API */
// Helper: Get avatar color based on ID
function avatarColor(id) {
  const colors = ['#E3000F', '#003DA5', '#1A9B3C', '#F59E0B', '#8B5CF6', '#EC4899'];
  return colors[id % colors.length];
}

// Helper: Make initials from name
function makeInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// Helper: Format date/time
function formatDate(ts) {
  if (!ts) return 'N/A';
  const date = new Date(ts);
  return date.toLocaleDateString('es-ES');
}

async function renderSidebar(session, activePage) {
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  var isAdmin = session.role === 'admin';

  /* Menú estático */
  var flatItems = [
    { id:1, label:'Mis Paneles', icon:'grid',       path:'/pages/panels.html',      parentId:null, orderIndex:1, isActive:true },
    { id:2, label:'Dashboard',   icon:'activity',   path:'/pages/dashboard.html',   parentId:null, orderIndex:2, isActive:true, adminOnly:true },
    { id:3, label:'Usuarios',    icon:'users',      path:'/pages/users.html',       parentId:null, orderIndex:3, isActive:true, adminOnly:true },
    { id:4, label:'Permisos',    icon:'lock',       path:'/pages/permissions.html', parentId:null, orderIndex:4, isActive:true, adminOnly:true },
    { id:5, label:'Registro',    icon:'file-text',  path:'/pages/logs.html',        parentId:null, orderIndex:5, isActive:true, adminOnly:true },
    { id:6, label:'Analytics',   icon:'chart',      path:'/pages/admin-analytics.html', parentId:null, orderIndex:6, isActive:true, adminOnly:true },
  ].filter(function(n){ return !n.adminOnly || isAdmin; });

  /* Construir árbol */
  var tree = buildMenuTree(flatItems);

  /* Avatar */
  var avatarBg = session.profilePhoto ? 'transparent' : avatarColor(session.id);
  var avatarContent = session.profilePhoto
    ? '<img src="' + session.profilePhoto + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
    : '<span style="font-size:12px;font-weight:700;color:white">' + (session.avatar || makeInitials(session.name)) + '</span>';

  var linksHtml = tree.map(function(node){ return renderSidebarMenuNode(node, activePage, 0); }).join('');

  /* Ítems exclusivos del admin que siempre aparecen al final */
  if (isAdmin) {
    linksHtml +=
      '<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,0.15);padding-top:10px;padding-bottom:2px">' +
        '<div style="font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:1.4px;color:rgba(255,255,255,0.28);padding:4px 10px 8px 10px">ADMIN</div>' +
        '<a href="/pages/menu-manager.html"' +
        ' style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;margin-bottom:2px;' +
        'color:rgba(255,255,255,0.7);background:transparent;font-size:12px;font-weight:600;' +
        'text-decoration:none;font-family:Barlow,sans-serif;transition:all 0.15s ease;"' +
        ' onmouseover="this.style.background=\'rgba(255,255,255,0.12)\';this.style.color=\'white\'"' +
        ' onmouseout="this.style.background=\'transparent\';this.style.color=\'rgba(255,255,255,0.7)\'">' +
        '<span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:0.85">' + getIcon('menu') + '</span>' +
        '<span style="flex:1;font-size:12px;line-height:1.2">Menús</span>' +
        '</a>' +
      '</div>';
  }

  sidebar.style.cssText =
    'width:160px;min-height:100vh;background:linear-gradient(135deg, #E3000F 0%, #B8000C 100%);' +
    'position:fixed;left:0;top:0;bottom:0;display:flex;flex-direction:column;' +
    'z-index:100;overflow-y:auto;overflow-x:hidden;' +
    'box-shadow:4px 0 25px rgba(0,0,0,0.35);font-family:Barlow,sans-serif;' +
    'scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.3) rgba(255,255,255,0.1);';

  sidebar.innerHTML =
    /* Logo */
    '<div style="padding:24px 16px 18px;border-bottom:1px solid rgba(255,255,255,0.15);flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px">' +
      '<img src="/colgate-logo-transparent.png" alt="Colgate" id="sbLogo"' +
      ' style="height:44px;object-fit:contain;max-width:155px;display:block;"' +
      ' onerror="this.style.display=\'none\';document.getElementById(\'sbLogoFallback\').style.display=\'block\'"/>' +
      '<span id="sbLogoFallback" style="display:none;font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:800;color:white;letter-spacing:0.5px">COLGATE</span>' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:2.5px">Intranet</div>' +
    '</div>' +
    /* Usuario */
    '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;gap:11px;flex-shrink:0;background:rgba(0,0,0,0.12)">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:' + avatarBg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2.5px solid rgba(255,255,255,0.4)">' +
        avatarContent +
      '</div>' +
      '<div style="min-width:0;flex:1">' +
        '<div style="font-size:13px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2">' + session.name + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.6);font-weight:600;text-transform:uppercase;letter-spacing:0.4px">' + (isAdmin ? 'Administrador' : 'Usuario') + '</div>' +
      '</div>' +
    '</div>' +
    /* Nav */
    '<nav style="padding:14px 8px;flex:1;display:flex;flex-direction:column;gap:3px;overflow-y:auto;overflow-x:hidden;scrollbar-width:auto;scrollbar-color:rgba(255,255,255,0.3) rgba(255,255,255,0.1)">' +
      '<div style="font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:1.4px;color:rgba(255,255,255,0.28);padding:8px 10px 12px;margin-bottom:2px;position:sticky;top:0;background:linear-gradient(135deg, #E3000F 0%, #B8000C 100%);z-index:1">MENÚ</div>' +
      linksHtml +
    '</nav>' +
    /* Logout */
    '<div style="padding:12px 8px;border-top:1px solid rgba(255,255,255,0.15);flex-shrink:0">' +
      '<button onclick="logout(' + session.id + ')"' +
      ' style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;width:100%;border:none;background:rgba(0,0,0,0.1);cursor:pointer;color:rgba(255,255,255,0.65);font-size:12px;font-weight:600;text-align:left;font-family:Barlow,sans-serif;transition:all 0.15s ease;"' +
      ' onmouseover="this.style.background=\'rgba(0,0,0,0.25)\';this.style.color=\'white\'"' +
      ' onmouseout="this.style.background=\'rgba(0,0,0,0.1)\';this.style.color=\'rgba(255,255,255,0.65)\'">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:18px;height:18px;flex-shrink:0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
        '<span>Cerrar</span>' +
      '</button>' +
    '</div>';

  /* Fix main content margin */
  var main = document.querySelector('.main');
  if (main) main.style.marginLeft = '160px';
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
  el.innerHTML = matches.map(function(p){ return '<div class="search-result-item" onclick="openPanelFromSearch('+p.id+')\"><div class="search-result-icon" style="background:'+(p.color||'#E3000F')+'22">'+(p.icon||'📊')+'</div><div><div class="search-result-title">'+p.title+'</div><div class="search-result-sub">'+(p.category||'')+'</div></div></div>'; }).join('');
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
   MOBILE MENU & SIDEBAR TOGGLE
   ══════════════════════════════════════════════════ */
function toggleMobileMenu() {
  var sidebar = document.getElementById('sidebar');
  var main = document.querySelector('.main');
  var overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;

  // En desktop: toggle collapsed state
  var isDesktop = window.innerWidth > 768;
  if (isDesktop) {
    var isCollapsed = sidebar.classList.contains('collapsed');
    if (isCollapsed) {
      sidebar.classList.remove('collapsed');
      if (main) main.classList.remove('sidebar-collapsed');
    } else {
      sidebar.classList.add('collapsed');
      if (main) main.classList.add('sidebar-collapsed');
    }
  } else {
    // En mobile: toggle open state
    if (!overlay) return;
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
}
function closeMobileMenu() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.sidebar a').forEach(function(link) {
    link.addEventListener('click', closeMobileMenu);
  });
  var overlay = document.getElementById('sidebarOverlay');
  if (overlay) { overlay.addEventListener('click', closeMobileMenu); }
});

window.toggleTheme=toggleTheme; window.renderSidebar=renderSidebar; window.toggleSubmenu=toggleSubmenu;
window.updateBellBadge=updateBellBadge;
window.showToast=showToast; window.openModal=openModal; window.closeModal=closeModal;
window.openSearch=openSearch; window.closeSearch=closeSearch;
window.openNotifPanel=openNotifPanel; window.closeNotifPanel=closeNotifPanel;
