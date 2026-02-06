const setupServiceTabs = () => {
  const tabGroup = document.querySelector("[data-service-switch]");
  if (!tabGroup) return;

  const tabs = Array.from(tabGroup.querySelectorAll("[data-service-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-service-panel]"));

  const activate = (name) => {
    tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.serviceTab === name);
    });

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.servicePanel === name);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab.dataset.serviceTab));
  });
};

document.addEventListener("DOMContentLoaded", setupServiceTabs);
