(() => {
  const loginView = document.querySelector("#login-view");
  const panelView = document.querySelector("#panel-view");
  const loginForm = document.querySelector("#login-form");
  const loginStatus = document.querySelector("#login-status");
  const passwordInput = document.querySelector("#password");
  const form = document.querySelector("#content-form");
  const projectsEditor = document.querySelector("#projects-editor");
  const saveState = document.querySelector("#save-state");
  const saveDetail = document.querySelector("#save-detail");
  const publishButton = document.querySelector("#publish");
  let content = null;
  let password = sessionStorage.getItem("portfolio-admin-password") || "";
  let dirty = false;

  const $ = (selector) => document.querySelector(selector);

  async function api(action, extra = {}) {
    const response = await fetch("../api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, password, ...extra })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "İşlem başarısız.");
    return data;
  }

  async function loadContent() {
    const response = await fetch(`../content.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("content.json yüklenemedi.");
    content = await response.json();
  }

  function showPanel() {
    loginView.classList.add("is-hidden");
    panelView.classList.remove("is-hidden");
  }

  function setValue(selector, value) { $(selector).value = value ?? ""; }

  function fillForm() {
    const t = content.typography;
    const preset = $("#font-preset");
    const presetValues = [...preset.options].map((o) => o.value);
    if (presetValues.includes(t.fontFamily)) {
      preset.value = t.fontFamily;
      $(".custom-font").classList.add("is-hidden");
    } else {
      preset.value = "custom";
      $(".custom-font").classList.remove("is-hidden");
      setValue("#font-custom", t.fontFamily);
    }
    setValue("#brand-size", t.brandSize);
    setValue("#hero-size", t.heroSize);
    setValue("#project-size", t.projectTitleSize);
    setValue("#menu-size", t.menuTitleSize);
    setValue("#modal-size", t.modalTitleSize);
    setValue("#small-size", t.smallTextSize);
    setValue("#hero-role-tr", content.site.heroRole.tr);
    setValue("#hero-role-en", content.site.heroRole.en);
    setValue("#hero-copy-tr", content.site.heroCopy.tr);
    setValue("#hero-copy-en", content.site.heroCopy.en);
    renderProjectEditors();
    updatePreview();
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  function renderProjectEditors() {
    projectsEditor.innerHTML = content.projects.map((project, index) => `
      <article class="project-editor" data-project="${index}">
        <div class="project-editor-head"><strong>${escapeHtml(project.number || String(index + 1).padStart(2, "0"))}</strong><a href="${escapeHtml(project.youtubeUrl || "#")}" target="_blank" rel="noopener" ${project.youtubeUrl ? "" : 'style="pointer-events:none;opacity:.35"'}>VİDEOYU AÇ ↗</a></div>
        <div class="project-editor-grid">
          <label>Başlık — TR<input data-field="title.tr" value="${escapeHtml(project.title?.tr)}"></label>
          <label>Başlık — EN<input data-field="title.en" value="${escapeHtml(project.title?.en)}"></label>
          <label class="url">YouTube URL<input data-field="youtubeUrl" type="url" placeholder="https://www.youtube.com/watch?v=..." value="${escapeHtml(project.youtubeUrl)}"></label>
        </div>
      </article>`).join("");
  }

  function readForm() {
    const preset = $("#font-preset").value;
    content.typography.fontFamily = preset === "custom" ? $("#font-custom").value.trim() : preset;
    content.typography.brandSize = Number($("#brand-size").value);
    content.typography.heroSize = Number($("#hero-size").value);
    content.typography.projectTitleSize = Number($("#project-size").value);
    content.typography.menuTitleSize = Number($("#menu-size").value);
    content.typography.modalTitleSize = Number($("#modal-size").value);
    content.typography.smallTextSize = Number($("#small-size").value);
    content.site.heroRole.tr = $("#hero-role-tr").value;
    content.site.heroRole.en = $("#hero-role-en").value;
    content.site.heroCopy.tr = $("#hero-copy-tr").value;
    content.site.heroCopy.en = $("#hero-copy-en").value;

    document.querySelectorAll(".project-editor").forEach((editor) => {
      const project = content.projects[Number(editor.dataset.project)];
      editor.querySelectorAll("[data-field]").forEach((input) => {
        const path = input.dataset.field;
        if (path === "youtubeUrl") project.youtubeUrl = input.value.trim();
        if (path === "title.tr") project.title.tr = input.value;
        if (path === "title.en") project.title.en = input.value;
      });
    });
  }

  function updatePreview() {
    if (!content) return;
    readForm();
    const t = content.typography;
    const screen = $("#preview-screen");
    screen.style.fontFamily = t.fontFamily;
    $(".preview-logo").style.fontSize = `${t.brandSize}px`;
    $("#preview-role").style.fontSize = `${t.smallTextSize}px`;
    $("#preview-role").textContent = content.site.heroRole.tr;
    $("#preview-copy").style.fontSize = `${Math.min(t.heroSize, 70)}px`;
    $("#preview-copy").textContent = content.site.heroCopy.tr;
    $("#preview-project-title").style.fontSize = `${Math.min(t.projectTitleSize * .52, 58)}px`;
    $("#preview-project-title").textContent = content.projects[0]?.title?.tr || "PROJECT 01";
  }

  function markDirty() {
    dirty = true;
    saveState.textContent = "Kaydedilmemiş değişiklikler var.";
    saveDetail.textContent = "Yayınla düğmesine bastığında canlı siteye gönderilir.";
    updatePreview();
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    password = passwordInput.value;
    loginStatus.textContent = "Kontrol ediliyor…";
    try {
      await api("login");
      sessionStorage.setItem("portfolio-admin-password", password);
      await loadContent();
      fillForm();
      showPanel();
    } catch (error) {
      loginStatus.textContent = error.message;
    }
  });

  $("#font-preset").addEventListener("change", () => {
    $(".custom-font").classList.toggle("is-hidden", $("#font-preset").value !== "custom");
    markDirty();
  });

  form.addEventListener("input", markDirty);
  form.addEventListener("change", markDirty);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    readForm();
    publishButton.disabled = true;
    saveState.textContent = "Yayınlanıyor…";
    saveDetail.textContent = "GitHub’a content.json commit’i gönderiliyor.";
    try {
      const result = await api("save", { content });
      dirty = false;
      saveState.textContent = "Yayınlama başlatıldı.";
      saveDetail.textContent = result.message || "Vercel kısa süre içinde yeni sürümü yayınlayacak.";
    } catch (error) {
      saveState.textContent = "Kaydedilemedi.";
      saveDetail.textContent = error.message;
    } finally {
      publishButton.disabled = false;
    }
  });

  $("#logout").addEventListener("click", () => {
    sessionStorage.removeItem("portfolio-admin-password");
    location.reload();
  });

  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  async function resumeSession() {
    if (!password) return;
    try {
      await api("login");
      await loadContent();
      fillForm();
      showPanel();
    } catch {
      sessionStorage.removeItem("portfolio-admin-password");
      password = "";
    }
  }

  resumeSession();
})();
