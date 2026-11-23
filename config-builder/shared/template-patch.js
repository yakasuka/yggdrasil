// Surgical, format-preserving edits to ratatoskr-template.yaml.
//
// The dashboard's graphical editor works on the derived catalog, but the YAML
// template is the single source of truth and is authored by hand (comments,
// anchors, flow style, alignment). Re-serialising the whole document would
// destroy that. Instead every edit is applied as a line-level patch, so only
// the touched line changes and the rest of the author's file survives byte for
// byte. Each operation is validated afterwards by catalogFromYaml().
//
// Operations (all reference the *current* catalog values so no id/names are
// hard-coded here):
//   { kind:"meta",    name, fields:{label?,category?,flag?,description?,id?} }
//   { kind:"icon",    name, value }          // group icon URL
//   { kind:"exit",    name, value }          // "DIRECT" | "proxy"
//   { kind:"remove",  name }                 // comment out group + its rules
//   { kind:"rule",    rule, enabled:boolean }// comment/uncomment a rule line
//   { kind:"add-app", name, label, category, icon, rule, firstDirect }

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function groupLineIndex(lines, name) {
  const re = new RegExp("^\\s*-\\s*\\{name:\\s*" + escapeRe(name) + "\\s*[,}]");
  return lines.findIndex((line) => re.test(line));
}

// Find the @meta comment associated with a group. catalogFromYaml scans
// forward past blank/comment lines to the next flow-map group, so the nearest
// preceding @meta before the group line is the one that applies.
function metaLineIndex(lines, groupIdx) {
  for (let i = groupIdx - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (!t) continue;
    if (/^#\s*@meta\s+\{/.test(t)) return i;
    if (/^-\s*\{/.test(t)) break; // another group: stop
  }
  return -1;
}

function fieldLiteral(fields) {
  return (
    "{ " +
    Object.entries(fields)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => k + ": " + JSON.stringify(String(v)))
      .join(", ") +
    " }"
  );
}

function stripMetaField(meta, fields) {
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === "") delete meta[k];
  }
  return meta;
}

function applyMeta(lines, op, parse) {
  const idx = groupLineIndex(lines, op.name);
  if (idx < 0) throw Error("找不到策略组：" + op.name);
  const mIdx = metaLineIndex(lines, idx);
  let meta = {};
  if (mIdx >= 0) {
    const match = lines[mIdx].match(/^(\s*#\s*@meta\s+)(\{.*\})(\s*)$/);
    if (match) {
      try {
        const parsed = parse(match[2]);
        if (parsed && typeof parsed === "object") meta = parsed;
      } catch {
        meta = {};
      }
    }
  }
  Object.assign(meta, op.fields || {});
  stripMetaField(meta, op.fields || {});
  const indent = (lines[idx].match(/^\s*/) || [""])[0];
  const line = indent + "# @meta " + fieldLiteral(meta);
  if (mIdx >= 0) lines[mIdx] = line;
  else lines.splice(idx, 0, line);
}

function applyIcon(lines, op) {
  const idx = groupLineIndex(lines, op.name);
  if (idx < 0) throw Error("找不到策略组：" + op.name);
  const value = String(op.value || "").replace(/["'\r\n]/g, "");
  lines[idx] = lines[idx].replace(
    /icon:\s*(?:"[^"]*"|'[^']*'|[^\s,}]+)/,
    'icon: "' + value + '"',
  );
}

function applyExit(lines, op) {
  const idx = groupLineIndex(lines, op.name);
  if (idx < 0) throw Error("找不到策略组：" + op.name);
  const wantDirect = op.value === "DIRECT" || op.value === "direct";
  const first = wantDirect ? "DIRECT" : "🎚️ 节点选择";
  lines[idx] = lines[idx].replace(
    /proxies:\s*\[([^\]]*)\]/,
    (_m, inner) => {
      const items = inner.split(",").map((s) => s.trim());
      if (items[0] === "DIRECT" || items[0] === "🎚️ 节点选择") items[0] = first;
      else items.unshift(first);
      return "proxies: [" + items.join(", ") + "]";
    },
  );
}

function applyRemove(lines, op) {
  const idx = groupLineIndex(lines, op.name);
  if (idx < 0) throw Error("找不到策略组：" + op.name);
  // Comment the group line and any @meta directly above it.
  const mIdx = metaLineIndex(lines, idx);
  if (mIdx >= 0) lines[mIdx] = "# " + lines[mIdx].replace(/^#\s*/, "# ");
  lines[idx] = "# " + lines[idx].replace(/^#\s*/, "# ");
  // Comment rules that target this group (third comma field === name).
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!/^-\s+(?:GEOSITE|RULE-SET|GEOIP|DOMAIN|IP)/i.test(t)) continue;
    const third = t.replace(/^-\s*/, "").split(",")[2];
    if (third && third.trim() === op.name) lines[i] = "# " + lines[i];
  }
}

function applyRule(lines, op) {
  const needle = String(op.rule || "");
  const idx = lines.findIndex((line) => {
    const t = line.trim();
    const bare = t.replace(/^#\s*/, "");
    return bare === "- " + needle || bare === needle;
  });
  if (idx < 0) throw Error("找不到规则：" + needle);
  const t = lines[idx];
  const indent = (t.match(/^\s*/) || [""])[0];
  if (op.enabled) lines[idx] = t.replace(/^(\s*)#\s*/, "$1");
  else lines[idx] = indent + "# " + t.replace(/^\s*#\s*/, "");
}

function applyAddApp(lines, op) {
  const rulesIdx = lines.findIndex((l) => /^rules:\s*$/.test(l.trim()));
  if (rulesIdx < 0) throw Error("模板缺少 rules: 段");
  const name = String(op.name || "").trim();
  if (!name) throw Error("应用名称不能为空");
  const icon = String(op.icon || "").replace(/["'\r\n]/g, "");
  const first = op.firstDirect ? "DIRECT" : "🎚️ 节点选择";
  const proxies = [
    first,
    op.firstDirect ? "🎚️ 节点选择" : "DIRECT",
    "REJECT",
    "🌆 Hong Kong",
    "🧋 Taiwan",
    "⛩️ Japan",
    "🎤 South Korea",
    "🏙️ Singapore",
    "🗽 United States",
    "🌌 Others",
  ].join(", ");
  const meta = "# @meta " + fieldLiteral({
    label: op.label || name.replace(/^\p{Extended_Pictographic}(?:\uFE0F)?\s*/u, ""),
    category: op.category || "其他服务",
  });
  const groupLine =
    "  - {name: " +
    name +
    ", type: select, proxies: [" +
    proxies +
    '], icon: "' +
    icon +
    '"}';
  // Insert the group at the end of proxy-groups (just before rules, after the
  // trailing blank/comment lines so the flow-list stays intact).
  let insertAt = rulesIdx;
  while (insertAt > 0 && !lines[insertAt - 1].trim()) insertAt--;
  lines.splice(insertAt, 0, meta, groupLine);
  // Insert the rule right after rules: (before existing rule content).
  if (op.rule) {
    const rIdx = lines.findIndex((l) => /^rules:\s*$/.test(l.trim()));
    lines.splice(rIdx + 1, 0, "  - " + String(op.rule).trim());
  }
}

/**
 * Apply a list of operations to template text. Returns the patched text.
 * `parse` is the YAML flow parser (from the `yaml` package) used to merge
 * existing @meta objects without losing fields the UI does not expose.
 */
export function applyTemplateOps(text, ops, parse) {
  if (!Array.isArray(ops) || !ops.length) return text;
  const crlf = text.includes("\r\n");
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\r$/, ""));
  for (const op of ops) {
    switch (op.kind) {
      case "meta": applyMeta(lines, op, parse); break;
      case "icon": applyIcon(lines, op); break;
      case "exit": applyExit(lines, op); break;
      case "remove": applyRemove(lines, op); break;
      case "rule": applyRule(lines, op); break;
      case "add-app": applyAddApp(lines, op); break;
      default: throw Error("未知编辑操作：" + op.kind);
    }
  }
  return lines.join(crlf ? "\r\n" : "\n");
}
