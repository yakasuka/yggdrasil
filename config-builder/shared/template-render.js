// Render a finished config by EDITING the author's ratatoskr-template.yaml in
// place, instead of serialising a freshly built object with yaml.stringify().
//
// Why: the template carries hand-written section banners, inline comments,
// flow-style one-liners and YAML anchors (*FilterAll, &RP-domain). Rebuilding
// the object throws all of that away and produces a noisy, unreadable file.
// Here we keep every original line verbatim and only:
//   1. inject proxy-providers into the AUTO-PROVIDERS marker block
//   2. patch port / allow-lan / title in place
//   3. drop proxy-group / rule / rule-provider lines the user deselected
//   4. rewrite the proxies[] lists of surviving groups so they no longer
//      reference groups we just dropped (keeping flow style + comments)
//
// The decisions come from compile()'s already-validated `config`, so the
// rendered YAML is guaranteed to have the same semantics as that config.
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
  const source = template.replace(/\r\n/g, "\n");
  const lines = source.split("\n");

  // Names that exist in the compiled config. Anything absent was deselected.
  const liveGroups = new Set(config["proxy-groups"].map((x) => x.name));
  const liveRules = new Set(config.rules);
  const liveRuleProviders = new Set(Object.keys(config["rule-providers"] || {}));

  // Full template names of the groups we may drop. compile() uses short names
  // for regions (icons); the template uses full names, so map id -> groupName.
  const regionByName = new Map(model.regions.map((r) => [r.groupName, r.id]));
  const strategyNames = new Set(model.strategies.map((s) => s.name));
  const appNames = new Set(model.apps.map((a) => a.name));

  // A template group line is kept if its group name is present in the compiled
  // config. Regions need the full-name -> short-name translation.
  const templateNameToConfig = (name) => {
    if (regionByName.has(name)) {
      const id = regionByName.get(name);
      return model.regions.find((r) => r.id === id)?.name || null;
    }
    // The OTHER group is `🌌` in config but `🌌 Others` in the template.
    if (name === g.otherGroupName) return g.other;
    return name;
  };
  // Reverse: config short name (icon) -> template full group name.
  const configNameToTemplate = (name) => {
    const r = model.regions.find((x) => x.name === name);
    if (r) return r.groupName;
    if (name === g.other) return g.otherGroupName;
    return name;
  };
  const groupKept = (name) => {
    const mapped = templateNameToConfig(name);
    return liveGroups.has(name) || liveGroups.has(mapped);
  };

  // Which proxies-list references must be rewritten. When a region/strategy
  // group is dropped, exit lists (Hermes / 节点选择 / APP groups) must drop it.
  const dropNames = new Set();
  for (const r of model.regions) {
    if (!liveGroups.has(r.name)) {
      dropNames.add(r.groupName);
      dropNames.add(r.name);
    }
  }
  if (!liveGroups.has(g.other)) {
    dropNames.add(g.otherGroupName);
    dropNames.add(g.other);
  }
  for (const s of model.strategies)
    if (!liveGroups.has(s.name)) dropNames.add(s.name);
  // APP groups removed by the user should also be pruned from exit lists.
  for (const a of model.apps)
    if (!liveGroups.has(a.name)) dropNames.add(a.name);
  // Ports group may be absent when no rule references it.
  if (!liveGroups.has(g.ports)) dropNames.add(g.ports);

  // Find the compiled version of each group by (possibly translated) name.
  const compiled = new Map(
    config["proxy-groups"].map((x) => [x.name, x]),
  );

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

    // --- proxy-group entries ------------------------------------------------
    if (section === "groups") {
      const m = line.match(/^(\s*-\s*\{)(.*?)(\}\s*(?:#.*)?)$/);
      if (m) {
        const name = flowField(m[2], "name");
        if (name) {
          if (!groupKept(name)) {
            // drop this whole line (its leading comment stays as documentation)
            continue;
          }
          const cf = compiled.get(name) || compiled.get(templateNameToConfig(name));
          let body = m[2];
          // Rewrite proxies[] so removed groups are not referenced.
          body = rewriteProxies(body, dropNames, cf);
          // Sync APP default route (first proxy) with the user's policy.
          if (appNames.has(name) && cf?.proxies?.length) {
            body = setFirstProxy(body, configNameToTemplate(cf.proxies[0]));
          }
          // Sync gateway/final first choice with default strategy.
          if (
            (name === g.gateway || name === g.final) &&
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

    // --- rules -------------------------------------------------------------
    if (section === "rules") {
      const m = line.match(/^(\s*-\s*)([A-Z][A-Z-]*,[^#]*?)(\s*(?:#.*)?)$/);
      if (m) {
        const rule = m[2].trim();
        if (!liveRules.has(rule)) continue;
      }
    }

    // --- rule-providers ----------------------------------------------------
    if (section === "ruleproviders") {
      const m = line.match(/^(\s*)([^\s:#][^:]*):(\s*\{.*)$/);
      if (m) {
        const name = m[2].trim();
        if (/\p{Extended_Pictographic}/u.test(name)) {
          if (!liveRuleProviders.has(name)) continue;
        }
      }
    }

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

function rewriteProxies(body, dropNames, cf) {
  const m = body.match(/proxies:\s*\[([^\]]*)\]/);
  if (!m) return body;
  let items = splitFlow(m[1]);
  items = items.filter((x) => !dropNames.has(x));
  // A group should never be empty; compiled config always keeps DIRECT/REJECT.
  if (!items.length && cf?.proxies?.length) items = cf.proxies.slice();
  return body.replace(m[0], `proxies: [${items.join(", ")}]`);
}

function setFirstProxy(body, first) {
  const m = body.match(/proxies:\s*\[([^\]]*)\]/);
  if (!m) return body;
  const items = splitFlow(m[1]).filter((x) => x !== first);
  return body.replace(m[0], `proxies: [${first}, ${items.join(", ")}]`);
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
