window.GKS = window.GKS || {};

GKS.reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

GKS.isCoarsePointer = () =>
  matchMedia("(pointer: coarse)").matches || window.innerWidth < 720;

GKS.shouldSkipPhysics = () => GKS.reducedMotion() || GKS.isCoarsePointer();

GKS.clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

GKS.toast = function (msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 1800);
};

GKS.copyEmail = async function (email) {
  try {
    await navigator.clipboard.writeText(email);
    GKS.toast("email copied");
  } catch {
    GKS.toast("copy failed");
  }
};
