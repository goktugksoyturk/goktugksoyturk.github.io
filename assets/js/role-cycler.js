(function () {
  function init() {
    const el = document.querySelector(".role-cycler");
    if (!el) return;
    const roles = (el.dataset.roles || "Developer,Researcher,Entrepreneur")
      .split(",")
      .map((s) => s.trim());
    const text = el.querySelector(".role-text");
    if (!text) return;

    let i = 0;
    text.textContent = roles[0];

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setInterval(() => {
      el.classList.add("is-flipping");
      setTimeout(() => {
        i = (i + 1) % roles.length;
        text.textContent = roles[i];
        el.classList.remove("is-flipping");
      }, 200);
    }, 2400);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
