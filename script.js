(() => {
  const root = document.documentElement;
  const body = document.body;

  const defaults = {
    site: {
      heroRole: { tr: "VİDEO EDİTÖRÜ", en: "VIDEO EDITOR" },
      heroCopy: { tr: "Görüntü, ritim ve hikâye.", en: "Image, rhythm and story." },
      infoLabel: { tr: "BİLGİ +", en: "INFO +" },
      infoText: { tr: "SONRA EKLENECEK", en: "COMING LATER" },
      contactLabel: { tr: "İLETİŞİM +", en: "CONTACT +" },
      contactText: { tr: "SONRA EKLENECEK", en: "COMING LATER" }
    },
    typography: {
      fontFamily: '"Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif',
      brandSize: 11,
      heroSize: 42,
      projectTitleSize: 62,
      menuTitleSize: 112,
      modalTitleSize: 120,
      smallTextSize: 9
    },
    projects: Array.from({ length: 5 }, (_, index) => ({
      number: String(index + 1).padStart(2, "0"),
      title: { tr: `Project ${String(index + 1).padStart(2, "0")}`, en: `Project ${String(index + 1).padStart(2, "0")}` },
      youtubeUrl: ""
    }))
  };

  let content = structuredClone(defaults);
  let currentLanguage = localStorage.getItem("portfolio-language") || "tr";
  let openProject = null;

  function safeNumber(value, fallback, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : fallback;
  }

  function mergeContent(data) {
    if (!data || typeof data !== "object") return structuredClone(defaults);
    return {
      site: { ...defaults.site, ...(data.site || {}) },
      typography: { ...defaults.typography, ...(data.typography || {}) },
      projects: Array.isArray(data.projects) && data.projects.length ? data.projects.slice(0, 20) : defaults.projects
    };
  }

  async function loadContent() {
    try {
      const response = await fetch(`content.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("content.json yüklenemedi");
      content = mergeContent(await response.json());
    } catch (error) {
      console.warn(error);
      content = structuredClone(defaults);
    }
  }

  function applyTypography() {
    const t = content.typography || defaults.typography;
    root.style.setProperty("--admin-font-family", t.fontFamily || defaults.typography.fontFamily);
    root.style.setProperty("--admin-brand-size", `${safeNumber(t.brandSize, 11, 8, 30)}px`);
    root.style.setProperty("--admin-hero-size", `${safeNumber(t.heroSize, 42, 18, 120)}px`);
    root.style.setProperty("--admin-project-title-size", `${safeNumber(t.projectTitleSize, 62, 22, 150)}px`);
    root.style.setProperty("--admin-menu-title-size", `${safeNumber(t.menuTitleSize, 112, 30, 180)}px`);
    root.style.setProperty("--admin-modal-title-size", `${safeNumber(t.modalTitleSize, 120, 30, 200)}px`);
    root.style.setProperty("--admin-small-size", `${safeNumber(t.smallTextSize, 9, 7, 18)}px`);
  }

  function setDualText(selector, value) {
    const element = document.querySelector(selector);
    if (!element || !value) return;
    element.dataset.tr = value.tr ?? "";
    element.dataset.en = value.en ?? value.tr ?? "";
  }

  function applySiteText() {
    setDualText("#hero-role", content.site.heroRole);
    setDualText("#hero-copy", content.site.heroCopy);
    setDualText("#info-label", content.site.infoLabel);
    setDualText("#info-text", content.site.infoText);
    setDualText("#contact-label", content.site.contactLabel);
    setDualText("#contact-text", content.site.contactText);
  }

  function extractYouTubeId(url) {
    if (!url || typeof url !== "string") return "";
    const value = url.trim();
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]{11})/i,
      /(?:youtu\.be\/)([\w-]{11})/i,
      /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
      /(?:youtube\.com\/embed\/)([\w-]{11})/i,
      /^([\w-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) return match[1];
    }
    return "";
  }


  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function projectTitle(project, lang = currentLanguage) {
    return project?.title?.[lang] || project?.title?.tr || `Project ${project?.number || ""}`;
  }

  function renderProjects() {
    const work = document.querySelector("#work");
    const projects = content.projects.map((project, index) => ({
      number: project.number || String(index + 1).padStart(2, "0"),
      title: project.title || { tr: `Project ${index + 1}`, en: `Project ${index + 1}` },
      youtubeUrl: project.youtubeUrl || ""
    }));

    work.innerHTML = projects.map((project, index) => {
      const youtubeId = extractYouTubeId(project.youtubeUrl);
      const mediaClass = youtubeId ? "has-video" : `project__media--${String((index % 5) + 1).padStart(2, "0")}`;
      const media = youtubeId
        ? `<img src="https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg" data-fallback="https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg" alt="" loading="lazy"><i class="project__play" aria-hidden="true"></i>`
        : `<span data-tr="VİDEO / GÖRSEL ALANI" data-en="VIDEO / IMAGE AREA">VİDEO / GÖRSEL ALANI</span>`;

      return `<article class="project" data-index="${project.number}" data-project-position="${index}">
        <button class="project__button" type="button" aria-label="${escapeHtml(projectTitle(project))}">
          <div class="project__meta">
            <span class="project__number">${project.number}</span>
            <h2 data-tr="${escapeHtml(project.title.tr || "")}" data-en="${escapeHtml(project.title.en || project.title.tr || "")}">${escapeHtml(projectTitle(project))}</h2>
            <span class="project__view" data-tr="PROJEYİ GÖR" data-en="VIEW PROJECT">PROJEYİ GÖR</span>
          </div>
          <div class="project__media ${mediaClass}">${media}</div>
        </button>
      </article>`;
    }).join("");

    document.querySelectorAll(".project__media img").forEach((image) => {
      image.addEventListener("error", () => {
        const fallback = image.dataset.fallback;
        if (fallback && image.src !== fallback) image.src = fallback;
      }, { once: true });
    });

    const first = projects[0]?.number || "01";
    const last = projects.at(-1)?.number || first;
    document.querySelector("#project-range").textContent = `${first} — ${last}`;
    bindProjectButtons();
  }

  function setLanguage(lang) {
    currentLanguage = lang === "en" ? "en" : "tr";
    localStorage.setItem("portfolio-language", currentLanguage);
    root.lang = currentLanguage;

    const language = document.querySelector(".language");
    language.dataset.active = currentLanguage;
    document.querySelectorAll(".language__button").forEach((button) => {
      const active = button.dataset.language === currentLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll("[data-tr][data-en]").forEach((element) => {
      element.textContent = element.dataset[currentLanguage];
    });

    if (openProject) updateModal(openProject);
  }

  function updateModal(project) {
    const modalNumber = document.querySelector(".modal__number");
    const modalTitle = document.querySelector(".modal h2");
    const modalMedia = document.querySelector(".modal__media");
    modalNumber.textContent = project.number;
    modalTitle.textContent = projectTitle(project);

    const youtubeId = extractYouTubeId(project.youtubeUrl);
    if (youtubeId) {
      modalMedia.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1" title="${escapeHtml(projectTitle(project))}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    } else {
      const tr = "VİDEO BURAYA GELECEK";
      const en = "VIDEO WILL GO HERE";
      modalMedia.innerHTML = `<span data-tr="${tr}" data-en="${en}">${currentLanguage === "en" ? en : tr}</span>`;
    }
  }

  function setModal(open, project = null) {
    const modal = document.querySelector(".modal");
    const modalClose = document.querySelector(".modal__close");
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("is-locked", open);

    if (open && project) {
      openProject = project;
      updateModal(project);
      modalClose.focus();
    } else {
      openProject = null;
      document.querySelector(".modal__media").innerHTML = "";
    }
  }

  function bindProjectButtons() {
    const cursor = document.querySelector(".cursor");
    document.querySelectorAll(".project__button").forEach((button) => {
      const article = button.closest(".project");
      const project = content.projects[Number(article.dataset.projectPosition)];
      button.addEventListener("click", () => setModal(true, project));
      button.addEventListener("mouseenter", () => cursor.classList.add("is-project"));
      button.addEventListener("mouseleave", () => cursor.classList.remove("is-project"));
    });
  }

  function initInteractions() {
    const loader = document.querySelector(".loader");
    const loaderBar = document.querySelector(".loader__bar span");
    const loaderCount = document.querySelector(".loader__count");
    const menu = document.querySelector(".menu");
    const menuButton = document.querySelector(".menu-button");
    const progressBar = document.querySelector(".progress__track i");
    const progressNumber = document.querySelector(".progress__number");
    const modal = document.querySelector(".modal");
    const modalClose = document.querySelector(".modal__close");
    const cursor = document.querySelector(".cursor");

    let loaderValue = 0;
    let targetX = 0, targetY = 0, cursorX = 0, cursorY = 0;

    function revealVisibleElements() {
      document.querySelectorAll(".hero__role, .hero__bottom, .project__meta, .project__media, .reserved > *").forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * .92) element.classList.add("is-revealed");
      });
    }

    function playLoader() {
      const interval = window.setInterval(() => {
        loaderValue = Math.min(loaderValue + Math.ceil(Math.random() * 8), 100);
        loaderBar.style.width = `${loaderValue}%`;
        loaderCount.textContent = String(loaderValue).padStart(2, "0");
        if (loaderValue >= 100) {
          window.clearInterval(interval);
          window.setTimeout(() => { loader.classList.add("is-hidden"); revealVisibleElements(); }, 220);
        }
      }, 34);
    }

    function setMenu(open) {
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", String(!open));
      menuButton.setAttribute("aria-expanded", String(open));
      body.classList.toggle("is-locked", open);
    }

    function updateProgress() {
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const ratio = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
      progressBar.style.height = `${ratio * 100}%`;
      let current = content.projects[0]?.number || "01";
      document.querySelectorAll(".project").forEach((project) => {
        if (project.getBoundingClientRect().top < window.innerHeight * .55) current = project.dataset.index;
      });
      progressNumber.textContent = current;
    }

    function animateCursor() {
      cursorX += (targetX - cursorX) * .18;
      cursorY += (targetY - cursorY) * .18;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      requestAnimationFrame(animateCursor);
    }

    document.querySelectorAll(".language__button").forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.language)));
    menuButton.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
    document.querySelectorAll("[data-menu-close]").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    modalClose.addEventListener("click", () => setModal(false));
    modal.addEventListener("click", (event) => { if (event.target === modal) setModal(false); });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (modal.classList.contains("is-open")) setModal(false);
      else if (menu.classList.contains("is-open")) setMenu(false);
    });

    window.addEventListener("scroll", () => { updateProgress(); revealVisibleElements(); }, { passive: true });
    window.addEventListener("resize", () => { updateProgress(); revealVisibleElements(); });

    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", (event) => { targetX = event.clientX; targetY = event.clientY; cursor.classList.add("is-visible"); });
      window.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
      animateCursor();
    }

    updateProgress();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      loader.classList.add("is-hidden");
      revealVisibleElements();
    } else playLoader();
  }

  async function init() {
    await loadContent();
    applyTypography();
    applySiteText();
    renderProjects();
    setLanguage(currentLanguage);
    initInteractions();
  }

  init();
})();
