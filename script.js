(() => {
  const root = document.documentElement;
  const body = document.body;

  const loader = document.querySelector(".loader");
  const loaderBar = document.querySelector(".loader__bar span");
  const loaderCount = document.querySelector(".loader__count");

  const language = document.querySelector(".language");
  const languageButtons = document.querySelectorAll(".language__button");

  const menu = document.querySelector(".menu");
  const menuButton = document.querySelector(".menu-button");
  const menuCloseLinks = document.querySelectorAll("[data-menu-close]");

  const progressBar = document.querySelector(".progress__track i");
  const progressNumber = document.querySelector(".progress__number");

  const projectButtons = document.querySelectorAll(".project__button");
  const modal = document.querySelector(".modal");
  const modalClose = document.querySelector(".modal__close");
  const modalNumber = document.querySelector(".modal__number");
  const modalTitle = document.querySelector(".modal h2");

  const cursor = document.querySelector(".cursor");

  let currentLanguage = localStorage.getItem("portfolio-language") || "tr";
  let loaderValue = 0;
  let targetX = 0;
  let targetY = 0;
  let cursorX = 0;
  let cursorY = 0;

  function setLanguage(lang) {
    currentLanguage = lang === "en" ? "en" : "tr";
    localStorage.setItem("portfolio-language", currentLanguage);

    root.lang = currentLanguage;
    language.dataset.active = currentLanguage;

    languageButtons.forEach((button) => {
      const active = button.dataset.language === currentLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll("[data-tr][data-en]").forEach((element) => {
      element.textContent = element.dataset[currentLanguage];
    });
  }

  function playLoader() {
    const interval = window.setInterval(() => {
      loaderValue += Math.ceil(Math.random() * 8);
      loaderValue = Math.min(loaderValue, 100);

      loaderBar.style.width = `${loaderValue}%`;
      loaderCount.textContent = String(loaderValue).padStart(2, "0");

      if (loaderValue >= 100) {
        window.clearInterval(interval);

        window.setTimeout(() => {
          loader.classList.add("is-hidden");
          revealVisibleElements();
        }, 260);
      }
    }, 38);
  }

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menuButton.setAttribute("aria-expanded", String(open));
    body.classList.toggle("is-locked", open);
  }

  function setModal(open, index = "01") {
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("is-locked", open);

    if (open) {
      modalNumber.textContent = index;
      modalTitle.textContent = `Project ${index}`;
      modalClose.focus();
    }
  }

  function updateProgress() {
    const scrollable = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );

    const ratio = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
    progressBar.style.height = `${ratio * 100}%`;

    const projectElements = [...document.querySelectorAll(".project")];
    let current = "01";

    projectElements.forEach((project) => {
      const rect = project.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.55) {
        current = project.dataset.index;
      }
    });

    progressNumber.textContent = current;
  }

  function revealVisibleElements() {
    document
      .querySelectorAll(
        ".hero__role, .hero__bottom, .project__meta, .project__media, .reserved > *"
      )
      .forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          element.classList.add("is-revealed");
        }
      });
  }

  function animateCursor() {
    cursorX += (targetX - cursorX) * 0.18;
    cursorY += (targetY - cursorY) * 0.18;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    requestAnimationFrame(animateCursor);
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.language);
    });
  });

  menuButton.addEventListener("click", () => {
    setMenu(!menu.classList.contains("is-open"));
  });

  menuCloseLinks.forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  projectButtons.forEach((button) => {
    const project = button.closest(".project");

    button.addEventListener("click", () => {
      setModal(true, project.dataset.index);
    });

    button.addEventListener("mouseenter", () => {
      cursor.classList.add("is-project");
    });

    button.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-project");
    });
  });

  modalClose.addEventListener("click", () => setModal(false));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) setModal(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (modal.classList.contains("is-open")) {
      setModal(false);
    } else if (menu.classList.contains("is-open")) {
      setMenu(false);
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      updateProgress();
      revealVisibleElements();
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    updateProgress();
    revealVisibleElements();
  });

  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add("is-visible");
    });

    window.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-visible");
    });

    animateCursor();
  }

  setLanguage(currentLanguage);
  updateProgress();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    loader.classList.add("is-hidden");
    revealVisibleElements();
  } else {
    playLoader();
  }
})();
