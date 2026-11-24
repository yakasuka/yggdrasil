// Self-contained owner dashboard served by the backend at
// /config-builder/dashboard. It carries no secrets or node data: credentials
// are held in an HttpOnly cookie by the Pages Function, and all config data is
// fetched from the admin API at runtime.
//
// Visual language: the configurator's own stylesheet, read from disk at module
// init and injected verbatim (single source of truth). The DOM skeleton mirrors
// config-builder's own page — sticky glass header, caustic hero, journey step
// rail and a solid workspace panel — so the two pages read as one product.
//
// Two tools live here, as journey steps: the graphical front-end information
// editor (apps / regions / strategies / rules, derived from the YAML template)
// and the subscription-link manager. Every graphical edit is a surgical,
// format-preserving patch to the template applied through /api/admin/frontinfo.

import { readFileSync } from "node:fs";

function readAsset(relative) {
  try {
    return readFileSync(new URL(relative, import.meta.url), "utf8")
      .replace(/^\uFEFF?@charset[^;]+;\s*/i, "")
      // A literal closing tag inside an inlined script would terminate the
      // <script> element early (even when it only appears in a JS comment).
      .replace(/<\/script>/gi, "<\\/script>");
  } catch {
    return "";
  }
}

// The exact stylesheet shipped with the configurator (styles.css +
// widget-editor.css + motion.css, prebuilt as assets/app.css). Sharing the
// compiled file — rather than a hand-written approximation — is what makes
// the two pages look like the same product down to the last pixel.
function styleSheet() {
  return readAsset("../assets/app.css") || readAsset("../src/styles.css");
}

// The same WebGL water surface used by the configurator. caustics.js is the
// single source of truth; we lift just its waterSurface() core and drop the
// full-screen intro choreography, which has no place on the dashboard.
function waterScript() {
  const src = readAsset("../src/caustics.js");
  const start = src.indexOf("function waterSurface()");
  const end = src.indexOf("if (canvas && hero && stage)");
  if (start < 0 || end < 0) return "";
  const scope = `var canvas=document.querySelector("#caustic-water"),hero=document.querySelector(".caustic-hero"),stage=null,root=document.documentElement,reduced=matchMedia("(prefers-reduced-motion: reduce)"),morph=null,animatedView=null,transitioning=false;\n`;
  return scope + src.slice(start, end) + "\nwaterSurface();\n";
}

// The shared footer is a custom element with its own Shadow DOM. Inlining its
// source keeps the dashboard self-contained under its strict CSP.
function footerScript() {
  return readAsset("../../assets/site-footer.js");
}

// Only dashboard-specific glue is defined here. Every other rule — cards,
// pills, grids, headers, hero, footer — comes from the builder stylesheet.
const DASH_ONLY = `
.site-header .brand{text-decoration:none}
.header-link{display:inline-flex;align-items:center;gap:5px;padding:0;border:0;background:none;color:var(--muted);font-size:.75rem;cursor:pointer;text-decoration:none;transition:color 180ms var(--ease)}
.header-link:hover{color:var(--accent)}
.header-link svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#steps .step-button>span:not(.step-number){display:block}
#steps .step-button .step-number{display:none}
#steps .step-button small{display:block;margin-top:4px;color:var(--muted);font-size:.75rem;font-weight:400;line-height:1.5}
.dash-summary{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
.dash-stat{display:inline-flex;align-items:baseline;gap:6px;padding:5px 12px;border:1px solid var(--line);border-radius:99px;background:var(--soft);color:var(--muted);font-size:.6875rem;transition:transform 180ms var(--ease),border-color 180ms var(--ease)}
.dash-stat:hover{transform:translateY(-2px);border-color:var(--selected-line)}
.dash-stat b{color:var(--ink);font-weight:650;font-size:.8125rem}
.app-card[hidden],.region-bar[hidden],.choice[hidden],.category-heading[hidden],.panel-actions[hidden],.service-status[hidden]{display:none}
.dash-scroll::-webkit-scrollbar{height:6px}
.dash-table .dash-badge{white-space:nowrap}
.dash-editor .app-card,.dash-editor .region-bar,.dash-editor .choice{cursor:pointer}
.dash-editor .app-card:hover,.dash-editor .region-bar:hover,.dash-editor .choice:hover{border-color:var(--selected-line);background:var(--tint)}
.dash-edit-act{margin-left:auto;flex:0 0 auto;width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--line);border-radius:7px;color:var(--muted);background:var(--soft)}
.dash-editor .app-card:hover .dash-edit-act{color:var(--accent);border-color:var(--selected-line)}
.dash-edit-act svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dash-choice-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:10px}
.dash-row-card{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px;border:1px solid var(--line);border-radius:13px;background:var(--soft);font-size:.8125rem}
.dash-row-card>span:first-child{min-width:0;flex:1}
.dash-row-card strong{display:block;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-row-card small{display:block;margin-top:3px;color:var(--muted);font-size:.6875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-row-card[role="button"]{cursor:pointer;transition:border-color 160ms var(--ease),background 160ms var(--ease)}
.dash-row-card[role="button"]:hover{border-color:var(--selected-line);background:var(--tint)}
.dash-icon-btn{flex:0 0 auto;width:24px;height:24px;display:grid;place-items:center;padding:0;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--muted);font-size:.75rem;line-height:1;cursor:pointer;transition:color 160ms var(--ease),border-color 160ms var(--ease)}
.dash-icon-btn:hover{color:var(--accent);border-color:var(--selected-line)}
.dash-icon-btn:disabled{opacity:.35;cursor:default}
.dash-rule-list{max-height:460px;overflow:auto;padding-right:4px}
.dash-rule-list::-webkit-scrollbar{width:6px}
.dash-rule-list::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px}
.dash-rule-row{display:flex;align-items:center;gap:8px;padding:9px 12px;margin-bottom:6px;border:1px solid var(--line);border-radius:11px;background:var(--soft);font-size:.75rem;transition:border-color .16s var(--ease),background .16s var(--ease)}
.dash-rule-row:hover{border-color:var(--selected-line)}
.dash-rule-row.off{opacity:.5}
.dash-rule-row code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-rule-row .dash-rule-type{flex:0 0 auto;padding:2px 7px;border-radius:6px;background:var(--tint);color:var(--accent);font-size:.625rem;font-weight:600}
/* Rule parts rendered as tappable references into other blocks. */
.dash-rule-flow{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;overflow:hidden}
.dash-rule-key{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink);font:12px ui-monospace,SFMono-Regular,Consolas,monospace}
.dash-rule-arrow{flex:0 0 auto;color:var(--muted);font-size:.7rem}
.dash-ref{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;max-width:170px;padding:2px 9px;border:1px solid var(--selected-line);border-radius:99px;background:var(--tint);color:var(--accent);font-size:.6875rem;font-weight:600;line-height:1.4;white-space:nowrap;cursor:pointer;transition:background .16s var(--ease)}
.dash-ref:hover{background:var(--accent);color:var(--surface)}
.dash-ref span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-ref--direct{border-color:var(--line);background:var(--soft);color:var(--muted)}
.dash-flash{animation:fi-flash 1.5s var(--ease)}
@keyframes fi-flash{0%,100%{box-shadow:0 0 0 0 transparent}25%,75%{box-shadow:0 0 0 3px var(--tint);border-color:var(--accent)}}
.dash-spacer{flex:1}
.dash-modal-card textarea{width:100%;min-height:96px;resize:vertical;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--input);color:var(--ink);font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none}
.dash-modal-card textarea:focus{border-color:var(--selected-line)}
.dash-modal-card .dash-hint{margin:-6px 0 4px;font-size:.6875rem;line-height:1.6;color:var(--muted)}
.dash-toggle{display:flex;align-items:center;gap:8px;margin:16px 0;font-size:.8125rem;color:var(--ink)}
.dash-toggle input{width:16px;height:16px;accent-color:var(--accent)}
.dash-source{margin-top:26px;border-top:1px solid var(--line);padding-top:18px}
.dash-source summary{cursor:pointer;font-size:.8125rem;color:var(--muted)}
.dash-source textarea{display:block;width:100%;min-height:320px;resize:vertical;margin-top:12px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--input);color:var(--ink);font:12px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none;tab-size:2}
.dash-source textarea:focus{border-color:var(--selected-line);box-shadow:0 0 0 3px var(--tint)}
/* Secondary editor. Mobile keeps the inline panel above the list; on desktop
   it becomes a right-side drawer so the list stays visible while editing. */
.dash-modal{display:block;margin:2px 0 18px}
.dash-modal[hidden]{display:none}
.dash-modal-card{width:100%;padding:22px 24px;border:1px solid var(--selected-line);border-left:3px solid var(--accent);border-radius:14px;background:var(--tint);box-shadow:none;animation:fi-panel-in .22s var(--ease)}
@keyframes fi-panel-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@media(min-width:900px){
  .dash-modal{position:fixed;inset:0;z-index:40;display:flex;justify-content:flex-end;margin:0;padding:0;background:rgba(6,8,14,.46);backdrop-filter:blur(3px);animation:fi-scrim-in .2s var(--ease)}
  .dash-modal[hidden]{display:none}
  .dash-modal-card{width:min(480px,46vw);height:100%;max-height:none;overflow-y:auto;overscroll-behavior:contain;padding:26px 28px 40px;border:0;border-left:1px solid var(--glass-edge);border-radius:18px 0 0 18px;background:var(--surface);box-shadow:-24px 0 70px -18px #0009;animation:fi-drawer-in .26s var(--ease)}
  .dash-modal-card::-webkit-scrollbar{width:7px}
  .dash-modal-card::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px}
  .dash-modal-card .dialog-header{position:sticky;top:-26px;z-index:2;margin:-26px -28px 6px;padding:22px 28px 14px;background:linear-gradient(var(--surface) 78%,transparent)}
  .dash-modal-actions{position:sticky;bottom:-40px;margin:26px -28px -40px;padding:14px 28px 20px;background:linear-gradient(transparent,var(--surface) 24%);border-top:1px solid var(--line)}
}
@keyframes fi-scrim-in{from{opacity:0}to{opacity:1}}
@keyframes fi-drawer-in{from{transform:translateX(26px);opacity:.6}to{transform:none;opacity:1}}
.dash-modal-card .dialog-header{margin-bottom:2px}
.dash-modal-card .dialog-header h2{font-size:1rem;font-weight:650;color:var(--ink)}
/* Inline-block rows: unlike flex-wrap, each row's height is decided only by
   the fixed-height items, so no browser can stretch the gap before a wrapped
   row (the recurring "last row has a blank line above it" bug). */
.dash-chips{display:block;font-size:0;line-height:0;padding:6px 8px;border:1px solid var(--line);border-radius:12px;background:var(--input);cursor:text}
.dash-chips:focus-within{border-color:var(--selected-line);box-shadow:0 0 0 3px var(--tint)}
.dash-chips datalist{display:none!important}
.dash-chip,.dash-chip-input{display:inline-flex;vertical-align:middle;height:24px;min-height:24px;max-height:24px;box-sizing:border-box;margin:0 5px 5px 0;font-size:.75rem;line-height:1}
.dash-chip{align-items:center;gap:5px;max-width:100%;padding:0 5px 0 10px;border:1px solid var(--selected-line);border-radius:99px;background:var(--tint);color:var(--ink);cursor:grab}
.dash-chip.dragging{opacity:.4}
.dash-chip>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;line-height:1}
.dash-chip button{flex:none;width:17px;height:17px;display:grid;place-items:center;padding:0;border:0;border-radius:50%;background:transparent;color:var(--muted);font-size:.75rem;line-height:1;cursor:pointer}
.dash-chip button:hover{background:var(--danger-bg);color:var(--danger)}
.dash-modal-card .dash-chip-input,.dash-chip-input{width:130px;min-width:90px;max-width:100%;padding:0 3px;border:0!important;border-radius:0;background:transparent!important;box-shadow:none!important;outline:none;color:var(--ink)}
.dash-chip-input::placeholder{color:var(--muted)}
.dash-chips .dash-chip-input:focus{border:0;box-shadow:none;background:transparent}
.dash-modal-card .dialog-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.dash-modal-card .field{margin:16px 0}
.dash-modal-card .field label{display:block;margin-bottom:6px;font-size:.75rem;font-weight:550;color:var(--muted)}
.dash-modal-card input,.dash-modal-card select{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--input);color:var(--ink);font-size:.8125rem;outline:none}
.dash-modal-card input:focus,.dash-modal-card select:focus{border-color:var(--selected-line)}
.icon-input{display:flex;align-items:center;gap:10px}
.icon-input input{flex:1 1 auto;width:auto;min-width:0}
.icon-input-thumb{flex:0 0 auto;width:42px;height:42px;display:grid;place-items:center;border:1px solid var(--line);border-radius:10px;background:var(--soft);font-size:1.1rem;color:var(--muted)}
.icon-input-preview{flex:0 0 auto;width:42px;height:42px;display:block;padding:3px;border:1px solid var(--line);border-radius:10px;background:var(--soft);object-fit:contain}
.icon-input-thumb[hidden],.icon-input-preview[hidden]{display:none}
/* Config-chain editors: custom controls, no native dropdowns / datalist. */
.dash-modal-section{margin:20px 0 2px;padding:6px 0 7px;border-bottom:1px solid var(--line);font-size:.75rem;font-weight:650;color:var(--ink)}
.dash-chain{margin:2px 0 14px;padding:9px 12px;border-left:2px solid var(--accent);border-radius:0 10px 10px 0;background:var(--soft);color:var(--muted);font-size:.6875rem;line-height:1.7}
.dash-chain b{color:var(--ink);font-weight:600}
.dash-chain-label{color:var(--muted);font-weight:600}
.dash-chain i{font-style:normal;color:var(--accent);padding:0 3px}
.chain-link{display:inline-flex;align-items:center;padding:1px 7px;border:1px solid var(--line);border-radius:99px;background:var(--surface);color:var(--accent);font-size:.6875rem;line-height:1.5;cursor:pointer;transition:background .16s var(--ease)}
.chain-link:hover{background:var(--tint);border-color:var(--selected-line)}
.chain-link--group{font-weight:600}
.dash-pills{display:flex;flex-wrap:wrap;gap:6px;padding:8px;border:1px solid var(--line);border-radius:11px;background:var(--input)}
.dash-pillbox{max-height:138px;overflow:auto}
.dash-pillbox::-webkit-scrollbar{width:6px}
.dash-pillbox::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px}
.dash-pill{padding:5px 11px;border:1px solid var(--line);border-radius:99px;background:var(--soft);color:var(--muted);font-size:.75rem;line-height:1.3;cursor:pointer;transition:color .16s var(--ease),border-color .16s var(--ease),background .16s var(--ease)}
.dash-pill:hover{border-color:var(--selected-line);color:var(--ink)}
.dash-pill.on{border-color:var(--accent);background:var(--tint);color:var(--accent);font-weight:600}
.dash-quick{display:flex;flex-wrap:wrap;gap:5px;flex-basis:100%;margin-top:6px}
.dash-quick button{padding:3px 9px;border:1px dashed var(--line);border-radius:99px;background:transparent;color:var(--muted);font-size:.6875rem;line-height:1.3;cursor:pointer}
.dash-quick button:hover{border-color:var(--selected-line);color:var(--accent);background:var(--tint)}
.dash-chip.default-chip{border-color:var(--accent);background:var(--tint)}
.dash-chip .default-tag{margin-left:2px;padding:1px 5px;border-radius:99px;background:var(--accent);color:var(--surface);font-size:.5625rem;font-style:normal;font-weight:700;letter-spacing:.02em}
.dash-chip .promote{flex:none;width:17px;height:17px;display:grid;place-items:center;padding:0;border:0;border-radius:50%;background:transparent;color:var(--muted);font-size:.7rem;line-height:1;cursor:pointer}
.dash-chip .promote:hover{background:var(--tint);color:var(--accent)}
.rule-link-chip [contenteditable]{overflow:visible;text-overflow:clip;white-space:nowrap;cursor:text;min-width:74px;border-bottom:1px dashed transparent;outline:none}
.rule-link-chip [contenteditable]:focus{border-bottom-color:var(--accent)}
/* ---- strategy/app cards: single-line pills, mirroring config-builder ---- */
#fi-strategies.app-grid,#fi-apps.app-grid{grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:8px}

.dash-group-card{display:flex;align-items:center;gap:9px;padding:7px 11px;min-height:46px;box-sizing:border-box;border:1px solid var(--line);border-radius:999px;background:var(--surface);cursor:pointer;min-width:0;transition:border-color .18s var(--ease),background .18s var(--ease),box-shadow .18s var(--ease)}
.dash-group-card:hover{border-color:var(--selected-line);background:var(--tint);box-shadow:0 5px 14px -10px #0006}
.dash-group-order{flex:0 0 auto;width:16px;color:var(--muted);font:11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;text-align:right;opacity:.55}
.dash-group-card .app-card-icon{flex:0 0 auto;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:color-mix(in srgb,var(--surface) 70%,var(--tint));overflow:hidden}
.dash-group-card .app-card-icon img{width:100%;height:100%;object-fit:contain}
.dash-group-card .app-card-icon-fallback{font-size:.9rem;font-weight:650;color:var(--accent)}
.dash-group-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.8125rem;font-weight:600;color:var(--ink)}
.dash-group-tag{flex:0 0 auto;padding:2px 7px;border:1px solid var(--line);border-radius:999px;background:var(--soft);color:var(--muted);font-size:.625rem;line-height:1.4;white-space:nowrap}
.dash-group-rule-badge{flex:0 0 auto;padding:2px 7px;border-radius:999px;background:var(--soft);color:var(--muted);font-size:.625rem;line-height:1.4;white-space:nowrap}
.dash-group-exit-value{flex:0 0 auto;display:inline-flex;align-items:center;gap:5px;max-width:42%;padding:3px 9px 3px 6px;border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line));border-radius:999px;background:color-mix(in srgb,var(--accent) 10%,var(--surface));color:color-mix(in srgb,var(--accent) 65%,var(--ink));font-size:.6875rem;font-weight:550;line-height:1.2;pointer-events:none}
.dash-group-exit-value--type{border-color:var(--line);background:var(--soft);color:var(--muted)}
.dash-group-exit-glyph{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;color:var(--accent)}
.dash-group-exit-value--type .dash-group-exit-glyph{color:var(--muted)}
.dash-group-exit-glyph svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.dash-group-exit-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-group-card .dash-edit-act{flex:0 0 auto;margin-left:1px}
.dash-choice-grid{grid-template-columns:repeat(auto-fill,minmax(285px,1fr))}
.dash-modal-actions{display:flex;gap:8px;margin-top:22px;flex-wrap:wrap}
.dash-modal-actions .spacer{flex:1}
.dash-copy{flex:0 0 auto;border:1px solid var(--line);background:var(--soft);color:var(--muted);border-radius:8px;padding:4px 8px;font-size:.6875rem;line-height:1.2;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:color 160ms var(--ease),border-color 160ms var(--ease),background 160ms var(--ease)}
.dash-copy:hover{color:var(--accent);border-color:var(--selected-line);background:var(--tint)}
.dash-copy:active{transform:scale(.96)}
.dash-copy svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dash-link{display:inline-flex;flex-direction:column;align-items:flex-start;gap:4px;max-width:280px}
.dash-link-main{display:inline-flex;align-items:center;gap:8px;max-width:100%}
.dash-link code{word-break:break-all}
.dash-link .dash-link-url{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:.6875rem}
.dash-link a{color:var(--accent);text-decoration:none;display:inline-flex;align-items:flex-start;gap:5px;white-space:nowrap}
.dash-link a:hover{text-decoration:underline}
.dash-link a::after{content:"↗";font-size:.75rem;line-height:1.4;opacity:.7}
.step-panel[hidden],.dash-summary[hidden]{display:none}
.dash-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);z-index:99;padding:10px 18px;border:1px solid var(--line);border-radius:99px;background:var(--surface);color:var(--ink);font-size:.8125rem;box-shadow:0 8px 30px #0003;opacity:0;pointer-events:none;transition:opacity 200ms var(--ease),transform 200ms var(--ease)}
.dash-toast.show{opacity:1;transform:translate(-50%,0)}
.dash-toast.err{color:var(--danger)}
.dash-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px}
.dash-empty strong{font-weight:600;color:var(--ink);font-size:.9375rem}
.dash-empty p{margin:0;font-size:.8125rem;line-height:1.7}
.dash-empty a{color:var(--accent);text-decoration:none}
.dash-empty a:hover{text-decoration:underline}
.dash-table{width:100%;border-collapse:collapse;min-width:820px}
.dash-table th,.dash-table td{text-align:left;padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:top;font-size:.8125rem}
.dash-table th{color:var(--muted);font-weight:500;background:var(--soft);white-space:nowrap}
.dash-table tr:last-child td{border-bottom:0}
.dash-table tbody tr{transition:background 160ms var(--ease)}
.dash-table tbody tr:hover{background:var(--tint)}
.dash-table code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--accent);word-break:break-all}
.dash-table .nowrap{white-space:nowrap}
.dash-scroll{overflow-x:auto}
.dash-msg{padding:48px 24px;text-align:center;color:var(--muted)}
.dash-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.6875rem;border:1px solid var(--line);background:var(--soft);color:var(--muted)}
.dash-badge.locked{color:var(--warning);border-color:var(--warning-bg);background:var(--warning-bg)}
.dash-err{color:var(--danger)}
.dash-ok{color:var(--ok)}
button.danger{color:var(--danger);border-color:var(--danger-bg)}
@media(max-width:760px){.site-header{padding-inline:14px}.layout{padding:18px 14px 0}.workspace{padding:24px 18px 0}.journey{position:static}}
`;

export function dashboardHTML({
  linkBase = "",
  adminPath = "/api/admin/configs",
  frontInfoPath = "/api/admin/frontinfo",
  catalogPath = "/api/catalog",
} = {}) {
  const boot = JSON.stringify({ linkBase, adminPath, frontInfoPath, catalogPath })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="dark light">
<title>config-builder · Yggdrasil</title>
<style>${styleSheet()}\n${DASH_ONLY}</style>
<script>
(()=>{var r=document.documentElement;try{r.dataset.theme=localStorage.getItem("yggdrasil:config-builder:theme")==="light"?"light":"dark"}catch{r.dataset.theme="dark"}r.dataset.intro="skip"})();
</script>
</head>
<body>
<header class="site-header">
  <a class="brand" href="../" aria-label="Yggdrasil 项目首页">
    <img src="/assets/favicon.png" width="40" height="40" alt="" decoding="async">
    <span>Yggdrasil<small>config dashboard</small></span>
  </a>
  <div class="header-links">
    <span class="engine"><i aria-hidden="true"></i>为 “为秩序而生” 而生</span>
    <div class="appearance-tools" aria-label="外观设置">
      <button class="theme-toggle button secondary" id="theme-toggle" type="button" aria-label="切换到浅色模式" title="切换主题"><span aria-hidden="true" id="theme-toggle-icon" class="theme-icon"><svg viewBox="0 0 24 24" class="theme-icon-svg"><g class="theme-icon-sun"><circle cx="12" cy="12" r="4.1"/><path class="theme-icon-rays" d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3M5.2 5.2 6.8 6.8M17.2 17.2 18.8 18.8M5.2 18.8 6.8 17.2M17.2 6.8 18.8 5.2"/></g><path class="theme-icon-moon" d="M20.3 14.9A8.5 8.5 0 0 1 9.1 3.7a8.5 8.5 0 1 0 11.2 11.2Z"/></svg></span><span id="theme-toggle-label">浅色</span></button>
    </div>
    <a class="header-link" href="https://github.com/yakasuka/yggdrasil" target="_blank" rel="noopener noreferrer">GitHub <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a>
    <button class="header-link" id="logout" type="button">退出登录</button>
  </div>
</header>

<main class="layout">
  <section class="caustic-hero" aria-label="动态水面效果。点击水面产生涟漪">
    <canvas id="caustic-water" aria-hidden="true"></canvas>
    <div class="caustic-meta"><span><i aria-hidden="true"></i> RATATOSKR · CONFIG STUDIO</span><span>自由生长，生生不息。</span></div>
    <div class="caustic-copy"><div><p>管理订阅链接 · 编辑驱动整个配置工坊的信息</p><h2>配置管理</h2></div><a href="#workspace">开始管理 <span aria-hidden="true">↓</span></a></div>
    <div class="caustic-hint">点击水面，感受涟漪 <svg class="hint-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v14M6 12l6 6 6-6"/></svg></div>
  </section>

  <aside class="journey" aria-label="配置进度">
    <div class="eyebrow">YOUR CONFIGURATION</div>
    <h1>从这里开始。</h1>
    <p class="intro">配置工坊由一份模板生长而来。<br/>每一处修改，都有自己的去向。</p>
    <nav id="steps" aria-label="前端配置步骤">
      <button class="step-button" data-step="general" aria-current="step" type="button"><span class="step-number">1</span><span><strong>基础设置</strong><small>端口 · 模式 · 控制</small></span></button>
      <button class="step-button" data-step="regions" type="button"><span class="step-number">2</span><span><strong>地区节点</strong><small>旗帜 · 匹配规则</small></span></button>
      <button class="step-button" data-step="strategies" type="button"><span class="step-number">3</span><span><strong>节点策略</strong><small>默认出口 · 自动测速</small></span></button>
      <button class="step-button" data-step="apps" type="button"><span class="step-number">4</span><span><strong>APP 分流</strong><small>应用出口 · 命中规则</small></span></button>
      <button class="step-button" data-step="rules" type="button"><span class="step-number">5</span><span><strong>规则补丁</strong><small>命中 · 顺序 · 规则源</small></span></button>
      <button class="step-button" data-step="configs" type="button"><span class="step-number">6</span><span><strong>订阅链接</strong><small>生成与访问权限</small></span></button>
      <span class="step-cursor" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="M3 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </nav>
    <div class="journey-note"><span aria-hidden="true">✳</span><div><strong>一处修改，处处生长。</strong><p>保存后立即生效，并由定时任务写回仓库。</p></div></div>
  </aside>

  <section class="workspace" id="workspace" tabindex="-1" aria-label="配置面板">
    <div class="panel-top">
      <span id="step-caption" class="eyebrow">STEP 01 / 06</span>
      <span class="chip">RATATOSKR</span>
      <div class="panel-actions">
        <button class="icon-text-button" id="fi-reload" type="button" title="重新载入"><span aria-hidden="true">↻</span> 重新载入</button>
        <button class="icon-text-button" id="fi-reset" type="button"><span aria-hidden="true">✕</span> 放弃草稿</button>
      </div>
    </div>
    <div class="service-status" id="service-settings" data-state="ready" role="status">
      <span class="status-dot" aria-hidden="true"></span>
      <span id="fi-source">读取中…</span>
      <button class="status-retry" id="fi-reload-mini" type="button" aria-label="重试连接" title="重试连接">↻</button>
    </div>

    <h2 class="panel-title" id="step-title">先打好地基。</h2>
    <p class="panel-description" id="step-desc">端口、运行模式与控制面板。所有修改都会写回 Ratatoskr 模板，保存后配置工坊立即生效。</p>

    <section class="step-panel" data-panel="general">
      <div class="dash-summary" id="fi-summary"></div>
      <div class="section-label"><span>基础设置</span><small>端口 · 模式 · 日志</small></div>
      <div class="dash-choice-grid dash-editor" id="fi-general"><span class="muted">载入中…</span></div>
      <details class="dash-source">
        <summary>高级 · 直接编辑 YAML 模板</summary>
        <textarea id="fi-text" spellcheck="false" aria-label="YAML 模板内容" placeholder="正在载入模板…"></textarea>
        <div class="panel-actions" style="margin-top:12px">
          <button class="button primary" id="fi-save" type="button">应用源码</button>
          <span class="dash-status dash-ok" id="fi-status" style="margin:0"></span>
        </div>
      </details>
    </section>

    <section class="step-panel" data-panel="regions" hidden>
      <div class="section-label"><span>地区节点</span><small>旗帜 · 显示名 · 匹配规则</small></div>
      <div class="toolbar"><span class="muted" id="fi-region-count">载入中…</span><div class="toolbar-actions"><button class="text-button" id="add-region" type="button">＋ 添加地区</button></div></div>
      <div class="region-bars dash-editor" id="fi-regions"><span class="muted">载入中…</span></div>
    </section>

    <section class="step-panel" data-panel="strategies" hidden>
      <div class="section-label"><span>节点策略</span><small>手动切换 · 自动测速 · 核心组 · 按配置顺序</small></div>
      <div class="toolbar"><input type="search" id="strategy-search" placeholder="搜索策略组" aria-label="搜索策略组"><span class="muted" id="fi-strategy-count">载入中…</span><div class="toolbar-actions"><button class="text-button" id="add-strategy" type="button">＋ 添加策略组</button></div></div>
      <div class="app-grid dash-editor" id="fi-strategies"><span class="muted">载入中…</span></div>
    </section>

    <section class="step-panel" data-panel="apps" hidden>
      <div class="section-label"><span>APP 分流</span><small>应用出口 · 命中规则 · 按配置顺序</small></div>
      <div class="toolbar"><input type="search" id="app-search" placeholder="搜索应用" aria-label="搜索应用"><span class="muted" id="fi-app-count">载入中…</span><div class="toolbar-actions"><button class="text-button" id="add-app" type="button">＋ 添加应用</button></div></div>
      <div class="app-grid dash-editor" id="fi-apps"><span class="muted">载入中…</span></div>
    </section>

    <section class="step-panel" data-panel="rules" hidden>
      <div class="section-label"><span>节点筛选</span><small>净化 · 其他地区 · 地区正则</small></div>
      <div class="dash-choice-grid dash-editor" id="fi-filters"><span class="muted">载入中…</span></div>
      <div class="section-label"><span>分流规则</span><small>顺序决定出口 · 命中即停 · 可编辑 / 启停 / 移动</small></div>
      <div class="toolbar"><input type="search" id="rule-target-filter" placeholder="按出口/匹配项筛选规则" aria-label="筛选规则"><span class="muted" id="fi-rule-count">载入中…</span><div class="toolbar-actions"><button class="text-button" id="add-rule" type="button">＋ 添加规则</button></div></div>
      <div class="dash-rule-list" id="fi-rule-list"><span class="muted">载入中…</span></div>
      <div class="section-label"><span>规则源</span><small>规则集 URL · 更新间隔 · 分类 · 点击编辑</small></div>
      <div class="dash-choice-grid dash-editor" id="fi-providers"><span class="muted">载入中…</span></div>
    </section>

    <section class="step-panel" id="panel-configs" data-panel="configs" hidden>
      <div class="service-status" data-state="ready" role="status"><span class="status-dot" aria-hidden="true"></span><span id="status">加载中…</span><button class="status-retry" id="refresh" type="button" aria-label="重新载入" title="重新载入">↻</button></div>
      <div class="dash-scroll"><div class="dash-msg" id="body">正在加载…</div></div>
    </section>

    <footer class="wizard-footer">
      <button class="button secondary" id="back" type="button">上一步</button>
      <span id="progress-note" class="muted">一处修改，处处生长。</span>
      <button class="button primary" id="next" type="button" data-target="regions">下一步 <span aria-hidden="true">→</span></button>
    </footer>
  </section>
</main>
<site-footer base="/"></site-footer>

<div class="dash-toast" id="toast" role="status" aria-live="polite"></div>

<div class="dash-modal" id="fi-modal" hidden role="dialog" aria-modal="true" aria-labelledby="fi-modal-title">
  <div class="dash-modal-card">
    <div class="dialog-header"><h2 id="fi-modal-title">编辑</h2><button class="icon-button" id="fi-modal-close" type="button" aria-label="关闭">✕</button></div>
    <div id="fi-modal-body"></div>
    <div class="dash-modal-actions">
      <button class="button secondary danger" id="fi-modal-remove" type="button">移除</button>
      <span class="spacer"></span>
      <button class="button secondary" id="fi-modal-cancel" type="button">取消</button>
      <button class="button primary" id="fi-modal-apply" type="button">保存并生效</button>
    </div>
  </div>
</div>

<script>${waterScript()}</script>
<script type="module">${footerScript()}</script>
<script>
(function(){
"use strict";
var CFG=${boot};
var themeKey="yggdrasil:config-builder:theme";
var system=matchMedia("(prefers-color-scheme: light)");
var saved=null;try{var v=localStorage.getItem(themeKey);if(v==="light"||v==="dark")saved=v}catch(e){}
var toggle=document.getElementById("theme-toggle");
function applyTheme(){
  var theme=saved||(system.matches?"light":"dark");
  document.documentElement.dataset.theme=theme;
  var light=theme==="light";
  toggle.setAttribute("aria-label","切换到"+(light?"深色":"浅色")+"模式");
  document.getElementById("theme-toggle-label").textContent=light?"深色":"浅色";
}
system.addEventListener("change",function(){if(!saved)applyTheme()});
toggle.addEventListener("click",function(){
  saved=document.documentElement.dataset.theme==="light"?"dark":"light";
  try{localStorage.setItem(themeKey,saved)}catch(e){}
  applyTheme();
});
applyTheme();

function el(tag,text){var n=document.createElement(tag);if(text!=null)n.textContent=text;return n}
var toast=document.getElementById("toast"),toastTimer=null;
function notify(text,isErr){
  toast.textContent=text;
  toast.className="dash-toast show"+(isErr?" err":"");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){toast.className="dash-toast"},2400);
}
function copyIcon(){
  var s=document.createElementNS("http://www.w3.org/2000/svg","svg");
  s.setAttribute("viewBox","0 0 24 24");s.setAttribute("aria-hidden","true");
  var p=document.createElementNS("http://www.w3.org/2000/svg","path");
  p.setAttribute("d","M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1");
  s.appendChild(p);return s;
}
function copyButton(text,label){
  var b=el("button");b.className="dash-copy";b.type="button";
  b.title=label||"复制订阅链接";b.setAttribute("aria-label",b.title);
  b.appendChild(copyIcon());b.appendChild(el("span","复制"));
  b.addEventListener("click",function(){
    var done=function(){notify("已复制订阅链接");var sp=b.getElementsByTagName("span")[0];if(sp){var old=sp.textContent;sp.textContent="已复制";setTimeout(function(){sp.textContent=old},1500)}};
    var fail=function(){
      // Select the visible link so a plain Ctrl/Cmd+C still works when the
      // Clipboard API is unavailable (e.g. non-secure or restricted contexts).
      var cell=b.closest("td");var code=cell&&cell.getElementsByTagName("code")[0];
      if(code&&window.getSelection){var r=document.createRange();r.selectNodeContents(code);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(r)}
      notify("已选中链接，请按 Ctrl/Cmd+C 复制",true);
    };
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(function(){fallbackCopy(text,done,fail)});
    }else fallbackCopy(text,done,fail);
  });
  return b;
}
function fallbackCopy(text,done,fail){
  var ta=el("textarea");ta.value=text;ta.setAttribute("readonly","");
  ta.style.cssText="position:fixed;top:-1000px;opacity:0";
  document.body.appendChild(ta);ta.select();var ok=false;
  try{ok=document.execCommand("copy")}catch(e){}
  document.body.removeChild(ta);ok?done():fail();
}
function stamp(value){if(!value)return "—";var d=new Date(value);return isNaN(d.getTime())?String(value):d.toLocaleString("zh-CN",{hour12:false})}
function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var EDIT_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>';
var ARROW_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>';
var TYPE_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h11M4 17h7"/></svg>';

/* ---- step navigation: same one-category-at-a-time flow as the builder ---- */
var stepPanels=[].slice.call(document.querySelectorAll(".step-panel"));
var caption=document.getElementById("step-caption");
var stepTitle=document.getElementById("step-title");
var stepDesc=document.getElementById("step-desc");
var progressNote=document.getElementById("progress-note");
var backButton=document.getElementById("back");
var nextButton=document.getElementById("next");
var stepButtons=[].slice.call(document.querySelectorAll(".step-button"));
var stepActions=document.querySelector(".panel-top .panel-actions");
var serviceSettings=document.getElementById("service-settings");
var summaryStrip=document.getElementById("fi-summary");
var STEP_ORDER=["general","regions","strategies","apps","rules","configs"];
var STEP_META={
  general:{title:"先打好地基。",desc:"端口、运行模式与控制面板。所有修改都会写回 Ratatoskr 模板，保存后配置工坊立即生效。",note:"一处修改，处处生长。"},
  regions:{title:"节点去哪里，由你决定。",desc:"编辑地区旗帜、显示名称与匹配正则。修改会同步到对应策略组与分流规则。",note:"地区即路线。"},
  strategies:{title:"让节点，按你的方式连接。",desc:"手动切换、自动测速与核心策略组：名称（含 Emoji）、图标、出口顺序。改名会自动同步所有引用。",note:"节点策略，是默认出口。"},
  apps:{title:"每个 APP，都有自己的去向。",desc:"应用策略组：名称（含 Emoji）、图标、分类、出口。命中规则写在卡片折叠区，改名会自动同步所有引用。",note:"APP 分流，挂在策略组上。"},
  rules:{title:"让流量各得其所。",desc:"规则是附加在策略组上的补丁：命中项、出口、命中顺序与规则源。改名的引用同步会在保存时一次性写回。",note:"规则是挂在策略组上的补丁。"},
  configs:{title:"所有订阅，都在这里。",desc:"点击订阅链接可直接查看内容；也可以复制、删除配置。配置由订阅工坊生成。",note:"配置由订阅工坊生成。"}
};
// Same spring cursor as the builder (motion.js), so the pointer before each
// category behaves and animates identically instead of being a text glyph.
function reducedMotion(){return matchMedia("(prefers-reduced-motion: reduce)").matches}
function springStep(value,velocity,target,dt,response){
  var omega=(2*Math.PI)/(response||0.42),offset=value-target;
  var impulse=(velocity+omega*offset)*dt,decay=Math.exp(-omega*dt);
  return [target+(offset+impulse)*decay,(velocity-omega*impulse)*decay];
}
function springPosition(update){
  var x=0,y=0,vx=0,vy=0,tx=0,ty=0,frame=0,last=0,initialized=false;
  function tick(now){
    var dt=Math.min((now-last)/1000||1/60,0.064);last=now;
    var a=springStep(x,vx,tx,dt),b=springStep(y,vy,ty,dt);
    x=a[0];vx=a[1];y=b[0];vy=b[1];
    var resting=Math.abs(tx-x)+Math.abs(ty-y)<0.05&&Math.abs(vx)+Math.abs(vy)<0.2;
    if(resting){x=tx;y=ty}
    update(x,y);frame=resting?0:requestAnimationFrame(tick);
  }
  return function(nextX,nextY){
    tx=nextX;ty=nextY;
    if(!initialized||reducedMotion()){initialized=true;cancelAnimationFrame(frame);frame=0;vx=vy=0;x=tx;y=ty;update(x,y)}
    else if(!frame){last=performance.now();frame=requestAnimationFrame(tick)}
  };
}
function progressCursor(nav){
  var cursor=nav.querySelector(".step-cursor");if(!cursor)return function(){};
  var target;
  var move=springPosition(function(x,y){cursor.style.transform="translate3d("+x+"px,"+y+"px,0)"});
  function position(){
    if(!target)return;
    var parent=nav.getBoundingClientRect(),child=target.getBoundingClientRect();
    var horizontal=matchMedia("(max-width: 680px)").matches;
    move(horizontal?child.left-parent.left+child.width/2-9:0,
      horizontal?0:child.top-parent.top+child.height/2-9);
  }
  if(window.ResizeObserver)new ResizeObserver(position).observe(nav);
  return function(element){target=element;position()};
}
var pointToStep=progressCursor(document.getElementById("steps"));
function showStep(which){
  closeModal();
  var i=STEP_ORDER.indexOf(which);
  if(i<0)i=0;
  which=STEP_ORDER[i];
  var front=which!=="configs",meta=STEP_META[which];
  stepPanels.forEach(function(p){p.hidden=p.dataset.panel!==which});
  stepButtons.forEach(function(b){if(b.dataset.step===which)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current")});
  pointToStep(document.querySelector('.step-button[aria-current="step"]'));
  caption.textContent="STEP "+String(i+1).padStart(2,"0")+" / "+String(STEP_ORDER.length).padStart(2,"0");
  stepTitle.textContent=meta.title;
  stepDesc.textContent=meta.desc;
  stepActions.hidden=!front;
  serviceSettings.hidden=!front;
  summaryStrip.hidden=which!=="general";
  progressNote.textContent=meta.note;
  backButton.disabled=i===0;
  var last=i===STEP_ORDER.length-1;
  nextButton.dataset.target=last?"general":STEP_ORDER[i+1];
  nextButton.innerHTML=last?'回到第一步 <span aria-hidden="true">↺</span>':'下一步 <span aria-hidden="true">→</span>';
  if(!front)load();
  var ws=document.getElementById("workspace");
  if(ws&&window.scrollY>ws.offsetTop-140)ws.scrollIntoView({behavior:"smooth",block:"start"});
}
window.addEventListener("beforeunload",function(e){
  if(!fiDirty)return;
  e.preventDefault();e.returnValue="";
});
function guardedStep(which){
  var current=document.querySelector('.step-button[aria-current="step"]');
  if(current&&current.dataset.step===which)return;
  if(fiDirty&&!window.confirm("前端模板有未保存的修改，切换后将丢失。确定继续？"))return;
  showStep(which);
}
stepButtons.forEach(function(b){b.addEventListener("click",function(){guardedStep(b.dataset.step)})});
backButton.addEventListener("click",function(){
  var i=STEP_ORDER.indexOf(document.querySelector('.step-button[aria-current="step"]').dataset.step);
  if(i>0)guardedStep(STEP_ORDER[i-1]);
});
nextButton.addEventListener("click",function(){guardedStep(nextButton.dataset.target)});

/* ---- front-end graphical editor ---- */
var state={text:"",catalog:null,source:"repository",updatedAt:null};
var fiDirty=false;
var fiSource=document.getElementById("fi-source");
var fiText=document.getElementById("fi-text");
var fiStatus=document.getElementById("fi-status");
var fiSummary=document.getElementById("fi-summary");
var modal=document.getElementById("fi-modal");
var modalTitle=document.getElementById("fi-modal-title");
var modalBody=document.getElementById("fi-modal-body");
var modalRemove=document.getElementById("fi-modal-remove");
var editCtx=null;
// Which list each editor kind belongs to. The inline editor is mounted just
// before that list, so it reads as a second-level panel of the current step.
var EDITOR_HOST={general:"fi-general","core-group":"fi-strategies",strategy:"fi-strategies",add:"fi-apps",app:"fi-apps",region:"fi-regions",filter:"fi-filters",rule:"fi-rule-list","add-rule":"fi-rule-list",provider:"fi-providers"};
function mountEditor(kind,item){
  var hostId=EDITOR_HOST[kind]||"";
  // Every group card opens with kind:"group"; route it to the right step by
  // its classification — apps to APP 分流, everything else to 节点策略.
  if(kind==="group")hostId=(item&&item.kind==="app")?"fi-apps":"fi-strategies";
  var host=document.getElementById(hostId||"");
  if(host&&host.parentNode){
    host.parentNode.insertBefore(modal,host);
    // Mobile inline: bring the panel into view. Desktop drawer: it is fixed,
    // so instead reset its own scroll to the top for each newly opened editor.
    if(matchMedia("(min-width:900px)").matches){
      var card=modal.querySelector(".dash-modal-card");
      if(card)card.scrollTop=0;
    }else{
      try{modal.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}
    }
  }
}
function fiMsg(text,cls){fiStatus.className="dash-status"+(cls?" "+cls:"");fiStatus.textContent=text||""}
function summaryStats(s){
  fiSummary.textContent="";
  if(!s)return;
  [["地区",s.regions],["应用",s.apps],["规则",s.rules],["策略",s.strategies],["版本",s.version]].forEach(function(p){
    var box=el("div");box.className="dash-stat";
    box.appendChild(document.createTextNode(p[0]+" "));
    box.appendChild(el("b",p[1]==null?"—":String(p[1])));
    fiSummary.appendChild(box);
  });
}
function iconImg(url,cls,fallback){
  if(url)return '<img class="'+cls+'" src="'+esc(url)+'" alt="" decoding="async" onerror="this.hidden=true">';
  return '<span class="flag" aria-hidden="true">'+esc(fallback||"✳")+'</span>';
}
// Unified strategy-group view. Every group is the same entity; kind and
// category are just labels. Field order on the card matches the editor:
// name (with emoji) → icon → category → default exit. Inbound rules live in a
// collapsible details element at the bottom so they never crowd the main fields.
function renderGroupSet(cat,hostId,countId,kinds,countLabel){
  var host=document.getElementById(hostId);host.textContent="";
  var groups=((cat.editorModel&&cat.editorModel.groups)||[]).filter(function(g){return kinds.indexOf(g.kind)>=0});
  var count=document.getElementById(countId);
  if(count)count.textContent=groups.length+" "+countLabel+" · 按配置顺序 · 点击编辑";
  var KIND_LABEL={core:"核心",strategy:"策略",app:"应用",region:"地区"};
  // Strict YAML order: editorModel.groups is already in template order.
  // Render as-is top-to-bottom; category/kind shown as a small tag on each card.
  groups.forEach(function(g,idx){
    var card=document.createElement("div");
    card.className="dash-group-card";
    card.setAttribute("role","button");card.tabIndex=0;
    card.setAttribute("data-app-label",String(g.name+" "+g.label).toLowerCase());
    card.setAttribute("aria-label","编辑策略组 "+g.name);
    var icon=g.icon
      ? '<img src="'+esc(g.icon)+'" alt="" decoding="async" onerror="this.hidden=true">'
      : '<span class="app-card-icon-fallback">'+esc(String(g.label||g.name||"✳").slice(0,1))+'</span>';
    var first=g.proxies&&g.proxies[0];
    var rules=g.inbound||[];
    var tag=g.category||KIND_LABEL[g.kind]||"";
    var tagHtml=tag?'<span class="dash-group-tag">'+esc(tag)+'</span>':'';
    // Single-line pill: icon + name + category + rule count + exit. Every group
    // gets one identical exit pill (SVG glyph + value); rule editing lives in
    // the drawer, so the card just carries a lightweight count badge.
    var exitValue=first||g.type||"select";
    var exitGlyph=first?ARROW_SVG:TYPE_SVG;
    var exit='<span class="dash-group-exit-value'+(first?"":" dash-group-exit-value--type")+'">'+
      '<span class="dash-group-exit-glyph" aria-hidden="true">'+exitGlyph+'</span>'+
      '<span class="dash-group-exit-text">'+esc(exitValue)+'</span></span>';
    var ruleBadge=rules.length?'<span class="dash-group-rule-badge" title="'+rules.length+' 条关联规则">规则 '+rules.length+'</span>':'';
    card.innerHTML='<span class="dash-group-order">'+(idx+1)+'</span>'+
      '<span class="app-card-icon">'+icon+'</span>'+
      '<span class="dash-group-title">'+esc(g.name)+'</span>'+
      tagHtml+ruleBadge+exit+
      '<span class="dash-edit-act">'+EDIT_SVG+'</span>';
    function open(){openEditor({kind:"group",item:g})}
    card.addEventListener("click",open);
    card.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
    host.appendChild(card);
  });
}
// Two steps mirror the builder: node strategies (manual/auto/core) and APP
// routing. Both render the same YAML-ordered group cards, split by kind.
function renderStrategies(cat){renderGroupSet(cat,"fi-strategies","fi-strategy-count",["core","strategy","region"],"个策略组")}
function renderApps(cat){renderGroupSet(cat,"fi-apps","fi-app-count",["app"],"个应用")}
function bindGroupSearch(inputId,hostId){
  var input=document.getElementById(inputId);
  if(!input)return;
  input.addEventListener("input",function(){
    var q=input.value.trim().toLowerCase();
    [].forEach.call(document.querySelectorAll("#"+hostId+" .dash-group-card"),function(card){
      card.hidden=!!q&&(card.getAttribute("data-app-label")||"").indexOf(q)<0;
    });
  });
}
bindGroupSearch("strategy-search","fi-strategies");
bindGroupSearch("app-search","fi-apps");
function renderRegions(cat){
  var host=document.getElementById("fi-regions");host.textContent="";
  var rc=document.getElementById("fi-region-count");
  if(rc)rc.textContent=(cat.regions||[]).length+" 个地区 · 按配置顺序 · 点击编辑";
  (cat.regions||[]).forEach(function(r){
    var bar=document.createElement("div");bar.className="region-bar";bar.setAttribute("role","button");bar.tabIndex=0;
    bar.setAttribute("aria-label","编辑地区 "+r.label);
    bar.innerHTML=iconImg(r.icon,"region-flag",r.flag)+'<span class="region-name">'+esc(r.label)+'</span>';
    var open=function(){openEditor({kind:"region",item:r})};
    bar.addEventListener("click",open);
    bar.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
    host.appendChild(bar);
  });
}
function rowCard(title,subtitle,onOpen){
  var c=document.createElement("div");c.className="dash-row-card";
  c.setAttribute("role","button");c.tabIndex=0;
  var text=document.createElement("span");
  text.innerHTML="<strong>"+esc(title)+"</strong><small>"+esc(subtitle)+"</small>";
  c.appendChild(text);
  var edit=document.createElement("span");edit.className="dash-edit-act";edit.innerHTML=EDIT_SVG;c.appendChild(edit);
  c.addEventListener("click",onOpen);
  c.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpen()}});
  return c;
}
function renderGeneral(cat){
  var host=document.getElementById("fi-general");host.textContent="";
  var g=(cat.editor&&cat.editor.general)||{};
  var open=function(){openEditor({kind:"general"})};
  host.appendChild(rowCard("端口与访问",
    "HTTP "+(g.port??"—")+" · SOCKS "+(g["socks-port"]??"—")+" · "+(g["allow-lan"]?"允许局域网":"仅本机"),open));
  host.appendChild(rowCard("运行模式","mode: "+(g.mode||"—")+" · 日志 "+(g["log-level"]||"—"),open));
  host.appendChild(rowCard("控制面板",(g["external-controller"]||"—")+" · 统一延迟 "+(g["unified-delay"]?"开":"关"),open));
}
function renderCore(cat){
  var host=document.getElementById("fi-core");host.textContent="";
  var groups=(cat.editor&&cat.editor.groups)||[];
  var names=[];
  Object.keys(cat.groups||{}).forEach(function(k){
    var n=cat.groups[k];
    if(typeof n==="string"&&groups.some(function(g){return g.name===n})&&names.indexOf(n)<0)names.push(n);
  });
  names.forEach(function(name){
    var g=groups.find(function(x){return x.name===name});
    host.appendChild(rowCard(name,g.type+" · "+(g.proxies?g.proxies.split(",").length+" 个出口":"无出口列表"),function(){
      openEditor({kind:"core-group",item:g});
    }));
  });
}
function renderFilters(cat){
  var host=document.getElementById("fi-filters");host.textContent="";
  var f=(cat.editor&&cat.editor.filters)||{};
  var items=[
    {id:"all",label:"节点净化 FilterAll",value:f.all||""},
    {id:"others",label:"其他地区 FilterOthers",value:f.others||""}
  ];
  Object.keys(f.regions||{}).forEach(function(id){
    items.push({id:id,label:"地区 "+id,value:f.regions[id]||""});
  });
  items.forEach(function(item){
    host.appendChild(rowCard(item.label,item.value?item.value.slice(0,42)+"…":"未设置",function(){
      openEditor({kind:"filter",item:item});
    }));
  });
}
// Human-friendly formatting so ordinary users never have to read raw seconds
// or internal module ids. 28800 -> "8 小时", "proxy-extra" -> "增强代理规则集".
function humanInterval(sec){
  var n=Number(sec);
  if(!n||n<=0)return "不自动更新";
  if(n%86400===0)return (n/86400)+" 天";
  if(n%3600===0)return (n/3600)+" 小时";
  if(n%60===0)return (n/60)+" 分钟";
  return n+" 秒";
}
var MODULE_LABEL={
  "direct-extra":"增强直连规则集","proxy-extra":"增强代理规则集",
  "ports":"特殊端口直连","cn":"国内域名","global":"全球域名",
  "gfw":"受限制域名","game-direct":"国服游戏直连","adguard":"广告拦截"
};
function moduleLabel(id){return MODULE_LABEL[id]||id||"—"}
function ruleParts(rule){
  var parts=String(rule||"").split(",");
  return {type:parts[0]||"GEOSITE",key:parts[1]||"",target:parts[2]||"",extra:parts.slice(3).join(",")};
}
function joinRule(parts){
  return [parts.type,parts.key,parts.target,parts.extra].filter(function(x){return x!== ""&&x!=null}).join(",");
}
function iconButton(symbol,title,onClick,disabled){
  var b=document.createElement("button");b.type="button";b.className="dash-icon-btn";
  b.textContent=symbol;b.title=title;b.setAttribute("aria-label",title);b.disabled=!!disabled;
  b.addEventListener("click",function(e){e.stopPropagation();onClick()});return b;
}
function refChip(text,onClick,clickable){
  var c=document.createElement("button");c.type="button";
  c.className="dash-ref"+(clickable?"":" dash-ref--direct");
  var label=document.createElement("span");label.textContent=text;c.appendChild(label);
  c.title=clickable?("跳转到 "+text):text;
  if(clickable)c.addEventListener("click",function(e){e.stopPropagation();onClick()});
  else c.disabled=true;
  return c;
}
function bindRuleFilter(){
  var input=document.getElementById("rule-target-filter");if(!input)return;
  input.addEventListener("input",function(){
    var q=input.value.trim().toLowerCase();
    [].slice.call(document.querySelectorAll("#fi-rule-list .dash-rule-row")).forEach(function(row){
      row.hidden=!!q&&(row.getAttribute("data-rule-text")||"").toLowerCase().indexOf(q)<0;
    });
  });
}
bindRuleFilter();
function renderRuleList(cat){
  var host=document.getElementById("fi-rule-list");host.textContent="";
  var rules=(cat.editor&&cat.editor.rules)||[];
  var enabled=rules.filter(function(r){return r.enabled}).length;
  var count=document.getElementById("fi-rule-count");
  if(count)count.textContent=enabled+" / "+rules.length+" 条启用 · 自上而下匹配";
  rules.forEach(function(r,index){
    var row=document.createElement("div");row.className="dash-rule-row"+(r.enabled?"":" off");
    row.setAttribute("data-rule-text",r.rule);
    var type=document.createElement("span");type.className="dash-rule-type";type.textContent=r.type;row.appendChild(type);
    // Flow: GEOSITE [openai] → [⚡ OpenAI]. Both ends are references into other blocks.
    var flow=document.createElement("span");flow.className="dash-rule-flow";
    var key=document.createElement("span");key.className="dash-rule-key";key.textContent=r.key;flow.appendChild(key);
    // RULE-SET matchers point at a rule provider; jump there.
    if(r.type==="RULE-SET"&&r.key)flow.appendChild(refChip(r.key,function(){jumpToProvider(r.key)},false));
    var arrow=document.createElement("span");arrow.className="dash-rule-arrow";arrow.textContent="→";flow.appendChild(arrow);
    var isSpecial=(r.target==="DIRECT"||r.target==="REJECT");
    flow.appendChild(refChip(r.target,function(){if(!isSpecial)jumpToGroup(r.target)},!isSpecial));
    row.appendChild(flow);
    row.title=r.rule;
    row.appendChild(iconButton(r.enabled?"◉":"○",r.enabled?"停用":"启用",function(){
      sendOps([{kind:"rule",rule:r.rule,enabled:!r.enabled}]);
    }));
    row.appendChild(iconButton("✎","编辑规则",function(){openEditor({kind:"rule",item:r,index:index})}));
    row.appendChild(iconButton("✕","删除规则",function(){
      if(!window.confirm("从模板中删除规则 “"+r.rule+"”？此操作不可撤销。"))return;
      sendOps([{kind:"rule-remove",rule:r.rule}]);
    }));
    var spacer=document.createElement("span");spacer.className="dash-spacer";row.appendChild(spacer);
    row.appendChild(iconButton("↑","上移",function(){sendOps([{kind:"rule-move",rule:r.rule,to:"up"}])}));
    row.appendChild(iconButton("↓","下移",function(){sendOps([{kind:"rule-move",rule:r.rule,to:"down"}])}));
    host.appendChild(row);
  });
}
function renderProviders(cat){
  var host=document.getElementById("fi-providers");host.textContent="";
  (cat.providerModules||[]).forEach(function(m){
    var v=m.value||{};
    var count=(cat.orderedRules||[]).filter(function(r){return r.module===m.module}).length;
    // Human-readable subtitle: category label + interval in plain words.
    var sub=moduleLabel(m.module)+" · 每 "+humanInterval(v.interval)+"更新"+(count?" · "+count+" 条规则":"");
    host.appendChild(rowCard(m.name,sub,function(){
      openEditor({kind:"provider",item:m});
    }));
  });
}
function renderCatalog(cat,summary){
  if(!cat)return;
  state.catalog=cat;
  summaryStats(summary);
  renderGeneral(cat);renderRegions(cat);renderStrategies(cat);renderApps(cat);
  renderFilters(cat);renderRuleList(cat);renderProviders(cat);
}
function loadFront(){
  fiMsg("读取中…");
  fetch(CFG.frontInfoPath,{headers:{"Cache-Control":"no-store"}})
  .then(function(r){if(r.status===401)throw Error("登录已过期，请重新登录。");if(!r.ok)throw Error("读取失败 ("+r.status+")");return r.json()})
  .then(function(d){
    state.text=d.text||"";state.source=d.source;state.updatedAt=d.updatedAt||null;
    fiText.value=state.text;fiDirty=false;
    var draft=d.source==="draft";
    fiSource.textContent=draft?("草稿 · "+(d.updatedAt?stamp(d.updatedAt):"")):"仓库版本";
    fiSource.className="dash-badge "+(draft?"locked":"open");
    renderCatalog(d.catalog,d.summary);
    document.getElementById("service-settings").setAttribute("data-state","ready");
    fiMsg("");
  })
  .catch(function(e){fiMsg(e.message,"dash-err")});
}

/* ---- graphical edit modal ---- */
function field(label,control){
  var w=document.createElement("div");w.className="field";
  w.appendChild(el("label",label));w.appendChild(control);
  // Return the CONTROL, not its wrapper: every caller reads the value from
  // the field map when building patch ops. Returning the wrapper used to
  // make all graphical saves throw before the request was ever sent.
  control._wrapper=w;return control;
}
function appendField(control){modalBody.appendChild(control._wrapper||control)}
function input(value,type){var i=document.createElement("input");i.type=type||"text";i.value=value==null?"":value;return i}
// Icon URL input with a live thumbnail preview. Returns a wrapper that proxies
// .value so every existing save handler keeps reading f.icon.value unchanged.
function iconInput(value){
  var wrap=el("div");wrap.className="icon-input";
  var i=input(value);i.placeholder="https://… 图标地址";
  var thumb=el("span","🖼");thumb.className="icon-input-thumb";
  var preview=document.createElement("img");preview.className="icon-input-preview";preview.alt="图标预览";
  function sync(){
    var url=i.value.trim();
    if(!url){preview.hidden=true;preview.removeAttribute("src");thumb.hidden=false;return}
    thumb.hidden=true;preview.hidden=false;preview.src=url;
  }
  i.addEventListener("input",sync);sync();
  preview.addEventListener("error",function(){preview.hidden=true;thumb.hidden=false});
  preview.addEventListener("load",function(){if(i.value.trim()){preview.hidden=false;thumb.hidden=true}});
  wrap.appendChild(i);wrap.appendChild(thumb);wrap.appendChild(preview);
  Object.defineProperty(wrap,"value",{get:function(){return i.value},set:function(v){i.value=v;sync()}});
  wrap.focus=function(){i.focus()};
  return wrap;
}
function checkbox(value){var i=document.createElement("input");i.type="checkbox";i.checked=!!value;return i}
function textarea(value){var t=document.createElement("textarea");t.value=value||"";t.spellcheck=false;return t}
function select(options,value){
  var s=document.createElement("select");
  options.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];if(o[0]===value)op.selected=true;s.appendChild(op)});
  return s;
}
/* ---- reusable, genuinely modular list editors ---- */
function splitList(value){
  return String(value||"").split(",").map(function(x){return x.trim()}).filter(function(x){return x!==""});
}
var chipSeq=0;
// A chip control behaves like an input (it exposes .value) so every existing
// save handler keeps working, but the user can add/remove/reorder items.
function chipControl(initial,serialize,placeholder,suggestions,markFirst){
  var items=initial.slice(),root=el("div");
  root.className="dash-chips";
  var box=input("");box.className="dash-chip-input";box.placeholder=placeholder||"输入后回车添加";
  if(suggestions&&suggestions.length){
    var dl=el("datalist");dl.id="chip-suggest-"+(++chipSeq);
    suggestions.forEach(function(s){var op=el("option");op.value=s;dl.appendChild(op)});
    box.setAttribute("list",dl.id);root.appendChild(dl);
  }
  var dragIndex=-1;
  function changed(){fiDirty=true;notify("已修改，点击「保存并生效」写回模板")}
  function add(){
    var v=box.value.trim();if(!v)return;
    if(items.indexOf(v)<0){items.push(v);paint();changed()}
    box.value="";box.focus();
  }
  function paint(){
    [].slice.call(root.querySelectorAll(".dash-chip")).forEach(function(n){root.removeChild(n)});
    items.forEach(function(text,i){
      var chip=el("span");chip.className="dash-chip"+(markFirst&&i===0?" default-chip":"");chip.draggable=true;
      chip.title=markFirst&&i===0?"默认出口 · 拖动排序 · 点击 × 删除":"拖动排序 · 点击 × 删除";
      chip.appendChild(el("span",text));
      if(markFirst){
        if(i===0)chip.appendChild(el("em","默认")).className="default-tag";
        else{var promote=el("button","↑");promote.type="button";promote.title="设为默认出口";promote.addEventListener("click",function(e){e.stopPropagation();var m=items.splice(i,1)[0];items.unshift(m);paint();changed()});chip.appendChild(promote)}
      }
      var rm=el("button","×");rm.type="button";rm.title="删除 "+text;rm.setAttribute("aria-label",rm.title);
      rm.addEventListener("click",function(e){e.stopPropagation();items.splice(i,1);paint();changed()});
      chip.appendChild(rm);
      chip.addEventListener("dragstart",function(){dragIndex=i;chip.classList.add("dragging")});
      chip.addEventListener("dragend",function(){chip.classList.remove("dragging");dragIndex=-1});
      chip.addEventListener("dragover",function(e){e.preventDefault()});
      chip.addEventListener("drop",function(e){
        e.preventDefault();if(dragIndex<0||dragIndex===i)return;
        var moved=items.splice(dragIndex,1)[0];items.splice(i,0,moved);dragIndex=-1;paint();changed();
      });
      root.insertBefore(chip,box);
    });
  }
  box.addEventListener("keydown",function(e){
    if(e.key==="Enter"||e.key===","){e.preventDefault();add()}
    else if(e.key==="Backspace"&&!box.value&&items.length){e.preventDefault();items.pop();paint();changed()}
  });
  box.addEventListener("blur",add);
  root.appendChild(box);paint();
  Object.defineProperty(root,"value",{get:function(){return serialize(items)},configurable:true});
  return root;
}
function proxySuggestions(){
  var names=["DIRECT","REJECT"],groups=(state.catalog&&state.catalog.editor&&state.catalog.editor.groups)||[];
  groups.forEach(function(g){if(names.indexOf(g.name)<0)names.push(g.name)});
  return names;
}
function proxyChips(value){
  return chipControl(splitList(value),function(items){return items.join(", ")},"输入出口名后回车",null,true);
}
// Pill-style single choice — replaces native <select> so the chain reads as
// tappable chips instead of a browser dropdown menu.
function pillSelect(options,value){
  var root=el("div");root.className="dash-pills";
  if(options.length>8)root.classList.add("dash-pillbox");
  var cur=value;
  function paint(){
    [].slice.call(root.querySelectorAll(".dash-pill")).forEach(function(n){root.removeChild(n)});
    options.forEach(function(o){
      var b=el("button",o[1]);b.type="button";b.className="dash-pill"+(o[0]===cur?" on":"");
      b.addEventListener("click",function(){cur=o[0];paint();fiDirty=true;notify("已修改，点击「保存并生效」写回模板")});
      root.appendChild(b);
    });
  }
  paint();
  Object.defineProperty(root,"value",{get:function(){return cur},configurable:true});
  return root;
}
// Rules that target a given group, as editable chips. The target is fixed to
// the group being edited (that IS the config relationship: rule -> group).
// Each chip stores the full original rule line so removing/editing is exact.
function ruleChips(target,rules){
  var items=(rules||[]).map(function(r){return {text:String(r),orig:String(r),removed:false}});
  var root=el("div");root.className="dash-chips";
  var box=input("");box.className="dash-chip-input";box.placeholder="TYPE,匹配项  如 GEOSITE,openai";
  var dragIndex=-1;
  function changed(){fiDirty=true;notify("已修改，点击「保存并生效」写回模板")}
  function add(){
    var v=box.value.trim();if(!v)return;
    v=v.replace(/^-\s*/,"");
    var parts=v.split(",").map(function(x){return x.trim()});
    var type=(parts[0]||"GEOSITE").toUpperCase();
    if(["GEOSITE","RULE-SET","GEOIP","DOMAIN","IP","MATCH"].indexOf(type)<0){fiMsg("规则类型需为 GEOSITE / RULE-SET / GEOIP 等","dash-err");return}
    var key=parts[1]||"";if(!key){fiMsg("请填写匹配项，如 GEOSITE,openai","dash-err");return}
    var extra=parts.slice(3).join(",");
    var full=[type,key,target,extra].filter(function(x){return x!==""}).join(",");
    if(!items.some(function(it){return !it.removed&&it.text===full})){items.push({text:full,removed:false});paint();changed()}
    box.value="";box.focus();
  }
  function paint(){
    [].slice.call(root.querySelectorAll(".dash-chip")).forEach(function(n){root.removeChild(n)});
    items.forEach(function(it,i){
      if(it.removed)return;
      var chip=el("span");chip.className="dash-chip rule-link-chip";chip.draggable=true;
      chip.title="点击文字编辑 · 拖动排序 · × 删除";
      var txt=el("span",it.text);txt.contentEditable="true";txt.spellcheck=false;
      txt.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();txt.blur()}});
      txt.addEventListener("blur",function(){
        var v=txt.textContent.trim().replace(/^-\s*/,"");
        var parts=v.split(",").map(function(x){return x.trim()});
        var type=(parts[0]||"").toUpperCase(),key=parts[1]||"";
        if(!key||!parts[2]){txt.textContent=it.text;fiMsg("格式应为 TYPE,匹配项,出口","dash-err");return}
        var full=[type,key,parts.slice(2).join(",")].join(",");
        if(full!==it.text){it.text=full;changed()}
        txt.textContent=it.text;
      });
      chip.appendChild(txt);
      var rm=el("button","×");rm.type="button";rm.title="删除规则";rm.setAttribute("aria-label",rm.title);
      rm.addEventListener("click",function(e){e.stopPropagation();it.removed=true;paint();changed()});
      chip.appendChild(rm);
      chip.addEventListener("dragstart",function(){dragIndex=i;chip.classList.add("dragging")});
      chip.addEventListener("dragend",function(){chip.classList.remove("dragging");dragIndex=-1});
      chip.addEventListener("dragover",function(e){e.preventDefault()});
      chip.addEventListener("drop",function(e){e.preventDefault();if(dragIndex<0||dragIndex===i)return;var m=items.splice(dragIndex,1)[0];items.splice(i,0,m);dragIndex=-1;paint();changed()});
      root.insertBefore(chip,box);
    });
  }
  box.addEventListener("keydown",function(e){
    if(e.key==="Enter"||e.key===","){e.preventDefault();add()}
    else if(e.key==="Backspace"&&!box.value){
      var last=-1;items.forEach(function(it,i){if(!it.removed)last=i});
      if(last>=0){e.preventDefault();items[last].removed=true;paint();changed()}
    }
  });
  box.addEventListener("blur",add);
  root.appendChild(box);paint();
  // Expose the full rule list as a comma-joined string for the save handler.
  Object.defineProperty(root,"value",{get:function(){return items.filter(function(it){return !it.removed}).map(function(it){return it.text}).join("\\n")},configurable:true});
  root._items=items;root._target=target;
  // Live rename: retarget every rule chip to the new group name. Used by the
  // group editor so references update in the modal the moment the name changes
  // (the YAML itself is only written on save, via the cascading group-rename).
  root._setTarget=function(newTarget){
    root._target=newTarget;
    items.forEach(function(it){
      var parts=it.text.split(",");
      if(parts.length>=3)parts[2]=newTarget;
      it.text=parts.join(",");
    });
    paint();
  };
  return root;
}
function chainHTML(name){
  return '<span class="dash-chain-label">配置链路</span><i>→</i>'+
    '<button type="button" class="chain-link" data-jump="rules" data-name="'+esc(name)+'">命中规则</button><i>→</i>'+
    '<button type="button" class="chain-link chain-link--group" data-jump="group" data-name="'+esc(name)+'">'+esc(name)+' 策略组</button><i>→</i>'+
    '<button type="button" class="chain-link" data-jump="group" data-name="'+esc(name)+'">出口顺序</button>';
}
// One delegated handler for every chain reference inside the editor drawer.
document.addEventListener("click",function(e){
  var link=e.target.closest&&e.target.closest(".chain-link");if(!link)return;
  var kind=link.getAttribute("data-jump");
  if(kind==="rules"){jumpToRules(link.getAttribute("data-name")||null)}
  else if(kind==="group"){jumpToGroup(link.getAttribute("data-name")||"")}
});
function chainNote(text){var d=el("div");d.className="dash-chain";d.innerHTML=text;modalBody.appendChild(d);return d}
function modalSection(text){var d=el("div");d.className="dash-modal-section";d.textContent=text;modalBody.appendChild(d)}
// Translate the rule-chip state into surgical ops: removed -> rule-remove,
// edited -> rule-text (preserves position), new -> rule-add.
function ruleChipsOps(control){
  var ops=[];
  control._items.forEach(function(it){
    if(it.removed&&it.orig)ops.push({kind:"rule-remove",rule:it.orig});
    else if(!it.removed&&it.orig&&it.text!==it.orig)ops.push({kind:"rule-text",rule:it.orig,value:it.text});
    else if(!it.removed&&!it.orig)ops.push({kind:"rule-add",rule:it.text});
  });
  return ops;
}
// Split a regex on top-level | only, so nested groups such as
// (?i:🇭🇰|香港|Hong Kong) stay as one editable chip.
function splitAlternatives(value){
  var s=String(value||""),out=[],start=0,depth=0;
  for(var i=0;i<s.length;i++){
    var ch=s.charAt(i);
    if(ch==="("||ch==="["||ch==="{")depth++;
    else if(ch===")"||ch==="]"||ch==="}")depth=Math.max(0,depth-1);
    else if(ch==="|"&&depth===0){out.push(s.slice(start,i));start=i+1}
  }
  out.push(s.slice(start));
  return out.map(function(x){return x.trim()}).filter(function(x){return x!==""});
}
function regexParts(value){
  var s=String(value||"").trim();
  var negPrefix="^(?!.*(?:(?i)",negSuffix=")).*$";
  var regionPrefix="(?i)^(?!=>).*(?:",regionSuffix=")";
  if(s.indexOf(negPrefix)===0&&s.slice(-negSuffix.length)===negSuffix)
    return {prefix:negPrefix,suffix:negSuffix,items:splitAlternatives(s.slice(negPrefix.length,s.length-negSuffix.length))};
  if(s.indexOf(regionPrefix)===0&&s.slice(-regionSuffix.length)===regionSuffix)
    return {prefix:regionPrefix,suffix:regionSuffix,items:splitAlternatives(s.slice(regionPrefix.length,s.length-regionSuffix.length))};
  return {prefix:"",suffix:"",items:splitAlternatives(s)};
}
function regexChips(value){
  var parts=regexParts(value);
  return chipControl(parts.items,function(items){return parts.prefix+items.join("|")+parts.suffix},"输入关键词或正则片段后回车");
}
function hint(text){var p=document.createElement("p");p.className="dash-hint";p.textContent=text;modalBody.appendChild(p);return p}
function groupProps(name){
  var groups=(state.catalog&&state.catalog.editor&&state.catalog.editor.groups)||[];
  return groups.find(function(g){return g.name===name})||{};
}
function rulesForTarget(name){
  var rules=(state.catalog&&state.catalog.editor&&state.catalog.editor.rules)||[];
  return rules.filter(function(r){return r.target===name&&r.enabled!==false}).map(function(r){return r.rule});
}
function closeModal(){modal.hidden=true;editCtx=null;document.body.style.overflow=""}
// Cross-block navigation. Any rule reference / chain label can jump straight
// to the owning block, highlight it and open its editor — the whole dashboard
// behaves as one connected graph instead of isolated lists.
function flashCard(card){
  if(!card)return;
  card.scrollIntoView({behavior:"smooth",block:"center"});
  card.classList.remove("dash-flash");void card.offsetWidth;card.classList.add("dash-flash");
}
function groupStep(name){
  var g=(state.catalog&&state.catalog.editorModel&&state.catalog.editorModel.groups||[])
    .find(function(x){return x.name===name});
  if(!g)return null;
  return (g.kind==="region")?"regions":(g.kind==="app")?"apps":"strategies";
}
function jumpToGroup(name){
  var step=groupStep(name);if(!step){fiMsg("找不到策略组 "+name,"dash-err");return}
  showStep(step);
  var card=[].slice.call(document.querySelectorAll("#"+(step==="regions"?"fi-regions":step==="apps"?"fi-apps":"fi-strategies")+" [aria-label]"))
    .find(function(c){return (c.getAttribute("aria-label")||"").indexOf(name)>=0});
  if(card){
    var self=card;
    setTimeout(function(){flashCard(self);openEditor({kind:"group",item:(state.catalog.editorModel.groups||[]).find(function(g){return g.name===name})||{name:name}})},60);
  }
}
function jumpToProvider(name){
  showStep("rules");
  setTimeout(function(){
    var card=[].slice.call(document.querySelectorAll("#fi-providers .dash-row-card"))
      .find(function(c){return (c.textContent||"").indexOf(name)>=0});
    if(card){flashCard(card);openEditor({kind:"provider",item:(state.catalog.providerModules||[]).find(function(m){return m.name===name})||{name:name,value:{}}})}
  },60);
}
function jumpToRules(target){
  showStep("rules");
  var search=document.getElementById("rule-target-filter");
  if(search){
    search.value=target||"";search.dispatchEvent(new Event("input"));
    var card=document.getElementById("fi-rule-list");
    if(card)setTimeout(function(){flashCard(card)},60);
  }
}
document.addEventListener("keydown",function(e){
  if(e.key==="Escape"&&!modal.hidden)closeModal();
});
function openEditor(ctx){
  editCtx=ctx;
  var titles={app:"编辑应用",region:"编辑地区",strategy:"编辑出口策略","core-group":"编辑策略组",group:"编辑策略组",general:"基础设置",filter:"编辑节点筛选",rule:"编辑分流规则","add-rule":"添加分流规则",provider:"编辑规则源"};
  modalTitle.textContent=titles[ctx.kind]||"编辑";
  modalBody.textContent="";
  var item=ctx.item||{},f={},cat=state.catalog||{},g=groupProps(item.name);
  if(ctx.kind==="group"){
    // One editor for every strategy group. YAML order preserved: name (with
    // emoji, edited verbatim) → icon → category → proxies → inbound rules.
    var oldName=item.name||"";
    chainNote(chainHTML(oldName));
    modalSection("① 策略组 · 名称即 Emoji + 文字");
    f.name=field("名称（含 Emoji，如 ⚡ OpenAI）",input(oldName));appendField(f.name);
    f.label=field("显示名称",input(item.label));appendField(f.label);
    f.icon=field("图标 URL",iconInput(item.icon));appendField(f.icon);
    var catNames=[];if(cat.editorModel&&cat.editorModel.groups)cat.editorModel.groups.forEach(function(x){if(x.category&&catNames.indexOf(x.category)<0)catNames.push(x.category)});
    if(item.category&&catNames.indexOf(item.category)<0)catNames.unshift(item.category);
    if(!catNames.length)catNames=["其他服务"];
    f.category=field("分类",pillSelect(catNames.map(function(c){return [c,c]}),item.category||catNames[0]));appendField(f.category);
    modalSection("② 出口顺序 · 第一项即默认出口");
    f.proxies=field("出口列表（拖动排序 / × 删除 / 回车新增）",proxyChips(g.proxies));appendField(f.proxies);
    hint("第一项就是默认出口；改名时所有指向本组的规则与出口引用会自动同步。");
    // Advanced knobs kept for auto/core groups so nothing is lost from YAML.
    if(item.kind==="strategy"||item.kind==="core"){
      modalSection("③ 高级 · 测速与筛选");
      if(g.url){f.url=field("测速 URL",input(g.url));appendField(f.url)}
      if(g.interval!=null&&g.interval!==""){f.interval=field("测速间隔（秒）",input(g.interval,"number"));appendField(f.interval)}
      if(g.tolerance!=null&&g.tolerance!==""){f.tolerance=field("延迟容差（毫秒）",input(g.tolerance,"number"));appendField(f.tolerance)}
      if(g.strategy){f.strategy=field("均衡策略",pillSelect([["consistent-hashing","consistent-hashing"],["round-robin","round-robin"]],g.strategy));appendField(f.strategy)}
      if(g.filter){f.filter=field("节点筛选（可增删芯片）",regexChips(g.filter));appendField(f.filter)}
    }
    modalSection((item.kind==="strategy"||item.kind==="core"?"④":"③")+" 关联规则 · 附加在本组上的补丁");
    f.rules=field("命中规则（点文字改匹配项 / × 删除 / 回车新增）",ruleChips(oldName,item.inbound||[]));appendField(f.rules);
    var ruleHint=hint("规则是「类型,匹配项,"+esc(oldName)+"」，出口固定为本组；保存时随改名一起级联写回。");
    var chainEl=modalBody.querySelector(".dash-chain");
    // Real-time link: renaming the group retargets its rule chips and chain
    // note in the modal immediately. Nothing is sent until "保存并生效".
    f.name.addEventListener("input",function(){
      var nn=f.name.value.trim()||oldName;
      if(f.rules._setTarget)f.rules._setTarget(nn);
      if(chainEl)chainEl.innerHTML=chainHTML(nn);
      if(ruleHint)ruleHint.textContent="规则是「类型,匹配项,"+nn+"」，出口固定为本组；保存时随改名一起级联写回。";
    });
    editCtx.meta={oldName:oldName,kind:item.kind};
  }else if(ctx.kind==="app"){
    chainNote(chainHTML(item.name));
    var group=(cat.editor&&cat.editor.groups||[]).find(function(x){return x.name===item.name})||{};
    f.rules=field("① 命中规则 · 指向本应用的规则（可编辑）",ruleChips(item.name,item.rules));appendField(f.rules);
    hint("每条规则是「类型,匹配项,"+esc(item.name)+"」，出口已固定为本应用；点文字改匹配项，× 删除，回车新增。");
    modalSection("② 应用信息");
    f.label=field("显示名称",input(item.label));appendField(f.label);
    f.icon=field("图标 URL",iconInput(item.icon));appendField(f.icon);
    var cats=[];if(cat.apps)cat.apps.forEach(function(a){if(cats.indexOf(a.category)<0)cats.push(a.category)});
    if(cats.indexOf(item.category)<0)cats.unshift(item.category);
    f.category=field("分类",pillSelect(cats.map(function(c){return [c,c]}),item.category));appendField(f.category);
    modalSection("③ 出口顺序 · 第一项即默认出口");
    f.proxies=field("出口列表（拖动排序 / × 删除）",proxyChips(g.proxies));appendField(f.proxies);
    hint("按顺序选择：第一项就是默认出口；把 DIRECT 拖到首位即默认直连。组类型："+esc(g.type||group.type||"select")+"。");
  }else if(ctx.kind==="region"){
    hint("组名："+(item.groupName||item.name));
    f.label=field("显示名称",input(item.label));appendField(f.label);
    f.flag=field("旗帜 Emoji",input(item.flag));appendField(f.flag);
    f.icon=field("图标 URL",iconInput(item.icon));appendField(f.icon);
    f.filter=field("地区匹配项（可增删芯片）",regexChips(item.filter));appendField(f.filter);
    hint("每个芯片是一条正则分支；回车添加、× 删除、拖动排序。");
  }else if(ctx.kind==="strategy"){
    var sTarget=item.name;
    chainNote(chainHTML(sTarget));
    var sRules=rulesForTarget(sTarget);
    f.rules=field("① 命中规则 · 指向本策略组的规则（可编辑）",ruleChips(sTarget,sRules));appendField(f.rules);
    hint("出口已固定为 "+esc(sTarget)+"；点文字改匹配项，× 删除，回车新增。");
    modalSection("② 策略组信息");
    f.label=field("显示名称",input(item.label));appendField(f.label);
    f.description=field("说明",input(item.description));appendField(f.description);
    f.icon=field("图标 URL",iconInput(item.icon));appendField(f.icon);
    if(g.url){f.url=field("测速 URL",input(g.url));appendField(f.url)}
    if(g.interval!=null&&g.interval!==""){f.interval=field("测速间隔（秒）",input(g.interval,"number"));appendField(f.interval)}
    if(g.tolerance!=null&&g.tolerance!==""){f.tolerance=field("延迟容差（毫秒）",input(g.tolerance,"number"));appendField(f.tolerance)}
    if(g.strategy){f.strategy=field("均衡策略",pillSelect([["consistent-hashing","consistent-hashing"],["round-robin","round-robin"]],g.strategy));appendField(f.strategy)}
    if(g.proxies){f.proxies=field("出口顺序（可增删 / 拖动排序）",proxyChips(g.proxies));appendField(f.proxies);hint("回车添加出口，× 删除，拖动芯片排序。")}
    if(g.filter){f.filter=field("节点筛选（可增删芯片）",regexChips(g.filter));appendField(f.filter);hint("筛选正则的每个分支都是独立芯片，可增删排序。")}
  }else if(ctx.kind==="core-group"){
    var cgTarget=g.name;
    chainNote(chainHTML(cgTarget));
    var cgRules=rulesForTarget(cgTarget);
    f.rules=field("① 命中规则 · 指向本组的规则（可编辑）",ruleChips(cgTarget,cgRules));appendField(f.rules);
    hint("出口已固定为 "+esc(cgTarget)+"；点文字改匹配项，× 删除，回车新增。");
    modalSection("② 出口顺序 · 第一项即默认出口");
    f.proxies=field("出口列表（拖动排序 / × 删除）",proxyChips(g.proxies));appendField(f.proxies);
    hint("按顺序选择：第一项就是默认出口；把 DIRECT 拖到首位即默认直连。类型："+esc(g.type||"")+"。");
    if(g.filter){f.filter=field("节点筛选（可增删芯片）",regexChips(g.filter));appendField(f.filter);hint("筛选正则的每个分支都是独立芯片，可增删排序。")}
    if(g.icon){f.icon=field("图标 URL",iconInput(g.icon));appendField(f.icon)}
    if(g.url){f.url=field("测速 URL",input(g.url));appendField(f.url)}
    if(g.interval!=null&&g.interval!==""){f.interval=field("间隔（秒）",input(g.interval,"number"));appendField(f.interval)}
    if(g.tolerance!=null&&g.tolerance!==""){f.tolerance=field("容差（毫秒）",input(g.tolerance,"number"));appendField(f.tolerance)}
  }else if(ctx.kind==="general"){
    var cfg=(cat.editor&&cat.editor.general)||{};
    f.port=field("HTTP 代理端口",input(cfg.port,"number"));appendField(f.port);
    f.socksPort=field("SOCKS5 端口",input(cfg["socks-port"],"number"));appendField(f.socksPort);
    f.allowLan=field("允许局域网连接",checkbox(cfg["allow-lan"]));appendField(f.allowLan);
    f.mode=field("代理模式",pillSelect([["rule","rule · 规则分流"],["direct","direct · 全局直连"],["global","global · 全局代理"]],cfg.mode));appendField(f.mode);
    f.logLevel=field("日志级别",pillSelect([["debug","debug"],["info","info"],["warning","warning"],["error","error"],["silent","silent"]],cfg["log-level"]));appendField(f.logLevel);
    f.controller=field("REST API 监听地址",input(cfg["external-controller"]));appendField(f.controller);
    f.unifiedDelay=field("统一延迟测速",checkbox(cfg["unified-delay"]));appendField(f.unifiedDelay);
  }else if(ctx.kind==="filter"){
    hint(item.id==="all"?"FilterAll 用于节点净化；改动后请确认策略组 filter 是否仍符合预期。":item.id==="others"?"FilterOthers 排除六大地区与广告关键词，改动后建议同步重生成规则。":"该正则决定哪些节点进入对应地区组。");
    f.value=field("筛选关键词 / 正则分支（可增删芯片）",regexChips(item.value));appendField(f.value);
    hint("每个芯片都是可增删的匹配项；回车添加、× 删除、拖动排序，外层正则结构自动保留。");
  }else if(ctx.kind==="rule"||ctx.kind==="add-rule"){
    var p=ctx.kind==="add-rule"?(ctx.preset||{type:"GEOSITE",key:"",target:"",extra:""}):ruleParts(item.rule);
    if(ctx.kind==="rule")hint("原规则："+item.rule);
    f.type=field("规则类型",pillSelect([["GEOSITE","GEOSITE"],["RULE-SET","RULE-SET"],["GEOIP","GEOIP"],["DOMAIN","DOMAIN"],["IP","IP"],["MATCH","MATCH"]],p.type));appendField(f.type);
    f.key=field("匹配项（如 openai / cn / gfw）",input(p.key));appendField(f.key);
    var targets=["DIRECT","REJECT"],groups=(cat.editor&&cat.editor.groups)||[];
    groups.forEach(function(x){if(targets.indexOf(x.name)<0)targets.push(x.name)});
    if(p.target&&targets.indexOf(p.target)<0)targets.unshift(p.target);
    f.target=field("出口（策略组）",pillSelect(targets.map(function(t){return [t,t]}),p.target));appendField(f.target);
    f.extra=field("附加参数（如 no-resolve）",input(p.extra));appendField(f.extra);
    if(ctx.kind==="rule"){f.enabled=field("启用该规则",checkbox(item.enabled));appendField(f.enabled)}
  }else if(ctx.kind==="provider"){
    var v=item.value||{};
    hint("规则源名："+item.name+" · 修改后下一次拉取即生效。");
    f.url=field("规则源 URL",input(v.url));appendField(f.url);
    var intervalWrap=input(v.interval,"number");
    f.interval=field("更新间隔（秒）",intervalWrap);appendField(f.interval);
    var intervalHint=hint("当前："+humanInterval(v.interval)+"。常用值：5 分钟 = 300 · 1 小时 = 3600 · 8 小时 = 28800 · 1 天 = 86400");
    intervalWrap.addEventListener("input",function(){intervalHint.textContent="当前：每 "+humanInterval(intervalWrap.value)+"更新一次。常用值：5 分钟 = 300 · 1 小时 = 3600 · 8 小时 = 28800 · 1 天 = 86400"});
    f.behavior=field("行为",pillSelect([["domain","domain"],["classical","classical"],["ipcidr","ipcidr"]],v.behavior));appendField(f.behavior);
    f.format=field("格式",pillSelect([["yaml","yaml"],["text","text"]],v.format||"yaml"));appendField(f.format);
    f.type=field("类型",pillSelect([["http","http"],["file","file"]],v.type||"http"));appendField(f.type);
  }
  editCtx.fields=f;
  var removable={app:1,region:1,strategy:1,group:1,rule:1};
  modalRemove.hidden=!removable[ctx.kind];
  modalRemove.textContent=ctx.kind==="rule"?"删除规则":"移除";
  mountEditor(ctx.kind,item);
  modal.hidden=false;
  if(matchMedia("(min-width:900px)").matches)document.body.style.overflow="hidden";
}
document.getElementById("fi-modal-close").addEventListener("click",closeModal);
document.getElementById("fi-modal-cancel").addEventListener("click",closeModal);
modal.addEventListener("click",function(e){if(e.target===modal)closeModal()});

function sendOps(ops,onDone){
  fiMsg("正在保存…");
  var btn=document.getElementById("fi-modal-apply");btn.disabled=true;
  fetch(CFG.frontInfoPath,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ops:ops})})
  .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d}})})
  .then(function(res){
    if(!res.ok)throw Error(res.d.error||("保存失败 ("+res.d.error+")"));
    state.text=res.d.text||state.text;
    state.source="draft";state.updatedAt=res.d.updatedAt||null;
    renderCatalog(res.d.catalog,res.d.summary);
    fiSource.textContent="草稿 · "+(res.d.updatedAt?stamp(res.d.updatedAt):"刚刚");
    fiSource.className="dash-badge locked";
    fiMsg("已保存并生效","dash-ok");
    closeModal();if(onDone)onDone();
  })
  .catch(function(e){fiMsg(e.message,"dash-err")})
  .finally(function(){btn.disabled=false});
}
function proxyList(value){return String(value||"").replace(/[\\r\\n]+/g,", ").replace(/\\s*,\\s*/g,", ").replace(/^,|,$/g,"").trim()}
function buildOps(){
  var ctx=editCtx,f=ctx.fields,ops=[],item=ctx.item||{};
  var name=ctx.kind==="region"?(item.groupName||item.name):item.name;
  function props(fields){ops.push({kind:"group-props",name:name,fields:fields})}
  if(ctx.kind==="group"){
    // All field edits target the CURRENT name; the rename (if any) is appended
    // last so it cascades references after those edits have landed.
    ops=ops.concat(ruleChipsOps(f.rules));
    ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),category:f.category.value}});
    ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
    var gp=proxyList(f.proxies.value);
    if(gp)ops.push({kind:"group-props",name:name,fields:{proxies:gp}});
    var fields3={};
    if(f.url&&f.url.value.trim())fields3.url=f.url.value.trim();
    if(f.interval&&Number(f.interval.value)>0)fields3.interval=Number(f.interval.value);
    if(f.tolerance&&Number(f.tolerance.value)>0)fields3.tolerance=Number(f.tolerance.value);
    if(f.strategy)fields3.strategy=f.strategy.value;
    if(f.filter&&f.filter.value.trim())fields3.filter=f.filter.value.trim();
    if(Object.keys(fields3).length)ops.push({kind:"group-props",name:name,fields:fields3});
    var newName=f.name.value.trim();
    if(newName&&newName!==name)ops.push({kind:"group-rename",from:name,to:newName});
  }else if(ctx.kind==="app"){
    ops=ops.concat(ruleChipsOps(f.rules));
    ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),category:f.category.value}});
    ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
    var proxies=proxyList(f.proxies.value);
    if(proxies)props({proxies:proxies});
  }else if(ctx.kind==="region"){
    ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),flag:f.flag.value.trim()}});
    ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
    ops.push({kind:"filter",id:item.id,value:f.filter.value.trim()});
  }else if(ctx.kind==="strategy"||ctx.kind==="core-group"){
    if(f.rules)ops=ops.concat(ruleChipsOps(f.rules));
    if(f.label)ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),description:f.description.value.trim()}});
    if(f.icon)ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
    var fields={};
    if(f.proxies&&proxyList(f.proxies.value))fields.proxies=proxyList(f.proxies.value);
    if(f.url&&f.url.value.trim())fields.url=f.url.value.trim();
    if(f.interval&&Number(f.interval.value)>0)fields.interval=Number(f.interval.value);
    if(f.tolerance&&Number(f.tolerance.value)>0)fields.tolerance=Number(f.tolerance.value);
    if(f.strategy)fields.strategy=f.strategy.value;
    if(f.filter&&f.filter.value.trim())fields.filter=f.filter.value.trim();
    if(Object.keys(fields).length)props(fields);
  }else if(ctx.kind==="general"){
    var port=Number(f.port.value),socks=Number(f.socksPort.value);
    if(!(port>0&&port<65536)){fiMsg("HTTP 端口需在 1–65535 之间","dash-err");return null}
    if(!(socks>0&&socks<65536)){fiMsg("SOCKS5 端口需在 1–65535 之间","dash-err");return null}
    ops.push({kind:"general",fields:{
      port:port,"socks-port":socks,"allow-lan":f.allowLan.checked,
      mode:f.mode.value,"log-level":f.logLevel.value,
      "external-controller":f.controller.value.trim(),"unified-delay":f.unifiedDelay.checked
    }});
  }else if(ctx.kind==="filter"){
    if(!f.value.value.trim()){fiMsg("正则不能为空","dash-err");return null}
    ops.push({kind:"filter",id:item.id,value:f.value.value.trim()});
  }else if(ctx.kind==="rule"||ctx.kind==="add-rule"){
    var type=f.type.value,key=f.key.value.trim(),target=f.target.value.trim(),extra=f.extra.value.trim();
    if(type!=="MATCH"&&(!key||!target)){fiMsg("规则需要匹配项与出口","dash-err");return null}
    var value=[type,key,target,extra].filter(function(x){return x!==""}).join(",");
    if(ctx.kind==="add-rule")ops.push({kind:"rule-add",rule:value});
    else{
      if(!f.enabled.checked)ops.push({kind:"rule",rule:item.rule,enabled:false});
      else if(!item.enabled)ops.push({kind:"rule",rule:item.rule,enabled:true});
      if(value!==item.rule)ops.push({kind:"rule-text",rule:item.rule,value:value});
    }
  }else if(ctx.kind==="provider"){
    var fields2={url:f.url.value.trim(),interval:Number(f.interval.value)||28800,behavior:f.behavior.value,format:f.format.value,type:f.type.value};
    if(!fields2.url){fiMsg("请填写规则源 URL","dash-err");return null}
    ops.push({kind:"provider",name:item.name,fields:fields2});
  }
  return ops;
}
document.getElementById("fi-modal-apply").addEventListener("click",function(){
  if(!editCtx||editCtx.kind==="add")return;
  var ops=buildOps();if(ops&&ops.length)sendOps(ops);
});
modalRemove.addEventListener("click",function(){
  if(!editCtx)return;
  if(editCtx.kind==="add"){closeModal();return}
  if(editCtx.kind==="rule"){
    if(!window.confirm("从模板中删除规则 “"+editCtx.item.rule+"”？此操作不可撤销。"))return;
    sendOps([{kind:"rule-remove",rule:editCtx.item.rule}]);return;
  }
  var name=editCtx.kind==="region"?(editCtx.item.groupName||editCtx.item.name):editCtx.item.name;
  if(editCtx.kind==="group"){
    if(!window.confirm("从模板中删除策略组 “"+name+"”？所有指向它的规则与出口引用会一起清除。"))return;
    sendOps([{kind:"group-remove",name:name}]);return;
  }
  if(!window.confirm("从模板中移除 “"+name+"”？相关规则会一并注释掉。"))return;
  sendOps([{kind:"remove",name:name}]);
});
document.getElementById("add-rule").addEventListener("click",function(){
  openEditor({kind:"add-rule"});
});
function openAddEditor(kind){
  modalTitle.textContent=kind==="region"?"添加地区":kind==="strategy"?"添加策略组":"添加应用";
  modalBody.textContent="";
  var f={};
  if(kind==="region"){
    f.id=field("地区代码（2-8 位字母，如 CA）",input(""));
    f.label=field("显示名称（如 加拿大）",input(""));
    f.flag=field("旗帜 Emoji（如 🇨🇦）",input(""));
    f.filter=field("匹配正则（如 (?i)^(?!=>).*(?:🇨🇦|加拿大|Canada)）",input(""));
    hint("新增地区会在模板的 FilterRegions 段追加一个锚点，地区分组与匹配规则随之生效。");
  }else{
    var cats=[];if(state.catalog)state.catalog.apps.forEach(function(a){if(cats.indexOf(a.category)<0)cats.push(a.category)});
    if(!cats.length)cats=["其他服务"];
    f.name=field("组名（含 Emoji，如 🧩 Notion）",input("🧩 "));
    f.label=field("显示名称",input(""));
    f.icon=field("图标 URL",iconInput(""));
    f.category=field("分类",pillSelect(cats.map(function(c){return [c,c]}),cats[0]));
    f.rule=field("分流规则（如 GEOSITE,notion,🧩 Notion，可留空）",input(""));
  }
  Object.keys(f).forEach(function(k){appendField(f[k])});
  editCtx={kind:"add",addKind:kind,fields:f};modalRemove.hidden=true;mountEditor("add",null);modal.hidden=false;
  if(matchMedia("(min-width:900px)").matches)document.body.style.overflow="hidden";
}
document.getElementById("add-app").addEventListener("click",function(){openAddEditor("app")});
document.getElementById("add-strategy").addEventListener("click",function(){openAddEditor("strategy")});
document.getElementById("add-region").addEventListener("click",function(){openAddEditor("region")});
// The generic apply handler above handles app/region/strategy; add-* needs its own ops.
document.getElementById("fi-modal-apply").addEventListener("click",function(){
  if(!editCtx||editCtx.kind!=="add")return;
  var f=editCtx.fields,kind=editCtx.addKind;
  if(kind==="region"){
    var id=f.id.value.trim(),filter=f.filter.value.trim();
    if(!id||!filter){fiMsg("请填写地区代码与匹配正则","dash-err");return}
    sendOps([{kind:"add-region",id:id,filter:filter}]);
    return;
  }
  var name=f.name.value.trim();
  if(!name){fiMsg("请填写组名","dash-err");return}
  sendOps([{kind:"add-app",name:name,label:f.label.value.trim(),category:f.category.value,icon:f.icon.value.trim(),rule:f.rule.value.trim()}]);
},true);

fiText.addEventListener("input",function(){fiDirty=true});
document.getElementById("fi-reload").addEventListener("click",function(){loadFront()});
document.getElementById("fi-reload-mini").addEventListener("click",function(){loadFront()});
document.getElementById("fi-reset").addEventListener("click",function(){
  if(!window.confirm("放弃当前草稿，恢复为仓库中的版本？"))return;
  fiMsg("正在放弃…");
  fetch(CFG.frontInfoPath,{method:"DELETE"})
  .then(function(r){if(!r.ok)throw Error("操作失败 ("+r.status+")");return loadFront()})
  .then(function(){fiMsg("已恢复仓库版本","dash-ok")})
  .catch(function(e){fiMsg(e.message,"dash-err")});
});
document.getElementById("fi-save").addEventListener("click",function(){
  // textarea normalises CRLF to LF on read; the template ships as CRLF, so
  // restore it before saving or the derived version hash would differ from
  // the committed file and raise a false "version mismatch" in the frontend.
  var text=fiText.value.replace(/\\r\\n/g,"\\n").replace(/\\n/g,"\\r\\n");
  if(!text.trim()){fiMsg("模板内容不能为空","dash-err");return}
  fiMsg("校验并保存中…");
  var btn=this;btn.disabled=true;
  fetch(CFG.frontInfoPath,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:text})})
  .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d}})})
  .then(function(res){
    if(!res.ok)throw Error(res.d.error||("保存失败"));
    fiMsg("已保存并生效","dash-ok");return loadFront();
  })
  .catch(function(e){fiMsg(e.message,"dash-err")})
  .finally(function(){btn.disabled=false});
});

/* ---- subscription links ---- */
var lifetimes={"3h":"3 小时","7d":"7 天","30d":"30 天","forever":"永久"};
var body=document.getElementById("body");
var status=document.getElementById("status");
function validity(row){
  if(row.lifetime&&lifetimes[row.lifetime])return lifetimes[row.lifetime];
  if(row.lifetime==="forever"||(!row.expiresAt&&row.createdAt))return "永久";
  if(row.createdAt&&row.expiresAt){var days=Math.round((new Date(row.expiresAt)-new Date(row.createdAt))/86400000);return days>0?days+" 天":"—"}
  return "—";
}
function linkFor(row){
  if(row.hasPwd&&!row.pwd)return "旧配置：当时未记录口令，无法重建链接（删除后可重建）";
  var parts=CFG.linkBase+"?token="+encodeURIComponent(row.token);
  if(row.hasPwd)parts+="&pwd="+encodeURIComponent(row.pwd);
  return parts;
}
function render(rows){
  body.textContent="";
  if(!rows.length){
    body.className="dash-msg";
    var empty=el("div");empty.className="dash-empty";
    empty.appendChild(el("strong","还没有生成任何配置"));
    var tip=el("p");tip.appendChild(document.createTextNode("配置由订阅工坊生成。"));
    var a=el("a","打开配置工坊");a.href="../";tip.appendChild(document.createTextNode(" "));tip.appendChild(a);
    empty.appendChild(tip);body.appendChild(empty);return;
  }
  body.className="";
  var table=el("table");table.className="dash-table";
  var head=el("thead"),hr=el("tr");
  ["配置名称","订阅链接","访问","生成时间","到期时间","有效期","操作"].forEach(function(h){hr.appendChild(el("th",h))});
  head.appendChild(hr);table.appendChild(head);
  var tb=el("tbody");
  rows.forEach(function(row){
    var tr=el("tr");tr.appendChild(el("td",row.token));
    // Put the link right after the name so it is visible without scrolling a
    // wide table sideways; the full URL stays available as small text/copy.
    var link=el("td"),url=linkFor(row),wrap=el("span");
    wrap.className="dash-link";
    if(row.hasPwd&&!row.pwd){
      // Legacy record: no password was stored, so no openable link exists.
      wrap.appendChild(el("code",url));
    }else{
      var main=el("span");main.className="dash-link-main";
      var a=el("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";
      a.title="在新标签打开订阅内容";a.appendChild(el("span","打开订阅内容"));
      main.appendChild(a);main.appendChild(copyButton(url));
      wrap.appendChild(main);
      var preview=el("code",url);preview.className="dash-link-url";preview.title=url;
      wrap.appendChild(preview);
    }
    link.appendChild(wrap);tr.appendChild(link);
    var access=el("td"),badge=el("span",row.hasPwd?"需口令":"公开");
    badge.className="dash-badge "+(row.hasPwd?"locked":"open");
    access.appendChild(badge);tr.appendChild(access);
    var created=el("td",stamp(row.createdAt));created.className="nowrap";tr.appendChild(created);
    var expires=el("td",row.expiresAt?stamp(row.expiresAt):"永久");expires.className="nowrap";tr.appendChild(expires);
    tr.appendChild(el("td",validity(row)));
    var act=el("td");act.className="actions";
    var del=el("button","删除");del.className="danger button secondary";del.type="button";
    del.addEventListener("click",function(){
      if(!window.confirm("确定删除配置 “"+row.token+"”？此操作不可撤销。"))return;
      del.disabled=true;
      fetch(CFG.adminPath,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:row.id})})
      .then(function(r){if(!r.ok)throw Error("删除失败 ("+r.status+")");return r.json()})
      .then(function(){load()})
      .catch(function(e){status.className="dash-status dash-err";status.textContent=e.message;del.disabled=false});
    });
    act.appendChild(del);tr.appendChild(act);tb.appendChild(tr);
  });
  table.appendChild(tb);body.appendChild(table);
}
function load(){
  status.className="dash-status";status.textContent="加载中…";
  fetch(CFG.adminPath,{headers:{"Cache-Control":"no-store"}})
  .then(function(r){if(r.status===401)throw Error("登录已过期，请重新登录。");if(!r.ok)throw Error("读取失败 ("+r.status+")");return r.json()})
  .then(function(d){status.textContent="共 "+(d.configs||[]).length+" 条配置";render(d.configs||[])})
  .catch(function(e){body.className="dash-msg dash-err";body.textContent=e.message;status.textContent=""});
}
document.getElementById("refresh").addEventListener("click",load);
document.getElementById("logout").addEventListener("click",function(){
  fetch("/config-builder/dashboard/logout",{method:"POST"}).then(function(){location.href="/config-builder/dashboard"});
});
showStep("general");
load();
loadFront();
})();
</script>
</body>
</html>`;
}
