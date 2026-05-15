(function () {
  // Filtering
  const grid = document.querySelector(".project-grid");
  const buttons = document.querySelectorAll(".filter-bar button");
  if (grid && buttons.length) {
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.cat;
        buttons.forEach((b) =>
          b.setAttribute("aria-pressed", b === btn ? "true" : "false"),
        );
        grid.querySelectorAll(".project-card").forEach((c) => {
          const cats = (c.dataset.cats || "").split(",");
          c.style.display = cat === "all" || cats.includes(cat) ? "" : "none";
        });
      });
    });
  }

  // Detail overlay
  const overlay = document.querySelector(".overlay");
  if (!overlay) return;
  const overlayCard = overlay.querySelector(".overlay-card");
  const overlayVisit = overlay.querySelector(".overlay-visit");
  const overlayClose = overlay.querySelector(".overlay-close");
  const floating = document.querySelector(".floating-preview");
  const floatingImg = floating ? floating.querySelector("img") : null;

  function openOverlay(card) {
    const data = JSON.parse(card.dataset.detail);
    overlay.querySelector(".cover").innerHTML = data.cover
      ? `<img src="${data.cover}" alt="${data.title}">`
      : `<img src="/assets/img/placeholder.svg" alt="placeholder">`;
    overlay
      .querySelector("[data-slot]")
      .setAttribute("data-slot", data.coverSlot || "");
    if (overlayVisit) {
      overlayVisit.hidden = !data.link;
      if (data.link) {
        overlayVisit.href = data.link;
        overlayVisit.textContent =
          (data.linkLabel || "take me to website") + " ↗";
      }
    }
    overlay.querySelector("h2").textContent = data.title;
    overlay.querySelector(".date").textContent = data.date || "";
    overlay.querySelector(".body").innerHTML = data.body || "";

    const previewRow = overlay.querySelector(".preview-row");
    previewRow.innerHTML = `<span class="preview-label">screens</span>`;
    (data.previews || []).forEach((p, idx) => {
      const num = idx + 1;
      const btn = document.createElement("button");
      btn.className = "preview-num";
      btn.type = "button";
      btn.textContent = `{${num}}`;
      btn.setAttribute("aria-label", `Preview screenshot ${num}`);
      btn.dataset.src = p;

      const show = (ev) => {
        if (!floating || !floatingImg) return;
        const r = btn.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top;
        floating.style.left = x + "px";
        floating.style.top = y + "px";
        floatingImg.src = p;
        floatingImg.alt = `${data.title} screenshot ${num}`;
        floating.classList.add("show");
        btn.classList.add("is-active");
      };
      const hide = () => {
        if (!floating) return;
        floating.classList.remove("show");
        btn.classList.remove("is-active");
      };
      btn.addEventListener("mouseenter", show);
      btn.addEventListener("focus", show);
      btn.addEventListener("mouseleave", hide);
      btn.addEventListener("blur", hide);
      previewRow.appendChild(btn);
    });

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeOverlay() {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (floating) floating.classList.remove("show");
  }

  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => openOverlay(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openOverlay(card);
      }
    });
  });

  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay();
  });
})();
