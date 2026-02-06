const PARTIALS = {
  header: "partials/header.html",
  footer: "partials/footer.html",
};

const includePartials = async () => {
  const targets = Array.from(document.querySelectorAll("[data-include]"));

  await Promise.all(
    targets.map(async (target) => {
      const key = target.getAttribute("data-include");
      const source = PARTIALS[key];
      if (!source) return;

      try {
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`No se pudo cargar ${source}`);
        }
        const html = await response.text();
        target.outerHTML = html;
      } catch (error) {
        target.outerHTML = "";
        console.error(error);
      }
    }),
  );
};

const setActivePage = () => {
  const current = document.body.dataset.page;
  if (!current) return;

  document.querySelectorAll(".site-menu [data-page]").forEach((link) => {
    if (link.dataset.page === current) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
};

const setupMenu = () => {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".site-menu");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
};

const setYear = () => {
  const yearNode = document.getElementById("year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
};

const bootLayout = async () => {
  await includePartials();
  setActivePage();
  setupMenu();
  setYear();
  document.dispatchEvent(new CustomEvent("layout:ready"));
};

document.addEventListener("DOMContentLoaded", bootLayout);
