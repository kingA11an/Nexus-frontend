(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  var statusEl = document.getElementById("a11y-status");

  // Polite live-region announcement. The region is cleared first so that
  // repeating the same message (for example "Text size set to 100 percent")
  // is still read out.
  function announce(msg) {
    if (!statusEl) return;
    statusEl.textContent = "";
    window.setTimeout(function () {
      statusEl.textContent = msg;
    }, 50);
  }

  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {
      /* storage can be blocked; preferences just won't persist */
    }
  }

  function recall(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Accessibility toolbar
  // ---------------------------------------------------------------------------

  // Text size: the whole site is sized in rem, so changing the root font size
  // scales everything. The choice is remembered between pages and visits
  // (an inline snippet in <head> applies it before first paint).
  var SIZES = [87.5, 100, 112.5, 125, 137.5];
  var sizeIndex = 1;
  var savedSize = parseFloat(recall("snrh-text-size"));
  if (SIZES.indexOf(savedSize) > -1) sizeIndex = SIZES.indexOf(savedSize);

  function applySize(message) {
    document.documentElement.style.fontSize = SIZES[sizeIndex] + "%";
    store("snrh-text-size", sizeIndex === 1 ? null : String(SIZES[sizeIndex]));
    announce(message || "Text size set to " + SIZES[sizeIndex] + " percent.");
  }

  var fontInc = document.getElementById("font-inc");
  var fontDec = document.getElementById("font-dec");
  var fontReset = document.getElementById("font-reset");

  if (fontInc) {
    fontInc.addEventListener("click", function () {
      if (sizeIndex === SIZES.length - 1) return announce("Largest text size reached.");
      sizeIndex += 1;
      applySize();
    });
  }
  if (fontDec) {
    fontDec.addEventListener("click", function () {
      if (sizeIndex === 0) return announce("Smallest text size reached.");
      sizeIndex -= 1;
      applySize();
    });
  }
  if (fontReset) {
    fontReset.addEventListener("click", function () {
      sizeIndex = 1;
      applySize("Text size reset to default.");
    });
  }

  // High contrast: state is remembered the same way.
  var contrastBtn = document.getElementById("contrast-toggle");
  if (contrastBtn) {
    contrastBtn.setAttribute(
      "aria-pressed",
      document.documentElement.classList.contains("high-contrast") ? "true" : "false"
    );
    contrastBtn.addEventListener("click", function () {
      var on = document.documentElement.classList.toggle("high-contrast");
      contrastBtn.setAttribute("aria-pressed", on ? "true" : "false");
      store("snrh-contrast", on ? "1" : null);
      announce(on ? "High contrast mode on." : "High contrast mode off.");
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Read aloud
  //
  // Long utterances are cut off by Chrome after roughly fifteen seconds, so
  // the text is spoken as a queue of sentence-sized chunks. A session number
  // makes sure late "end" and "error" events from a cancelled utterance can
  // never reset the button of the one that replaced it.
  //
  // These buttons change their label while reading ("Stop reading"), so they
  // deliberately do not use aria-pressed. A toggle must not do both.
  // ---------------------------------------------------------------------------

  var supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var synth = supported ? window.speechSynthesis : null;
  var speedSelect = document.getElementById("speed-select");
  var activeBtn = null;
  var session = 0;

  if (!supported) {
    document.querySelectorAll(".listen-btn, #read-page-btn").forEach(function (b) {
      b.style.display = "none";
    });
  }

  function setSpeaking(btn, speaking) {
    btn.dataset.speaking = speaking ? "true" : "false";
    btn.querySelectorAll(".btn-label").forEach(function (label) {
      if (speaking) {
        if (!label.dataset.originalText) label.dataset.originalText = label.textContent;
        label.textContent = label.dataset.stopLabel || "Stop reading";
      } else if (label.dataset.originalText) {
        label.textContent = label.dataset.originalText;
      }
    });
  }

  function getReadableText(el) {
    var clone = el.cloneNode(true);
    // Skip controls, decorative and duplicated (aria-hidden) content such as
    // the cloned gallery track, which would otherwise be read twice.
    clone.querySelectorAll('.no-read, [aria-hidden="true"], script, style').forEach(function (n) {
      n.remove();
    });
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function splitIntoChunks(text, max) {
    var sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
    var chunks = [];
    var current = "";

    function pushLongSentence(sentence) {
      while (sentence.length > max) {
        var cut = sentence.lastIndexOf(" ", max);
        if (cut < 1) cut = max;
        chunks.push(sentence.slice(0, cut).trim());
        sentence = sentence.slice(cut);
      }
      return sentence;
    }

    sentences.forEach(function (sentence) {
      if (sentence.length > max) {
        if (current.trim()) chunks.push(current.trim());
        current = pushLongSentence(sentence);
      } else if ((current + sentence).length > max) {
        if (current.trim()) chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    });
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  function stopSpeech(message) {
    if (!supported) return;
    session += 1;
    synth.cancel();
    if (activeBtn) setSpeaking(activeBtn, false);
    activeBtn = null;
    if (message) announce(message);
  }

  function speak(text, btn) {
    if (!supported) return;
    if (btn.dataset.speaking === "true") return stopSpeech("Reading stopped.");

    stopSpeech();
    var chunks = splitIntoChunks(text, 200);
    if (!chunks.length) return;

    var mySession = session;
    var index = 0;
    activeBtn = btn;
    setSpeaking(btn, true);
    announce("Reading started.");

    function next() {
      if (mySession !== session) return;
      if (index >= chunks.length) {
        setSpeaking(btn, false);
        activeBtn = null;
        return;
      }
      var utter = new SpeechSynthesisUtterance(chunks[index++]);
      // Read the speed on every chunk so changing it mid-reading takes effect
      utter.rate = parseFloat((speedSelect && speedSelect.value) || "1");
      utter.onend = next;
      utter.onerror = function () {
        if (mySession !== session) return;
        stopSpeech();
      };
      synth.speak(utter);
    }
    next();
  }

  document.querySelectorAll(".listen-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var section = document.getElementById(btn.dataset.target);
      if (section) speak(getReadableText(section), btn);
    });
  });

  var readPageBtn = document.getElementById("read-page-btn");
  if (readPageBtn) {
    readPageBtn.addEventListener("click", function () {
      var main = document.getElementById("main");
      if (main) speak(getReadableText(main), readPageBtn);
    });
  }

  // Browsers keep speaking after navigation unless told to stop
  window.addEventListener("pagehide", function () {
    if (supported) synth.cancel();
  });

  // ---------------------------------------------------------------------------
  // 3. Home page: mobile navigation (disclosure pattern)
  // ---------------------------------------------------------------------------

  var navToggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("primary-nav");

  if (navToggle && nav) {
    var navOpen = function () {
      return navToggle.getAttribute("aria-expanded") === "true";
    };
    var setNav = function (open, returnFocus) {
      nav.classList.toggle("hidden", !open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open && returnFocus) navToggle.focus();
    };

    navToggle.addEventListener("click", function () {
      setNav(!navOpen());
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNav(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navOpen() && window.getComputedStyle(navToggle).display !== "none") {
        setNav(false, true);
      }
    });
    document.addEventListener("click", function (e) {
      if (navOpen() && !nav.contains(e.target) && !navToggle.contains(e.target)) setNav(false);
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Impact counters
  // Markup holds the real number (correct without JavaScript). When the count-up
  // will run, it is reset to 0 first; with reduced motion the final value stays.
  // ---------------------------------------------------------------------------

  var counters = document.querySelectorAll(".counter");
  if (counters.length) {
    var formatNumber = function (n) {
      return n.toLocaleString();
    };

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      counters.forEach(function (c) {
        c.textContent = formatNumber(+c.getAttribute("data-target"));
      });
    } else {
      var DURATION = 1500;
      var counterObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var counter = entry.target;
            var target = +counter.getAttribute("data-target");
            var start = null;

            var step = function (now) {
              if (!start) start = now;
              var progress = Math.min((now - start) / DURATION, 1);
              var eased =
                progress < 0.5
                  ? 8 * Math.pow(progress, 4)
                  : 1 - Math.pow(-2 * progress + 2, 4) / 2;
              counter.textContent = formatNumber(progress < 1 ? Math.floor(eased * target) : target);
              if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
            observer.unobserve(counter);
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (c) {
        c.textContent = "0";
        counterObserver.observe(c);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Project before / after sliders
  //
  // Auto-advancing content that lasts more than five seconds needs a way to be
  // paused (WCAG 2.2.2). Each slider therefore pauses on hover and keyboard
  // focus, has its own pause button, and never auto-advances when the visitor
  // prefers reduced motion (the button then switches photos by hand).
  // ---------------------------------------------------------------------------

  var sliders = [];

  document.querySelectorAll(".bna-card").forEach(function (card) {
    var wrapper = card.querySelector(".bna-slides-wrapper");
    var pill = card.querySelector(".bna-pill");
    if (!wrapper || !pill) return;

    var state = {
      card: card,
      wrapper: wrapper,
      pill: pill,
      button: card.querySelector(".bna-toggle"),
      label1: card.getAttribute("data-label-1") || "Before",
      label2: card.getAttribute("data-label-2") || "After",
      title: (card.querySelector("h4") || {}).textContent || "project",
      showingSecond: false,
      timer: null,
      visible: false,
      hovered: false,
      focused: false,
      userPaused: false,
    };

    state.show = function (second) {
      state.showingSecond = second;
      wrapper.classList.toggle("translate-x-0", !second);
      wrapper.classList.toggle("-translate-x-full", second);
      pill.textContent = second ? state.label2 : state.label1;
      pill.classList.toggle("bg-black/70", !second);
      pill.classList.toggle("bg-teal-700", second);
    };

    state.sync = function () {
      var shouldRun =
        state.visible &&
        !state.userPaused &&
        !state.hovered &&
        !state.focused &&
        !reduceMotion.matches;
      if (shouldRun && !state.timer) {
        state.timer = window.setInterval(function () {
          state.show(!state.showingSecond);
        }, 4000);
      } else if (!shouldRun && state.timer) {
        window.clearInterval(state.timer);
        state.timer = null;
      }
    };

    state.renderButton = function () {
      var btn = state.button;
      if (!btn) return;
      var manual = reduceMotion.matches;
      var playing = !state.userPaused && !manual;
      btn.querySelector(".icon-pause").classList.toggle("hidden", !(playing && !manual));
      btn.querySelector(".icon-play").classList.toggle("hidden", manual || playing);
      btn.querySelector(".icon-next").classList.toggle("hidden", !manual);
      btn.setAttribute(
        "aria-label",
        manual
          ? "Show the other photo: " + state.title
          : (playing ? "Pause slideshow: " : "Play slideshow: ") + state.title
      );
    };

    if (state.button) {
      state.button.addEventListener("click", function () {
        if (reduceMotion.matches) {
          state.show(!state.showingSecond);
          announce("Showing " + (state.showingSecond ? state.label2 : state.label1) + " photo.");
          return;
        }
        state.userPaused = !state.userPaused;
        state.renderButton();
        state.sync();
        announce(state.userPaused ? "Slideshow paused." : "Slideshow playing.");
      });
    }

    card.addEventListener("mouseenter", function () { state.hovered = true; state.sync(); });
    card.addEventListener("mouseleave", function () { state.hovered = false; state.sync(); });
    card.addEventListener("focusin", function () { state.focused = true; state.sync(); });
    card.addEventListener("focusout", function () { state.focused = false; state.sync(); });

    state.renderButton();
    sliders.push(state);
  });

  if (sliders.length) {
    var sliderObserver = null;
    if ("IntersectionObserver" in window) {
      sliderObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var s = sliders.filter(function (x) { return x.card === entry.target; })[0];
            if (!s) return;
            s.visible = entry.isIntersecting;
            if (!s.visible) s.show(false); // reset to the first photo when scrolled away
            s.sync();
          });
        },
        { threshold: 0.5 }
      );
      sliders.forEach(function (s) { sliderObserver.observe(s.card); });
    }

    var onMotionChange = function () {
      sliders.forEach(function (s) {
        if (reduceMotion.matches) s.show(false);
        s.renderButton();
        s.sync();
      });
    };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", onMotionChange);
  }

  // ---------------------------------------------------------------------------
  // 6. Project Highlights marquee
  // The track is cloned for a seamless loop; the clone is hidden from assistive
  // technology and, with reduced motion, from view (see input.css).
  // ---------------------------------------------------------------------------

  var galleryContainer = document.getElementById("gallery-container");
  var marqueeTrack = galleryContainer ? galleryContainer.querySelector(".marquee-track") : null;

  if (galleryContainer && marqueeTrack) {
    var totalDuration = marqueeTrack.children.length * 8;
    marqueeTrack.style.animationDuration = totalDuration + "s";

    var trackClone = marqueeTrack.cloneNode(true);
    trackClone.setAttribute("aria-hidden", "true");
    trackClone.style.animationDuration = totalDuration + "s";
    galleryContainer.appendChild(trackClone);

    var galleryToggle = document.getElementById("gallery-toggle");
    var galleryPaused = false;

    if (galleryToggle) {
      galleryToggle.addEventListener("click", function () {
        galleryPaused = !galleryPaused;
        galleryContainer.querySelectorAll(".marquee-track").forEach(function (track) {
          track.style.animationPlayState = galleryPaused ? "paused" : "";
        });
        galleryToggle.querySelector(".icon-pause").classList.toggle("hidden", galleryPaused);
        galleryToggle.querySelector(".icon-play").classList.toggle("hidden", !galleryPaused);
        galleryToggle.querySelector(".gallery-toggle-label").textContent = galleryPaused
          ? "Play gallery"
          : "Pause gallery";
        announce(galleryPaused ? "Gallery paused." : "Gallery playing.");
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Shop: category drawer (modal dialog)
  //
  // Opening makes the drawer reachable (removes `inert`), moves focus into it,
  // traps Tab, closes on Escape, backdrop click, link click and when the window
  // grows to desktop width, then returns focus to the control that opened it.
  // While it is open the rest of the page is inert for keyboard and screen readers.
  // ---------------------------------------------------------------------------

  var drawer = document.getElementById("category-drawer");

  if (drawer) {
    var panel = document.getElementById("drawer-panel") || drawer.querySelector(".max-w-sm");
    var closeBtn = document.getElementById("close-drawer-btn");
    var backdrop = document.getElementById("drawer-backdrop");
    var openers = [
      document.getElementById("mobile-drawer-toggle"),
      document.getElementById("bottom-bar-categories"),
    ].filter(Boolean);
    var desktopQuery = window.matchMedia("(min-width: 1024px)");
    var drawerOpener = null;
    var inertedByDrawer = [];

    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    var isOpen = function () {
      return !drawer.hasAttribute("inert");
    };

    var setBackgroundInert = function (on) {
      if (on) {
        Array.prototype.forEach.call(document.body.children, function (el) {
          if (el === drawer || el.tagName === "SCRIPT" || el.hasAttribute("inert")) return;
          el.setAttribute("inert", "");
          inertedByDrawer.push(el);
        });
      } else {
        inertedByDrawer.splice(0).forEach(function (el) {
          el.removeAttribute("inert");
        });
      }
    };

    var openDrawer = function (opener) {
      if (isOpen()) return;
      drawerOpener = opener || document.activeElement;
      setBackgroundInert(true);
      drawer.removeAttribute("inert");
      drawer.classList.remove("pointer-events-none", "opacity-0");
      drawer.classList.add("opacity-100");
      if (panel) panel.classList.remove("translate-x-full");
      openers.forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(function () {
        if (closeBtn) closeBtn.focus();
      });
    };

    var closeDrawer = function (returnFocus) {
      if (!isOpen()) return;
      drawer.setAttribute("inert", "");
      drawer.classList.add("pointer-events-none", "opacity-0");
      drawer.classList.remove("opacity-100");
      if (panel) panel.classList.add("translate-x-full");
      setBackgroundInert(false);
      openers.forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
      document.body.style.overflow = "";
      if (returnFocus !== false && drawerOpener && drawerOpener.focus) drawerOpener.focus();
      drawerOpener = null;
    };

    openers.forEach(function (btn) {
      btn.addEventListener("click", function () { openDrawer(btn); });
    });
    if (closeBtn) closeBtn.addEventListener("click", function () { closeDrawer(); });
    if (backdrop) backdrop.addEventListener("click", function () { closeDrawer(); });

    // Any link in the drawer navigates, so close it. Focus is not restored
    // because the page is about to change (or jump to #catalog-grid).
    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeDrawer(false); });
    });

    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab") return;

      var items = Array.prototype.slice.call(drawer.querySelectorAll(FOCUSABLE));
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (!drawer.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    var onResize = function (q) {
      if (q.matches) closeDrawer(false);
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", onResize);
  }
})();
