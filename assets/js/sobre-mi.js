const setupSkillBars = () => {
  const bars = Array.from(document.querySelectorAll("[data-skill-level]"));
  if (!bars.length) return;

  const paintBar = (bar) => {
    const level = Number(bar.dataset.skillLevel) || 0;
    bar.style.width = `${Math.max(0, Math.min(level, 100))}%`;
  };

  if (!("IntersectionObserver" in window)) {
    bars.forEach(paintBar);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          paintBar(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.45 },
  );

  bars.forEach((bar) => observer.observe(bar));
};

document.addEventListener("DOMContentLoaded", setupSkillBars);
