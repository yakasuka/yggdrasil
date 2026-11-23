// Render presentation emojis as inline SVG icons styled like the theme
// toggle, instead of coloured bitmap emoji. The source strings (group names,
// rule names, share codes) are never changed — only what the browser paints.
import { EMOJI_ICONS, iconForEmoji, uiIcon } from "./icons.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EMOJI_RE = new RegExp(
  Object.keys(EMOJI_ICONS)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|"),
  "g",
);

const SKIP_SELECTOR = [
  "script",
  "style",
  "svg",
  "img",
  "input",
  "textarea",
  "select",
  "option",
  "[data-no-emoji]",
].join(",");

export function renderEmoji(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(SKIP_SELECTOR))
        return NodeFilter.FILTER_REJECT;
      EMOJI_RE.lastIndex = 0;
      return EMOJI_RE.test(node.nodeValue)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  for (const node of textNodes) {
    const value = node.nodeValue;
    const fragment = document.createDocumentFragment();
    let last = 0;
    EMOJI_RE.lastIndex = 0;
    let match;
    while ((match = EMOJI_RE.exec(value))) {
      if (match.index > last) fragment.append(value.slice(last, match.index));
      const wrap = document.createElement("span");
      wrap.className = "emoji-icon";
      wrap.setAttribute("aria-hidden", "true");
      wrap.innerHTML = uiIcon(iconForEmoji(match[0]));
      fragment.append(wrap);
      last = match.index + match[0].length;
    }
    fragment.append(value.slice(last));
    node.parentNode.replaceChild(fragment, node);
  }
}
