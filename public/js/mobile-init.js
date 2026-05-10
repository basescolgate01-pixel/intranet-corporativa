/* Mobile menu initialization - inject hamburger button */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var topbar = document.querySelector('.topbar');
    if (!topbar) return;

    // Create sidebar overlay
    var overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);

    // Create hamburger button
    var hamburger = document.createElement('button');
    hamburger.className = 'topbar-hamburger';
    hamburger.innerHTML = '☰';
    hamburger.onclick = function() { toggleMobileMenu(); };

    // Insert at start of topbar
    topbar.insertBefore(hamburger, topbar.firstChild);

    // Make sidebar responsive
    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.position = 'fixed';
      sidebar.style.transition = 'transform 0.3s ease';
      sidebar.style.transform = 'translateX(-100%)';
    }

    // Show hamburger on mobile
    function updateMobileMenu() {
      var width = window.innerWidth;
      hamburger.style.display = width <= 768 ? 'flex' : 'none';
      if (width > 768) {
        closeMobileMenu();
        if (sidebar) sidebar.style.transform = 'translateX(0)';
      }
    }

    updateMobileMenu();
    window.addEventListener('resize', updateMobileMenu);
  });
})();
