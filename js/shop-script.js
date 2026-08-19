// Drawer Toggle Script
      const drawer = document.getElementById('category-drawer');
      const openBtn = document.getElementById('mobile-drawer-toggle');
      const bottomOpenBtn = document.getElementById('bottom-bar-categories');
      const closeBtn = document.getElementById('close-drawer-btn');
      const backdrop = document.getElementById('drawer-backdrop');

      function openDrawer() {
        drawer.classList.remove('pointer-events-none', 'opacity-0');
        drawer.classList.add('opacity-100');
        drawer.querySelector('.max-w-sm').classList.remove('translate-x-full');
      }

      function closeDrawer() {
        drawer.classList.add('pointer-events-none', 'opacity-0');
        drawer.classList.remove('opacity-100');
        drawer.querySelector('.max-w-sm').classList.add('translate-x-full');
      }

      if (openBtn) openBtn.addEventListener('click', openDrawer);
      if (bottomOpenBtn) bottomOpenBtn.addEventListener('click', openDrawer);
      if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
      if (backdrop) backdrop.addEventListener('click', closeDrawer);

      // Close drawer when a category link is clicked
drawer.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', closeDrawer);
});