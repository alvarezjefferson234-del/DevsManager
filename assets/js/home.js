const setupHeroRotation = () => {
  const node = document.getElementById("hero-rotating-text");
  if (!node) return;

  const phrases = [
    "agentes de IA",
    "automatizaciones 24/7",
    "sistemas web a medida",
    "integraciones inteligentes",
  ];

  let index = 0;
  setInterval(() => {
    index = (index + 1) % phrases.length;
    node.textContent = phrases[index];
  }, 2400);
};

const setupCounters = () => {
  const counters = Array.from(document.querySelectorAll("[data-counter]"));
  if (!counters.length) return;

  const runCounter = (el) => {
    const target = Number(el.dataset.counter);
    let value = 0;
    const step = Math.max(1, Math.ceil(target / 28));
    const timer = setInterval(() => {
      value += step;
      if (value >= target) {
        value = target;
        clearInterval(timer);
      }
      el.textContent = `${value}`;
    }, 26);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(runCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((counter) => observer.observe(counter));
};

document.addEventListener("DOMContentLoaded", () => {
  setupHeroRotation();
  setupCounters();
});
