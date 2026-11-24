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
//   { kind:"rule-remove", rule }             // delete a rule line outright
//   { kind:"add-app", name, label, category, icon, rule, firstDirect }
//   { kind:"general", fields:{port?, ...} }  // top-level general settings
//   { kind:"filter",  id, value }            // FilterAll / FilterOthers / region regex
//   { kind:"group-props", name, fields }     // type / url / interval / proxies / ...
//   { kind:"rule-text", rule, value }        // rewrite one rule line in place
//   { kind:"rule-move", rule, to:"up"|"down" }
//   { kind:"rule-add", rule }                // insert before MATCH
//   { kind:"provider", name, fields }        // rule-providers entry

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

function applyRuleRemove(lines, op) {
  const needle = String(op.rule || "");
  const idx = lines.findIndex((line) => {
    const bare = line.trim().replace(/^#\s*/, "");
    return bare === "- " + needle || bare === needle;
  });
  if (idx < 0) throw Error("找不到规则：" + needle);
  lines.splice(idx, 1);
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

// Render a value back into a YAML flow map without losing the author's inline
// comment or the surrounding one-line style.
function yamlValue(value, key) {
  if (key === "proxies" || Array.isArray(value)) {
    const inner = Array.isArray(value) ? value.join(", ") : String(value).replace(/^\[|\]$/g, "");
    return "[" + inner + "]";
  }
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  const s = String(value ?? "");
  if (s === "") return '""';
  if (/^(true|false|null|~)$/i.test(s) || /^[-+]?\d+(\.\d+)?$/.test(s)) return s;
  // Loopback controller values are valid plain scalars even with a colon.
  if (/^127\.0\.0\.1:\d+$/.test(s)) return s;
  return JSON.stringify(s);
}

function replaceFlowValue(line, key, value) {
  const re = new RegExp(
    "(\\b" + escapeRe(key) + "\\s*:\\s*)(?:\"[^\"]*\"|'[^']*'|\\[[^\\]]*\\]|\\*[\\w-]+|[^\\s,}]+)",
  );
  if (!re.test(line)) throw Error("策略组缺少可编辑字段：" + key);
  return line.replace(re, (_m, prefix) => prefix + yamlValue(value, key));
}

function applyGeneral(lines, op) {
  for (const [key, value] of Object.entries(op.fields || {})) {
    const idx = lines.findIndex((line) => new RegExp("^" + escapeRe(key) + "\\s*:").test(line));
    if (idx < 0) throw Error("找不到基础设置：" + key);
    const line = lines[idx];
    const commentAt = line.indexOf(" #");
    const comment = commentAt >= 0 ? line.slice(commentAt).trimEnd() : "";
    const head = (commentAt >= 0 ? line.slice(0, commentAt) : line).trimEnd();
    lines[idx] = head.slice(0, head.indexOf(":") + 1) + " " + yamlValue(value, key) + (comment ? "         " + comment : "");
  }
}

function applyFilter(lines, op) {
  const id = String(op.id || "");
  const key = id === "all" ? "FilterAll" : id === "others" ? "FilterOthers" : id;
  const anchor = "&" + (key.startsWith("Filter") ? key : "Filter" + key) + " ";
  const idx = lines.findIndex((line) => {
    const t = line.trimStart();
    return t.startsWith(key + ":") && t.includes(anchor);
  });
  if (idx < 0) throw Error("找不到节点筛选规则：" + id);
  const value = String(op.value ?? "").replace(/'/g, "''");
  const cut = lines[idx].indexOf(anchor) + anchor.length;
  lines[idx] = lines[idx].slice(0, cut) + "'" + value + "'";
}

function applyGroupProps(lines, op) {
  const idx = groupLineIndex(lines, op.name);
  if (idx < 0) throw Error("找不到策略组：" + op.name);
  for (const [key, value] of Object.entries(op.fields || {})) {
    if (key === "proxies") {
      lines[idx] = lines[idx].replace(
        /proxies:\s*\[[^\]]*\]/,
        "proxies: " + yamlValue(value, "proxies"),
      );
    } else {
      lines[idx] = replaceFlowValue(lines[idx], key, value);
    }
  }
}

function ruleLineIndex(lines, rule) {
  const needle = String(rule || "").trim();
  return lines.findIndex((line) => {
    const t = line.trim().replace(/^#\s*/, "").replace(/^-\s*/, "");
    return t === needle;
  });
}

function rulesRange(lines) {
  const start = lines.findIndex((l) => /^rules:\s*$/.test(l.trim()));
  if (start < 0) throw Error("模板缺少 rules: 段");
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i])) { end = i; break; }
  }
  return [start, end];
}

function applyRuleText(lines, op) {
  const idx = ruleLineIndex(lines, op.rule);
  if (idx < 0) throw Error("找不到规则：" + op.rule);
  const m = lines[idx].match(/^(\s*)(#\s*)?-\s+.*$/);
  if (!m) throw Error("规则行格式不受支持：" + op.rule);
  const value = String(op.value || "").replace(/^\s*-\s*/, "").trim();
  if (!/^(GEOSITE|RULE-SET|GEOIP|DOMAIN|IP|MATCH)/i.test(value))
    throw Error("规则必须以 GEOSITE / RULE-SET / GEOIP 等类型开头");
  lines[idx] = m[1] + (m[2] || "") + "- " + value;
}

function applyRuleMove(lines, op) {
  const idx = ruleLineIndex(lines, op.rule);
  if (idx < 0) throw Error("找不到规则：" + op.rule);
  const [start, end] = rulesRange(lines);
  const up = op.to !== "down";
  let target = up ? idx - 1 : idx + 1;
  while (target > start && target < end - 1 &&
         (!lines[target].trim() || /^\s*#/.test(lines[target]))) {
    target += up ? -1 : 1;
  }
  if (target <= start || target >= end) return;
  const tmp = lines[idx];
  lines[idx] = lines[target];
  lines[target] = tmp;
}

function applyRuleAdd(lines, op) {
  const [start, end] = rulesRange(lines);
  const value = String(op.rule || "").replace(/^\s*-\s*/, "").trim();
  if (!/^(GEOSITE|RULE-SET|GEOIP|DOMAIN|IP|MATCH)/i.test(value))
    throw Error("规则必须以 GEOSITE / RULE-SET / GEOIP 等类型开头");
  let at = end;
  for (let i = start + 1; i < end; i++) {
    if (/^\s*-\s*MATCH,/i.test(lines[i])) { at = i; break; }
  }
  lines.splice(at, 0, "  - " + value);
}

function sectionRange(lines, heading) {
  const start = lines.findIndex((l) => new RegExp("^" + escapeRe(heading) + "\\s*:\\s*$").test(l.trim()));
  if (start < 0) throw Error("模板缺少 " + heading + ": 段");
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i])) { end = i; break; }
  }
  return [start, end];
}

function applyProvider(lines, op) {
  const [start, end] = sectionRange(lines, "rule-providers");
  const idx = lines.findIndex((line, i) =>
    i > start && i < end &&
    new RegExp("^\\s*" + escapeRe(op.name) + "\\s*:\\s*\\{").test(line));
  if (idx < 0) throw Error("找不到规则源：" + op.name);
  for (const [key, value] of Object.entries(op.fields || {})) {
    if (key === "<<") throw Error("锚点字段不可编辑");
    const re = new RegExp("(\\b" + escapeRe(key) + "\\s*:\\s*)(?:\"[^\"]*\"|'[^']*'|[^\\s,}]+)");
    if (re.test(lines[idx])) {
      lines[idx] = replaceFlowValue(lines[idx], key, value);
    } else {
      // Inherited from an anchor — make the override explicit on this line.
      lines[idx] = lines[idx].replace(/(\{\s*)/, "$1" + key + ": " + yamlValue(value, key) + ", ");
    }
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
      case "rule-remove": applyRuleRemove(lines, op); break;
      case "add-app": applyAddApp(lines, op); break;
      case "general": applyGeneral(lines, op); break;
      case "filter": applyFilter(lines, op); break;
      case "group-props": applyGroupProps(lines, op); break;
      case "rule-text": applyRuleText(lines, op); break;
      case "rule-move": applyRuleMove(lines, op); break;
      case "rule-add": applyRuleAdd(lines, op); break;
      case "provider": applyProvider(lines, op); break;
      default: throw Error("未知编辑操作：" + op.kind);
    }
  }
  return lines.join(crlf ? "\r\n" : "\n");
}
