// Emoji are part of the config language (group names, rule symbols, share
// codes). Render them as the same bright, lively colour glyphs the template
// uses instead of flat monochrome UI icons — Windows' system font otherwise
// degrades regional flags into letters, so Twemoji keeps every platform equal.
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
