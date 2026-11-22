// Windows' Segoe UI Emoji intentionally does not render regional-indicator
// flags: 🇭🇰 degrades into the letters "H" + "K". Twemoji renders every emoji
// as an inline SVG at display time, so all browsers show the same flag/icon
// without baking images into the catalog or changing any data structure.
import twemoji from "@twemoji/api";

const OPTIONS = {
  folder: "svg",
  ext: ".svg",
  base: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets/",
  className: "emoji",
};

// Only replace emoji inside opted-in containers; leaving <input>/<select>
// values untouched avoids breaking form state. Twemoji skips those by default.
export function renderEmoji(root = document) {
  twemoji.parse(root, OPTIONS);
}
