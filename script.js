/* =========================================================
   Sanjana Soma — Portfolio (Fixed)
   Fixes:
   - Removed buggy "smooth scroll" handler that broke href="#"
   - Added mobile menu toggle (hamburger)
   - Consolidated scroll listeners for better performance
   - Added reveal animations via CSS classes
   - Skill bar animation uses data-progress attributes
   - Footer year auto-updates
   ========================================================= */

(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const navbar = qs("#navbar");
  const navToggle = qs(".nav-toggle");
  const navPanel = qs("#nav-panel");
  const navBackdrop = qs(".nav-backdrop");
  const navLinks = qsa(".nav-link");
  const scrollTopBtn = qs("#scroll-top");

  // ---------------------------
  // Helpers
  // ---------------------------

  function setCssVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  }

  function getNavHeight() {
    return navbar ? navbar.offsetHeight : 76;
  }

  function openMenu() {
    document.body.classList.add("menu-open");
    navToggle?.setAttribute("aria-expanded", "true");

    // Focus first link for keyboard users
    const firstLink = qs(".nav-link", navPanel);
    firstLink?.focus();
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    if (document.body.classList.contains("menu-open")) closeMenu();
    else openMenu();
  }

  // ---------------------------
  // Init: runtime layout vars
  // ---------------------------

  function syncLayoutVars() {
    setCssVar("--nav-h", `${getNavHeight()}px`);
  }

  window.addEventListener("resize", syncLayoutVars);

  // ---------------------------
  // Mobile menu events
  // ---------------------------

  navToggle?.addEventListener("click", toggleMenu);
  navBackdrop?.addEventListener("click", closeMenu);

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
      closeMenu();
      navToggle?.focus();
    }
  });

  // Close menu after clicking a nav link (mobile)
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (document.body.classList.contains("menu-open")) closeMenu();
    });
  });

  // ---------------------------
  // Scroll behaviors (throttled)
  // ---------------------------

  let ticking = false;

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;

    if (navbar) {
      navbar.classList.toggle("scrolled", y > 20);
    }

    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle("visible", y > 500);
    }

    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  });

  scrollTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  // ---------------------------
  // Active nav link highlighting
  // ---------------------------

  const sections = qsa("section[id]");

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        // Choose the most visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        if (!visible) return;

        const id = visible.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      },
      {
        root: null,
        threshold: [0.35, 0.5, 0.65],
        // Make the active section switch a bit earlier, accounting for navbar
        rootMargin: `-${Math.max(getNavHeight(), 60)}px 0px -55% 0px`,
      }
    );

    sections.forEach((s) => sectionObserver.observe(s));
  }

  // ---------------------------
  // Reveal animations
  // ---------------------------

  const revealEls = qsa(".reveal");

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: show everything
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ---------------------------
  // Skill bar animation (data-progress)
  // ---------------------------

  const skillsOverview = qs(".skills-overview");

  function animateSkillBars() {
    const bars = qsa(".skill-fill", skillsOverview);
    bars.forEach((bar) => {
      const p = Number(bar.getAttribute("data-progress") || "0");
      bar.style.width = prefersReducedMotion ? `${p}%` : "0%";
      // Trigger a reflow so transition works
      // eslint-disable-next-line no-unused-expressions
      bar.offsetHeight;
      bar.style.width = `${p}%`;
    });
  }

  if (skillsOverview && "IntersectionObserver" in window) {
    const skillsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateSkillBars();
            skillsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    skillsObserver.observe(skillsOverview);
  } else if (skillsOverview) {
    // Fallback
    animateSkillBars();
  }

  // ---------------------------
  // Stat counters (data-count + data-suffix)
  // ---------------------------

  const statEls = qsa(".stat-number");

  function animateNumber(el) {
    const end = Number(el.getAttribute("data-count") || "0");
    const suffix = el.getAttribute("data-suffix") || "";

    if (prefersReducedMotion) {
      el.textContent = `${end}${suffix}`;
      return;
    }

    const duration = 900;
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      // easeOutQuad
      const eased = t * (2 - t);
      const value = Math.floor(end * eased);
      el.textContent = `${value}${suffix}`;

      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = `${end}${suffix}`;
    }

    requestAnimationFrame(tick);
  }

  if (statEls.length && "IntersectionObserver" in window) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateNumber(entry.target);
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    statEls.forEach((el) => statsObserver.observe(el));
  } else {
    statEls.forEach((el) => {
      const end = el.getAttribute("data-count");
      const suffix = el.getAttribute("data-suffix") || "";
      if (end) el.textContent = `${end}${suffix}`;
    });
  }

  // ---------------------------
  // Footer year
  // ---------------------------

  qsa(".current-year").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // ---------------------------
  // Final init
  // ---------------------------

  document.addEventListener("DOMContentLoaded", () => {
    syncLayoutVars();
    onScroll();
  });

  // In case script loads after DOMContentLoaded
  syncLayoutVars();
  onScroll();
})();
