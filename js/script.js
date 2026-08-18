(function () {
  "use strict";

  const statusEl = document.getElementById("a11y-status");
  function announce(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  // Mobile Navigation Toggle
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

  //  Text-to-Speech (Read Aloud) 
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
    const label = btn.querySelector(".btn-label");
    if (label) label.textContent = btn.dataset.defaultLabel || "Listen";
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
    const label = btn.querySelector(".btn-label");
    if (label) label.textContent = "Stop reading";
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
})();
// impact page animation 
document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll('.counter');
  const animationDuration = 1500; // Animation length in milliseconds (1.5 seconds)

  const animateCounters = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = +counter.getAttribute('data-target');
        let startTime = null;

        const step = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const progress = Math.min((currentTime - startTime) / animationDuration, 1);
          
          // Smooth ease-in-out easing formula
          const easeProgress = progress < 0.5 
            ? 8 * progress * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 4) / 2;
          
          const currentCount = Math.floor(easeProgress * target);
          
          // Formats numbers with commas automatically
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

  // Triggers when 50% of the section is visible on screen
  const observer = new IntersectionObserver(animateCounters, { threshold: 0.5 });
  counters.forEach(counter => observer.observe(counter));
});

// project before and after animation 
document.addEventListener('DOMContentLoaded', () => {
    // 1. Find every sliding card on the page
    const bnaCards = document.querySelectorAll('.bna-card');

    // 2. Set up the Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const card = entry.target;
            const wrapper = card.querySelector('.bna-slides-wrapper');
            const pill = card.querySelector('.bna-pill');

            if (!wrapper || !pill) return; // Safety check

            // Read the exact labels from the HTML (Fallback to Before/After)
            const label1 = card.getAttribute('data-label-1') || 'Before';
            const label2 = card.getAttribute('data-label-2') || 'After';

            if (entry.isIntersecting) {
                // Start animation interval if not already running
                if (!card.dataset.intervalId) {
                    card.dataset.isAfter = "false"; // Initialize state
                    
                    const intervalId = setInterval(() => {
                        let isAfter = card.dataset.isAfter === "true";
                        isAfter = !isAfter; // Toggle state
                        card.dataset.isAfter = isAfter;

                        if (isAfter) {
                            // Slide left to Image 2
                            wrapper.classList.remove('translate-x-0');
                            wrapper.classList.add('-translate-x-full');
                            pill.textContent = label2;
                            pill.classList.replace('bg-black/70', 'bg-teal-700');
                        } else {
                            // Slide right to Image 1
                            wrapper.classList.remove('-translate-x-full');
                            wrapper.classList.add('translate-x-0');
                            pill.textContent = label1;
                            pill.classList.replace('bg-teal-700', 'bg-black/70');
                        }
                    }, 4000); // 4 second loop
                    
                    card.dataset.intervalId = intervalId; 
                }
            } else {
                // Pause animation when scrolled out of view to save battery
                if (card.dataset.intervalId) {
                    clearInterval(card.dataset.intervalId);
                    card.dataset.intervalId = "";
                    
                    // Reset the card back to Image 1 so it looks clean when they scroll back
                    card.dataset.isAfter = "false";
                    wrapper.classList.remove('-translate-x-full');
                    wrapper.classList.add('translate-x-0');
                    pill.textContent = label1;
                    pill.classList.replace('bg-teal-700', 'bg-black/70');
                }
            }
        });
    }, { threshold: 0.5 }); // Triggers when 50% of the card is visible

    // 3. Attach observer to all cards
    bnaCards.forEach(card => observer.observe(card));
});

document.addEventListener('DOMContentLoaded', () => {
    // Auto-clone and auto-speed the gallery track
    const galleryContainer = document.getElementById('gallery-container');
    const marqueeTrack = galleryContainer ? galleryContainer.querySelector('.marquee-track') : null;

    if (galleryContainer && marqueeTrack) {
        // 1. Count the tiles and calculate the time
        const itemCount = marqueeTrack.children.length;
        const secondsPerItem = 8; // <-- TWEAK THIS: 8 seconds per image is usually the sweet spot!
        const totalDuration = itemCount * secondsPerItem;

        // 2. Apply the dynamic speed to the original track
        marqueeTrack.style.animationDuration = `${totalDuration}s`;

        // 3. Clone the track for the infinite loop
        const clone = marqueeTrack.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true'); // Hide from screen readers
        
        // 4. Apply the exact same speed to the cloned track
        clone.style.animationDuration = `${totalDuration}s`;

        // 5. Add it to the page
        galleryContainer.appendChild(clone);
    }
});