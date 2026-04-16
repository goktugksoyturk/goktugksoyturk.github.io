// Respect reduced-motion users and keep interactions subtle.
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Scroll reveal
if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
        }
      });
    },
    { threshold: 0.08 },
  );

  document.querySelectorAll(".reveal").forEach((el) => {
    revealObserver.observe(el);
  });
} else {
  document.querySelectorAll(".reveal").forEach((el) => {
    el.classList.add("in");
  });
}

// Active nav highlight
const sections = document.querySelectorAll("section[id], div[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navLinks.forEach((link) => {
        link.style.color = "";
        if (link.getAttribute("href") === `#${entry.target.id}`) {
          link.style.color = "var(--gold)";
        }
      });
    });
  },
  { threshold: 0.45 },
);

sections.forEach((section) => navObserver.observe(section));

// Scroll progress line
const scrollProgress = document.getElementById("scrollProgress");
const updateScrollProgress = () => {
  if (!scrollProgress) {
    return;
  }

  const scrollTop = window.scrollY;
  const scrollHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
};

window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

// Project filters
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".proj-card[data-project]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    projectCards.forEach((card) => {
      if (filter === "all") {
        card.classList.remove("is-hidden");
        return;
      }

      const categories = (card.dataset.project || "").split(" ");
      card.classList.toggle("is-hidden", !categories.includes(filter));
    });
  });
});

// Clickable project cards with outbound links
document.querySelectorAll(".proj-card[data-link]").forEach((card) => {
  const url = card.dataset.link;
  if (!url) {
    return;
  }

  const openLink = () => window.open(url, "_blank", "noopener,noreferrer");
  card.addEventListener("click", openLink);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLink();
    }
  });
});

// Copy email action
const copyEmailBtn = document.getElementById("copyEmailBtn");
const toast = document.getElementById("toast");
let toastTimer;

const showToast = (message) => {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
};

if (copyEmailBtn) {
  copyEmailBtn.addEventListener("click", async () => {
    const email = "goktugksoyturk@gmail.com";

    try {
      await navigator.clipboard.writeText(email);
      showToast("Email copied");
    } catch (error) {
      showToast("Copy failed");
    }
  });
}
