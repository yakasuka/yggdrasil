const keys = {
  theme: "yggdrasil:config-builder:theme",
  css: "yggdrasil:config-builder:custom-css",
};
const maxCssBytes = 256 * 1024;
const $ = (selector) => document.querySelector(selector);

function apply() {
  let theme = "system",
    css = "";
  try {
    theme = localStorage.getItem(keys.theme) || "system";
    css = localStorage.getItem(keys.css) || "";
  } catch {}
  if (!["light", "dark", "system"].includes(theme)) theme = "system";
  document.documentElement.dataset.theme = theme;
  $("#theme-select").value = theme;
  let style = $("#user-theme-css");
  if (!style) {
    style = document.createElement("style");
    style.id = "user-theme-css";
    document.head.append(style);
  }
  style.textContent = css;
  $("#clear-theme-css").hidden = !css;
}

function safeCss(css) {
  return css
    .replace(/@import\s[^;]*;?/gi, "/* @import disabled */")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\([^)]*\)/gi, "none")
    .replace(/-moz-binding\s*:[^;}]*/gi, "");
}

function toast(message) {
  const item = $("#toast");
  item.textContent = message;
  item.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (item.hidden = true), 2500);
}

$("#theme-select").addEventListener("change", (event) => {
  try {
    localStorage.setItem(keys.theme, event.target.value);
  } catch {}
  apply();
});
$("#theme-css-file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > maxCssBytes) {
    toast("CSS 文件不能超过 256 KiB");
    event.target.value = "";
    return;
  }
  try {
    localStorage.setItem(keys.css, safeCss(await file.text()));
    apply();
    toast("自定义主题已保存在此浏览器");
  } catch {
    toast("无法保存主题，请检查浏览器本地存储空间");
  }
  event.target.value = "";
});
$("#clear-theme-css").addEventListener("click", () => {
  try {
    localStorage.removeItem(keys.css);
  } catch {}
  apply();
  toast("已恢复内置主题样式");
});

apply();
