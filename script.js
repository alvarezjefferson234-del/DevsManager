const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
const yearEl = document.getElementById('year');
const reveals = document.querySelectorAll('.reveal');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (menuToggle && menu) {
  menuToggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
}

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.classList.remove('open');
  });
});

const onScrollReveal = () => {
  const trigger = window.innerHeight * 0.9;
  reveals.forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top < trigger) {
      el.classList.add('show');
    }
  });
};

const onParallax = () => {
  document.documentElement.style.setProperty('--scroll', window.scrollY.toString());
};

window.addEventListener('scroll', () => {
  onScrollReveal();
  onParallax();
});

window.addEventListener('load', () => {
  onScrollReveal();
  onParallax();
});
