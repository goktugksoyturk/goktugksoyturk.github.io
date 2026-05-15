(function () {
  function markActive() {
    const path = location.pathname.replace(/\/index\.html$/, "/");
    document.querySelectorAll(".site-nav .nav-links a").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      const isActive = href === path || (href !== "/" && path.startsWith(href));
      if (isActive) a.setAttribute("aria-current", "page");
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markActive);
  } else {
    markActive();
  }
})();
