// Render a finished config by EDITING the author's ratatoskr-template.yaml in
// place, instead of serialising a freshly built object with yaml.stringify().
//
// Why: the template carries hand-written section banners, inline comments,
// flow-style one-liners and YAML anchors (*FilterAll, &RP-domain). Rebuilding
// the object throws all of that away and produces a noisy, unreadable file.
//
// The template is the complete set of OPTIONS the author shipped. Every group,
// every region entry in every proxies[] list, every rule and every rule-provider
// is written out VERBATIM regardless of what the user selected. Selections are
// not filters — they only decide the DEFAULT exit (the first proxy) of the
// switch/APP groups. An unselected region is still written as an option: the
// user can pick it in the client, and it becomes useful as soon as their airport
// subscription actually carries nodes for it. Previously this renderer dropped
// unselected groups and pruned their references from 40+ proxies[] lists, which
// silently deleted content (Hermes / 节点选择 / all APP groups / China / Final
// lost Hong Kong, Taiwan, Singapore and Others).
//
// The only edits applied in place are:
//   1. inject proxy-providers into the AUTO-PROVIDERS marker block
//   2. patch port / allow-lan / title in place
//   3. move the user's chosen default exit to the FRONT of a group's proxies[]
//      (keeping every other option, flow style and trailing comment intact)
import { parse } from "yaml";

const isBlank = (line) => !line.trim();
const isComment = (line) => /^\s*#/.test(line);

// Split a flow-style proxies array into its item strings.
function splitFlow(inner) {
  return inner
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {string} template - raw ratatoskr-template.yaml text
 * @param {object} config   - compile()'s validated structured config
 * @param {object} p        - normalised profile
 * @param {object} model    - catalog
 */
export function renderFromTemplate(template, config, p, model) {
  const g = model.groups;
  // Strip a leading UTF-8 BOM (present on the raw template for browser
  // display) so the first section banner stays a normal comment line.
  const source = template.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = source.split("\n");

  // Config uses short icon names for regions; the template uses full names.
  const configNameToTemplate = (name) => {
    const r = model.regions.find((x) => x.name === name);
    if (r) return r.groupName;
    if (name === g.other) return g.otherGroupName;
    return name;
  };
  const appNames = new Set(model.apps.map((a) => a.name));

  // Find the compiled version of each group by name (for default-exit sync).
  const compiled = new Map(config["proxy-groups"].map((x) => [x.name, x]));

  const out = [];
  let section = "head"; // head | providers | groups | rules | ruleproviders
  let injectedProviders = false;
  let titlePatched = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- section detection -------------------------------------------------
    if (/^\s*proxy-groups:\s*$/.test(line)) {
      section = "groups";
      out.push(line);
      continue;
    }
    if (/^\s*rules:\s*$/.test(line)) {
      section = "rules";
      out.push(line);
      continue;
    }
    if (/^\s*rule-providers:\s*$/.test(line)) {
      section = "ruleproviders";
      out.push(line);
      continue;
    }
    if (/^\s*rule-anchor:\s*$/.test(line)) {
      // rule-anchor holds shared flow anchors; always keep.
      out.push(line);
      continue;
    }

    // --- auto proxy-providers injection ------------------------------------
    if (line.includes(">>> AUTO-PROVIDERS-START")) {
      out.push(line);
      out.push(...proxyProviderLines(p, model));
      injectedProviders = true;
      continue;
    }
    if (line.includes("<<< AUTO-PROVIDERS-END")) {
      out.push(line);
      section = "general";
      continue;
    }

    // --- title / general settings patched in place ------------------------
    if (!titlePatched && line.startsWith("# Ratatoskr ·")) {
      out.push("# Ratatoskr · " + p.title);
      titlePatched = true;
      continue;
    }
    if (/^port:\s*\d+\s*#/.test(line)) {
      out.push(line.replace(/^port:\s*\d+/, `port: ${p.port}`));
      continue;
    }
    if (/^allow-lan:\s*(true|false)/.test(line)) {
      out.push(
        line.replace(/^allow-lan:\s*(true|false)/, `allow-lan: ${p.allowLan}`),
      );
      continue;
    }

    // The commented-out manual proxy-providers example and manual proxies
    // block are author documentation: keep them verbatim.

    // --- proxy-group entries -----------------------------------------------
    // Keep EVERY group line verbatim. The user's choices only move a default
    // exit to the front; no group or proxies[] item is ever removed.
    if (section === "groups") {
      const m = line.match(/^(\s*-\s*\{)(.*?)(\}\s*(?:#.*)?)$/);
      if (m) {
        const name = flowField(m[2], "name");
        if (name) {
          const cf = compiled.get(name);
          let body = m[2];
          // Sync APP default route (first proxy) with the user's policy.
          if (appNames.has(name) && cf?.proxies?.length) {
            body = setFirstProxy(body, configNameToTemplate(cf.proxies[0]));
          }
          // Sync Hermes / gateway / final first choice with default strategy.
          if (
            (name === g.hermes || name === g.gateway || name === g.final) &&
            cf?.proxies?.length
          ) {
            body = setFirstProxy(body, configNameToTemplate(cf.proxies[0]));
          }
          out.push(m[1] + body + m[3]);
          continue;
        }
      }
      // Keep comments, blank lines, filter anchor definitions etc. verbatim.
    }

    // --- rules / rule-providers --------------------------------------------
    // Written verbatim. The template's rule set is a complete option list;
    // deselecting a module must not delete its RULE-SET rule or provider.

    out.push(line);
  }

  if (!injectedProviders)
    throw Error("模板缺少 AUTO-PROVIDERS 标记，无法注入远程订阅。");

  // The template has no title banner; add one above the author's first section
  // so clients and users still see the config name at a glance.
  if (!titlePatched)
    out.unshift(`# Ratatoskr · ${p.title}`);

  // Normalise trailing whitespace but otherwise leave the author's text alone.
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// Read a `key: value` field out of a flow-map body (comma-separated, values may
// contain spaces and URLs but not commas in this template).
function flowField(body, key) {
  const re = new RegExp(`(?:^|,)\\s*${key}:\\s*([^,]+)`);
  const m = body.match(re);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

// Move `first` to the FRONT of proxies[] without removing any other option.
function setFirstProxy(body, first) {
  if (!first) return body;
  const m = body.match(/proxies:\s*\[([^\]]*)\]/);
  if (!m) return body;
  const items = splitFlow(m[1]);
  if (!items.includes(first)) return body;
  const reordered = [first, ...items.filter((x) => x !== first)];
  return body.replace(m[0], `proxies: [${reordered.join(", ")}]`);
}

// Build the proxy-providers block using the airports' ORIGINAL subscription
// URLs so the client refreshes nodes directly from the user's provider.
function proxyProviderLines(p, model) {
  const out = ["proxy-providers:"];
  p.providers.forEach((v, i) => {
    const name = /^[\p{L}\p{N}_-]+$/u.test(v.name) ? v.name : `P${i + 1}`;
    out.push(`  ${name}:`);
    out.push(`    url: "${v.url}"`);
    out.push(`    type: http`);
    out.push(`    interval: 86400`);
    out.push(
      `    health-check: {enable: true, lazy: true, url: "${model.testUrl}", interval: 3600, timeout: 10000}`,
    );
    out.push(`    proxy: DIRECT`);
  });
  return out;
}

export { renderFromTemplate as default };
