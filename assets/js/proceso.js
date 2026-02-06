const setupTimelineFocus = () => {
  const steps = Array.from(document.querySelectorAll(".timeline-step"));
  if (!steps.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.6 },
  );

  steps.forEach((step) => observer.observe(step));
};

document.addEventListener("DOMContentLoaded", setupTimelineFocus);
