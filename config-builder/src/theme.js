const storageKey = "yggdrasil:config-builder:theme";
const root = document.documentElement;
const toggle = document.querySelector("#theme-toggle");

function apply(theme) {
  root.dataset.theme = theme;
  const light = theme === "light";
  toggle.setAttribute("aria-label", `切换到${light ? "深色" : "浅色"}模式`);
  toggle.querySelector("#theme-toggle-icon").textContent = light ? "☾" : "☀︎";
  toggle.querySelector("#theme-toggle-label").textContent = light ? "深色" : "浅色";
}

let theme = "dark";
try {
  theme = localStorage.getItem(storageKey) === "light" ? "light" : "dark";
} catch {}
apply(theme);

toggle.addEventListener("click", () => {
  theme = root.dataset.theme === "light" ? "dark" : "light";
  try {
    localStorage.setItem(storageKey, theme);
  } catch {}
  apply(theme);
});
