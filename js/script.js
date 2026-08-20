(function () {
  "use strict";


  // 1. ACCESSIBILITY & MAIN SITE NAVIGATION

  const statusEl = document.getElementById("a11y-status");
  function announce(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  // Main Site Mobile Navigation Toggle (Home Page)
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("hidden");
      navToggle.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.add("hidden");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Text Size Adjuster 
  const sizes = [87.5, 100, 112.5, 125, 137.5];
  let sizeIndex = 1;
  function applySize() {
    document.documentElement.style.fontSize = sizes[sizeIndex] + "%";
    announce("Text size set to " + sizes[sizeIndex] + " percent.");
  }
  document.getElementById("font-inc")?.addEventListener("click", function () {
    sizeIndex = Math.min(sizeIndex + 1, sizes.length - 1);
    applySize();
  });
  document.getElementById("font-dec")?.addEventListener("click", function () {
    sizeIndex = Math.max(sizeIndex - 1, 0);
    applySize();
  });
  document.getElementById("font-reset")?.addEventListener("click", function () {
    sizeIndex = 1;
    applySize();
  });

  // High Contrast Toggle 
  const contrastBtn = document.getElementById("contrast-toggle");
  contrastBtn?.addEventListener("click", function () {
    const on = document.documentElement.classList.toggle("high-contrast");
    contrastBtn.setAttribute("aria-pressed", on ? "true" : "false");
    announce(on ? "High contrast mode on." : "High contrast mode off.");
  });

  // Text-to-Speech / Read Aloud

  const synth = window.speechSynthesis;
  const speedSelect = document.getElementById("speed-select");
  let currentBtn = null;
  const supported = "speechSynthesis" in window;

  if (!supported) {
    document.querySelectorAll(".listen-btn, #read-page-btn").forEach(function (b) {
      b.style.display = "none";
    });
  }

  function resetButton(btn) {
    btn.setAttribute("aria-pressed", "false");
    
    // Find ALL labels (desktop and mobile) inside the button
    btn.querySelectorAll(".btn-label").forEach(label => {
      // Restore the exact original text, or default to "Listen"
      if (label.dataset.originalText) {
        label.textContent = label.dataset.originalText;
      } else {
        label.textContent = btn.dataset.defaultLabel || "Listen";
      }
    });
  }

  function getReadableText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".no-read, script, style").forEach(function (n) {
      n.remove();
    });
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function toggleSpeech(text, btn) {
    if (!supported) return;
    if (btn.getAttribute("aria-pressed") === "true") {
      synth.cancel();
      resetButton(btn);
      currentBtn = null;
      announce("Reading stopped.");
      return;
    }
    synth.cancel();
    if (currentBtn) resetButton(currentBtn);

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = parseFloat(speedSelect?.value || "1");
    utter.onend = function () {
      resetButton(btn);
      currentBtn = null;
    };
    utter.onerror = function () {
      resetButton(btn);
      currentBtn = null;
    };

    synth.speak(utter);
    btn.setAttribute("aria-pressed", "true");

    // Update ALL labels when reading starts
    btn.querySelectorAll(".btn-label").forEach(label => {
      // Memorize the original text before overwriting it!
      if (!label.dataset.originalText) {
        label.dataset.originalText = label.textContent;
      }
      
      // Give the mobile button a short text, and desktop a long text
      if (label.classList.contains("sm:hidden")) {
        label.textContent = "Stop"; // Mobile view
      } else {
        label.textContent = "Stop reading"; // Desktop view
      }
    });

    currentBtn = btn;
    announce("Reading started.");
  }

  document.querySelectorAll(".listen-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const section = document.getElementById(btn.dataset.target);
      if (section) toggleSpeech(getReadableText(section), btn);
    });
  });

  const readPageBtn = document.getElementById("read-page-btn");
  readPageBtn?.addEventListener("click", function () {
    const main = document.getElementById("main");
    if (main) toggleSpeech(getReadableText(main), readPageBtn);
  });


  // 2. MAIN SITE ANIMATIONS

  
  // Impact Page Animation 
  const counters = document.querySelectorAll('.counter');
  if (counters.length > 0 && 'IntersectionObserver' in window) {
    const animationDuration = 1500; 
    const animateCounters = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = +counter.getAttribute('data-target');
          let startTime = null;

          const step = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / animationDuration, 1);
            const easeProgress = progress < 0.5 
              ? 8 * progress * progress * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 4) / 2;
            
            const currentCount = Math.floor(easeProgress * target);
            counter.innerText = currentCount.toLocaleString();

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              counter.innerText = target.toLocaleString(); 
            }
          };
          window.requestAnimationFrame(step);
          observer.unobserve(counter);
        }
      });
    };
    const observer = new IntersectionObserver(animateCounters, { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));
  }

  // Project Before and After Animation 
  const bnaCards = document.querySelectorAll('.bna-card');
  if (bnaCards.length > 0 && 'IntersectionObserver' in window) {
    const bnaObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const card = entry.target;
        const wrapper = card.querySelector('.bna-slides-wrapper');
        const pill = card.querySelector('.bna-pill');

        if (!wrapper || !pill) return; 

        const label1 = card.getAttribute('data-label-1') || 'Before';
        const label2 = card.getAttribute('data-label-2') || 'After';

        if (entry.isIntersecting) {
          if (!card.dataset.intervalId) {
            card.dataset.isAfter = "false"; 
            
            const intervalId = setInterval(() => {
              let isAfter = card.dataset.isAfter === "true";
              isAfter = !isAfter; 
              card.dataset.isAfter = isAfter;

              if (isAfter) {
                wrapper.classList.remove('translate-x-0');
                wrapper.classList.add('-translate-x-full');
                pill.textContent = label2;
                pill.classList.replace('bg-black/70', 'bg-teal-700');
              } else {
                wrapper.classList.remove('-translate-x-full');
                wrapper.classList.add('translate-x-0');
                pill.textContent = label1;
                pill.classList.replace('bg-teal-700', 'bg-black/70');
              }
            }, 4000); 
            
            card.dataset.intervalId = intervalId; 
          }
        } else {
          if (card.dataset.intervalId) {
            clearInterval(card.dataset.intervalId);
            card.dataset.intervalId = "";
            card.dataset.isAfter = "false";
            wrapper.classList.remove('-translate-x-full');
            wrapper.classList.add('translate-x-0');
            pill.textContent = label1;
            pill.classList.replace('bg-teal-700', 'bg-black/70');
          }
        }
      });
    }, { threshold: 0.5 }); 
    bnaCards.forEach(card => bnaObserver.observe(card));
  }

  // Auto-clone and auto-speed the gallery track
  const galleryContainer = document.getElementById('gallery-container');
  const marqueeTrack = galleryContainer ? galleryContainer.querySelector('.marquee-track') : null;
  if (galleryContainer && marqueeTrack) {
    const itemCount = marqueeTrack.children.length;
    const secondsPerItem = 8; 
    const totalDuration = itemCount * secondsPerItem;

    marqueeTrack.style.animationDuration = `${totalDuration}s`;
    
    const clone = marqueeTrack.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true'); 
    clone.style.animationDuration = `${totalDuration}s`;
    
    galleryContainer.appendChild(clone);
  }


  // 3. SHOP SPECIFIC - Mobile Drawer Toggle
 
  const shopDrawer = document.getElementById('category-drawer');
  const openDrawerBtn = document.getElementById('mobile-drawer-toggle');
  const bottomOpenDrawerBtn = document.getElementById('bottom-bar-categories');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  if (shopDrawer) {
    function openShopDrawer() {
      shopDrawer.classList.remove('pointer-events-none', 'opacity-0');
      shopDrawer.classList.add('opacity-100');
      const maxW = shopDrawer.querySelector('.max-w-sm');
      if (maxW) maxW.classList.remove('translate-x-full');
    }

    function closeShopDrawer() {
      shopDrawer.classList.add('pointer-events-none', 'opacity-0');
      shopDrawer.classList.remove('opacity-100');
      const maxW = shopDrawer.querySelector('.max-w-sm');
      if (maxW) maxW.classList.add('translate-x-full');
    }

    if (openDrawerBtn) openDrawerBtn.addEventListener('click', openShopDrawer);
    if (bottomOpenDrawerBtn) bottomOpenDrawerBtn.addEventListener('click', openShopDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeShopDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeShopDrawer);

    // Close drawer when a category link is clicked
    shopDrawer.querySelectorAll('a[href^="?"]').forEach(link => {
      link.addEventListener('click', closeShopDrawer);
    });
  }

})();