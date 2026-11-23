/**
 * Shared site footer — one definition, called from both the landing page and
 * config-builder. The markup and styles live in a Shadow DOM so the footer
 * renders identically regardless of each page's own theme variables.
 *
 * Usage:
 *   <script type="module" src="./assets/site-footer.js"></script>
 *   <site-footer></site-footer>
 *
 * Relative links are resolved from `base` (defaults to "./"):
 *   <site-footer base="../"></site-footer>   (config-builder/ → repository root)
 */
const TEMPLATE = `
<style>
  :host {
    display: block;
    position: relative;
    z-index: 3;
    background: var(--sf-bg, #fbfbfd);
    border-top: 1px solid var(--sf-hairline, rgba(0, 0, 0, .10));
    padding: 52px 24px 46px;
    font: 400 12px/1.7 -apple-system, BlinkMacSystemFont, "SF Pro Text",
      "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
      sans-serif;
    color: var(--sf-ink-3, #86868b);
    letter-spacing: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  :host([theme="dark"]) {
    --sf-bg: #111113;
    --sf-hairline: rgba(255, 255, 255, .12);
    --sf-ink: #f5f5f7;
    --sf-ink-2: #a1a1a7;
    --sf-ink-3: #86868b;
  }
  *, *::before, *::after { box-sizing: border-box; }
  .foot-inner {
    max-width: 1024px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 28px;
  }
  .foot-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--sf-ink-2, #6e6e73);
    font-weight: 600;
    font-size: 13px;
    letter-spacing: -.01em;
  }
  .foot-brand img {
    width: 18px; height: 18px;
    display: block;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .14);
  }
  .foot-links { display: flex; flex-wrap: wrap; gap: 24px; }
  .foot-links a {
    color: var(--sf-ink-3, #86868b);
    text-decoration: none;
    transition: color .3s cubic-bezier(.16, 1, .3, 1);
  }
  .foot-links a:hover { color: var(--sf-ink, #1d1d1f); }
  .foot-legal {
    width: 100%;
    padding-top: 26px;
    margin-top: 6px;
    border-top: 1px solid var(--sf-hairline, rgba(0, 0, 0, .10));
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
  }
  @media (max-width: 600px) {
    :host { padding: 40px 20px 36px; }
    .foot-inner { gap: 24px; }
    .foot-links { gap: 18px; }
  }
</style>
<div class="foot-inner">
  <div class="foot-brand">
    <img src="__BASE__assets/favicon.png" alt="" width="18" height="18">
    <span>Yggdrasil</span>
  </div>
  <nav class="foot-links" aria-label="页脚导航">
    <a href="https://github.com/yakasuka/yggdrasil/blob/main/docs/zh-CN.md">中文指南</a>
    <a href="https://github.com/yakasuka/yggdrasil/blob/main/docs/en.md">English</a>
    <a href="__BASE__config-builder/">配置工坊</a>
    <a href="__BASE__resources/template/ratatoskr-template.yaml">Ratatoskr</a>
    <a href="https://github.com/yakasuka/yggdrasil#致谢--上游项目">致谢</a>
    <a href="__BASE__LICENSE">授权协议</a>
  </nav>
  <div class="foot-legal">
    <span>© 2026 Yggdrasil Project. All rights reserved.</span>
    <span>Geo-powered Configuration · Permission Required</span>
  </div>
</div>
`;

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    let base = this.getAttribute("base") || "./";
    if (!base.endsWith("/")) base += "/";
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = TEMPLATE.replaceAll("__BASE__", base);
    // Follow the config-builder's light/dark switch without coupling to it.
    const syncTheme = () => {
      const theme = document.documentElement.dataset.theme;
      if (theme === "dark" || theme === "light")
        this.setAttribute("theme", theme);
    };
    syncTheme();
    this._themeObserver = new MutationObserver(syncTheme);
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect();
  }
}

if (!customElements.get("site-footer"))
  customElements.define("site-footer", SiteFooter);
