/* ═══════════════════════════════════════════════════
   logo.js — Renders the corporate logo in sidebar
   ═══════════════════════════════════════════════════ */

function renderLogo(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="sidebar-logo-text">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:28px;height:28px;flex-shrink:0">
        <rect width="32" height="32" rx="7" fill="#E3000F"/>
        <path d="M8 10 L16 6 L24 10 L24 22 L16 26 L8 22 Z" fill="none" stroke="white" stroke-width="1.5"/>
        <path d="M16 6 L16 26" stroke="white" stroke-width="1.5" opacity="0.5"/>
        <path d="M8 10 L24 10" stroke="white" stroke-width="1.5" opacity="0.5"/>
        <path d="M8 16 L24 16" stroke="white" stroke-width="1.5" opacity="0.5"/>
        <path d="M8 22 L24 22" stroke="white" stroke-width="1.5" opacity="0.5"/>
      </svg>
      Intranet
      <span class="logo-dot"></span>
    </div>
  `;
}

window.renderLogo = renderLogo;
