const storageKey = "yggdrasil:config-builder:theme";
const root = document.documentElement;
const toggle = document.querySelector("#theme-toggle");
const system = matchMedia("(prefers-color-scheme: light)");

let saved = null;
try {
  const value = localStorage.getItem(storageKey);
  if (value === "light" || value === "dark") saved = value;
} catch {}

function apply() {
  const theme = saved || (system.matches ? "light" : "dark");
  root.dataset.theme = theme;
  const light = theme === "light";
  toggle.setAttribute("aria-label", `切换到${light ? "深色" : "浅色"}模式`);
  toggle.querySelector("#theme-toggle-icon").textContent = light ? "☾" : "☀︎";
  toggle.querySelector("#theme-toggle-label").textContent = light ? "深色" : "浅色";
}

// With no manual choice, follow the OS / browser color scheme live. A click on
// the toggle becomes an explicit choice and is remembered across visits.
system.addEventListener("change", () => {
  if (!saved) apply();
});
toggle.addEventListener("click", () => {
  saved = root.dataset.theme === "light" ? "dark" : "light";
  try {
    localStorage.setItem(storageKey, saved);
  } catch {}
  apply();
});

apply();
