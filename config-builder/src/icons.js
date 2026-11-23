// Inline UI icons in the same visual language as the theme toggle:
// crisp 24px SVG geometry, currentColor strokes and one restrained accent.
// Emoji strings stay in the data/config layer; this module only controls how
// the icon is painted in the wizard.

const PATHS = {
  switch: `<path d="M4 7.5h16M4 16.5h16"/><circle class="icon-fill icon-accent" cx="9.5" cy="7.5" r="2.3" stroke="none"/><circle class="icon-fill icon-accent" cx="14.5" cy="16.5" r="2.3" stroke="none"/>`,
  rocket: `<path d="M12 3c4 2 6.5 5.5 6.5 9.5 0 3.2-2.6 6.2-6.5 8.5-3.9-2.3-6.5-5.3-6.5-8.5C5.5 8.5 8 5 12 3Z"/><circle class="icon-fill icon-accent" cx="12" cy="10" r="2" stroke="none"/><path d="m8.6 16.2-2.6 3.3 3.8-.8M15.4 16.2l2.6 3.3-3.8-.8M12 21v1.5M10.5 22.5h3"/>`,
  bolt: `<path class="icon-fill icon-warm" d="M13.4 2.5 5.2 13h5.1l-1.4 8.5L18.8 10h-5.3l-.1-7.5Z" stroke="none"/>`,
  shuffle: `<path d="M4 7h3.2c2 0 3.1 1.1 4.6 3.1M20 7h-3.2c-1.4 0-2.3.7-3.2 1.8M4 17h3.2c1.9 0 3-1.1 4.4-2.8M20 17h-3.2c-1.5 0-2.5-.8-3.4-2"/><path d="m17 4 3 3-3 3M17 14l3 3-3 3"/>`,
  balance: `<path d="M12 4v16M6 20h12M5 8h14M5 8l-2.2 5.5h4.4L5 8ZM19 8l-2.2 5.5h4.4L19 8Z"/>`,
  layers: `<path d="m12 3 8.5 4.5-8.5 4.5-8.5-4.5L12 3Z"/><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16 12 20.5 20.5 16"/>`,
  box: `<path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>`,
  globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.2 3.7 5.1 3.7 8.5s-1.3 6.3-3.7 8.5C9.6 18.3 8.3 15.4 8.3 12S9.6 5.7 12 3.5Z"/>`,
  city: `<path d="M4 20V9l5-2v13M9 20V5l6 3v12M15 20v-8l5 2v6M3 20h18M6.2 12h.1M6.2 15h.1M11.5 10h.1M11.5 14h.1M11.5 17h.1M17.5 16h.1"/>`,
  torii: `<path d="M3.5 6h17M6 9h12M8 9v11M16 9v11M4.5 20h15M7 12h10"/>`,
  tea: `<path d="M6 10h10l-1 8a3 3 0 0 1-3 2.6H10A3 3 0 0 1 7 18l-1-8Z"/><path d="M16 11h1.8a2.2 2.2 0 0 1 0 4.4H16M10 4.5V9M13 3.5V9"/>`,
  mic: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/>`,
  statue: `<circle cx="12" cy="6" r="2.2"/><path d="M9 10h6l1.4 6H7.6L9 10ZM6 20h12M8 16l-1.5 4M16 16l1.5 4"/>`,
  flag: `<path d="M6 21V4M6 5h11l-2 4 2 4H6"/><circle class="icon-fill icon-accent" cx="6" cy="4" r="1" stroke="none"/>`,
  plug: `<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5"/>`,
  home: `<path d="m3.5 11 8.5-7 8.5 7M6 9.5V20h12V9.5M10 20v-6h4v6"/>`,
  bricks: `<path d="M3 6h18v5H3zM3 13h8v5H3zM13 13h8v5h-8zM8 6v5M16 13v5"/>`,
  game: `<path d="M8 8h8a5 5 0 0 1 5 5 3 3 0 0 1-5.2 2L14 13h-4l-1.8 2A3 3 0 0 1 3 13a5 5 0 0 1 5-5Z"/><path d="M8.5 11v2M7.5 12h2M15.5 11.5h.1M17.5 13.5h.1"/>`,
  sparkle: `<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"/>`,
  planet: `<circle cx="12" cy="12" r="6"/><path d="M5.5 15.5c-2.1.9-3.3 1.9-3.1 2.7.5 2 6.2 1.4 12.7-1.4 6.5-2.8 10.2-6.7 9.7-8.7-.2-.8-1.4-1.1-3.2-.9"/>`,
  galaxy: `<circle cx="12" cy="12" r="3.2"/><path d="M3.5 15.5C5 9 12 5.5 19 8.5c3.4 1.5 4.6 4.5 3 6.5-2 2.6-7.5 2.3-12-.5"/><path d="M4.5 8.5 3 6M20 17l1.5 2.5M6 19l-2 2"/>`,
  cloud: `<path d="M7.5 18h9a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 6.6 9.3 4.4 4.4 0 0 0 7.5 18Z"/>`,
  window: `<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16M4 12h16"/>`,
  palette: `<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.5-2-.5-1 .2-2 1.5-2h1.5A3.5 3.5 0 0 0 20 13.5C20 7.7 16.5 3 12 3Z"/><circle cx="8" cy="10" r="1" class="icon-fill icon-accent" stroke="none"/><circle cx="12" cy="7.5" r="1" class="icon-fill" stroke="none"/><circle cx="16" cy="10" r="1" class="icon-fill" stroke="none"/>`,
  infinity: `<path d="M7.5 8.5c-2.2 0-3.5 1.6-3.5 3.5s1.3 3.5 3.5 3.5c3.2 0 4.5-7 9-7 2.2 0 3.5 1.6 3.5 3.5s-1.3 3.5-3.5 3.5c-3.2 0-4.5-7-9-7Z"/>`,
  wing: `<path d="M4 18c4-1 7-4 9-8 1.2-2.4 3.2-4 6-5-.8 3.6-2.7 6.3-5.7 8.4C10.5 15.5 7.4 17.3 4 18Z"/><path d="M9 18c3-.8 5.5-2.6 7.4-5.4"/>`,
  chat: `<path d="M4 5.5h16v10H9l-5 4v-14Z"/><path d="M8 10h8M8 13h5"/>`,
  people: `<circle cx="9" cy="8" r="2.6"/><circle cx="16" cy="9" r="2"/><path d="M4.5 19c.5-3.2 2.1-5 4.5-5s4 1.8 4.5 5M14 19c.2-2.2 1-3.6 2.5-4.3M17 14.5c2 .4 3.2 2 3.5 4.5"/>`,
  music: `<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>`,
  popcorn: `<path d="M7 9h10l-1.2 11H8.2L7 9Z"/><path d="M8 9 6 5l4 1 2-3 2 3 4-1-2 4"/><path d="M10 13h.1M14 13h.1M11 16h2"/>`,
  tv: `<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4M8 9l4 2.5L8 14V9Z"/>`,
  film: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M17 10h4M3 14h4M17 14h4"/>`,
  castle: `<path d="M4 20V9h3V6h3v3h4V6h3v3h3v11H4ZM9 20v-5h6v5M4 12h16"/>`,
  news: `<path d="M4 5h14v14H4V5ZM18 9h2v8a2 2 0 0 1-2 2"/><path d="M7 9h8M7 12h8M7 15h5"/>`,
  gift: `<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9C9 9 7 8 7 6a2 2 0 0 1 3.5-1.3L12 9Zm0 0c3 0 5-1 5-3a2 2 0 0 0-3.5-1.3L12 9Z"/>`,
  shield: `<path d="M12 3 5 6v5.5c0 4.4 2.9 7.9 7 9.5 4.1-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>`,
  warning: `<path class="icon-fill icon-warm" d="M12 4 2.8 20h18.4L12 4Z" stroke="none"/><path d="M12 10v4.5M12 17.2h.1" stroke="currentColor"/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  ban: `<circle cx="12" cy="12" r="8.5"/><path d="m6.2 6.2 11.6 11.6"/>`,
  "select-all": `<rect x="4" y="4" width="11" height="11" rx="2"/><path d="m8 20 4-4 7-7M15 9l2.5 2.5L22 7"/>`,
  recycle: `<path d="m8 7 2-3.5 3 5M16 7l3.5 2-2 3.5M12 20l-3.5-2 1.2-2.2M5.5 15l-1-4 3.5.6M18.5 17l-3.5.6-.8-3.3"/><path d="M9 6h4M18.5 9v4M9.5 18h4"/>`,
  circle: `<circle cx="12" cy="12" r="6" class="icon-fill icon-accent" stroke="none"/>`,
};

export function uiIcon(name, className = "") {
  const body = PATHS[name] || PATHS.sparkle;
  const cls = ["ui-icon", className].filter(Boolean).join(" ");
  return `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// Emoji → icon name. Only presentation: the original emoji remains in config
// data, YAML group names and share codes.
export const EMOJI_ICONS = {
  "🎚️": "switch",
  "🚀": "rocket",
  "⚡": "bolt",
  "♻️": "recycle",
  "🔯": "shuffle",
  "🔮": "balance",
  "📦": "box",
  "✨": "sparkle",
  "🪐": "planet",
  "🌌": "galaxy",
  "🌐": "globe",
  "🌆": "city",
  "🧋": "tea",
  "⛩️": "torii",
  "🎤": "mic",
  "🏙️": "city",
  "🗽": "statue",
  "🏁": "flag",
  "🔌": "plug",
  "🏠": "home",
  "🧱": "bricks",
  "🎮": "game",
  "🕹️": "game",
  "🟨": "circle",
  "🟧": "circle",
  "🟣": "circle",
  "🟦": "circle",
  "🟪": "circle",
  "⚪": "circle",
  "💚": "sparkle",
  "☁️": "cloud",
  "🪟": "window",
  "🎨": "palette",
  "♾️": "infinity",
  "🪽": "wing",
  "💬": "chat",
  "🫂": "people",
  "🎶": "music",
  "🍿": "popcorn",
  "📺": "tv",
  "🎬": "film",
  "🏰": "castle",
  "📰": "news",
  "🎁": "gift",
  "❎": "shield",
  "⚠": "warning",
  "✳": "sparkle",
};

export function iconForEmoji(emoji) {
  return EMOJI_ICONS[emoji] || "sparkle";
}

// Region filters use flag emoji in the data, but the decorative icon in the
// template is a city/landmark glyph. Map by id so the SVG set stays distinct.
export const REGION_ICONS = {
  HK: "city",
  TW: "tea",
  JP: "torii",
  KR: "mic",
  SG: "city",
  US: "statue",
  OTHER: "globe",
};

export function iconForRegion(id) {
  return REGION_ICONS[id] || "globe";
}
