/**
 * Generate the AdGuard browser-extension rule-provider for Clash/Mihomo from
 * official Chromium-extension filter subscriptions.
 *
 * Lazy by design:
 *   - each upstream filter is checked with a HEAD request (ETag / Last-Modified)
 *   - the body is downloaded only when the upstream changed, the local state is
 *     missing, or the enabled-filter list changed
 *   - `@@` exceptions and `$badfilter` rules are subtracted at generation time,
 *     so no separate allow provider is needed
 *   - only exact whole-domain rules (||domain^ / domain$) become blocks;
 *     path-scoped and modifier-scoped rules are ignored to avoid blocking
 *     legitimate main domains
 *   - if nothing changed, no file is rewritten and no commit is produced
 *
 * Usage:
 *   node resources/scripts/rules/generate-adguard-rules.mjs
 *   node resources/scripts/rules/generate-adguard-rules.mjs --force
 *
 * Which browser-extension filters are included is controlled by adguard-filters.json.
 * Flip "enabled" to false there to opt a filter out.
 *
 * In Actions, GITHUB_OUTPUT receives changed=true|false and files=...
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const BASE = 'https://filters.adtidy.org/extension/chromium/filters';
const ROOT = 'resources/rules/adguard';
const FILTER_CONFIG = path.join(ROOT, 'adguard-filters.json');
const STATE_FILE = path.join(ROOT, '.adguard-state.json');
const BLOCK_FILE = path.join(ROOT, 'Custom_AdGuard_Domain.yaml');

const rawConfig = fs.readFileSync(FILTER_CONFIG, 'utf8');
const FILTERS = JSON.parse(rawConfig)
  .filters.filter((f) => f.enabled !== false)
  .map((f) => Number(f.id));
// Bump when the extraction logic changes so cached per-filter domain sets are
// rebuilt with the new rules instead of being reused from the old parser.
const PARSED_VERSION = 2;
// Include the upstream base so switching platform (desktop -> extension)
// invalidates cached ETags even if an ETag happens to match across sources.
const CONFIG_HASH = createHash('sha256')
  .update(JSON.stringify({ base: BASE, version: PARSED_VERSION, filters: FILTERS }))
  .digest('hex')
  .slice(0, 16);

const force = process.argv.includes('--force');
const hash = (s) => createHash('sha256').update(s).digest('hex');
const short = (s) => hash(s).slice(0, 16);

const DOMAIN_RE = /^(?=.{4,253}$)[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?(?:\.[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?)+$/;
// Only whole-domain rules are representable as a Clash DOMAIN-SUFFIX provider.
// The whole line must be exactly `||domain^` / `||domain` / `domain$` with NO
// modifiers and NO path. Anything else is a partial/block-with-conditions rule:
//   ||example.com/path^        -> blocks one path, not the whole site
//   ||example.com^$third-party -> blocks only third-party requests
//   ||example.com^$removeparam -> strips a URL parameter, blocks nothing
//   ||example.com^$popup       -> blocks popups, not the site
// Treating those as whole-domain blocks errors out legitimate main domains
// (e.g. stripchat.com, spotify.com, zhihu.com).
const EXACT_BLOCK_RE = /^\|\|(?:https?:\/\/)?([A-Za-z0-9._-]+)\^?$/;
const EXACT_PLAIN_RE = /^([A-Za-z0-9._-]+)\$$/;
// `||domain^$badfilter` cancels another filter's `||domain^` rule entirely.
const BADFILTER_RE = /^\|\|(?:https?:\/\/)?([A-Za-z0-9._-]+)\^\$badfilter$/;

const state = JSON.parse(fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, 'utf8') : '{}');
const changed = [];
const parsed = new Map();

function normalizeDomain(raw) {
  if (!raw) return null;
  const d = raw.toLowerCase().replace(/^\.+|\.+$/g, '');
  if (d.includes('*') || !DOMAIN_RE.test(d)) return null;
  // Skip raw IPv4/IPv6-like hosts; Clash domain providers are for domains.
  if (/^\d+(\.\d+){3}$/.test(d)) return null;
  return d;
}

// Return the domain only for an exact whole-domain rule; null for everything else.
function exactDomain(line) {
  if (/##|#@#|#%#|#@%#|\$\$/.test(line) || line.startsWith('/')) return null;
  return normalizeDomain((EXACT_BLOCK_RE.exec(line) || EXACT_PLAIN_RE.exec(line))?.[1]);
}

function parseRules(text) {
  const block = new Set();
  const allow = new Set();
  const cancel = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('!')) continue;
    // $badfilter: this rule removes a whole-domain block, never adds one.
    const badfilter = BADFILTER_RE.exec(line);
    if (badfilter) {
      const d = normalizeDomain(badfilter[1]);
      if (d) cancel.add(d);
      continue;
    }
    const isAllow = line.startsWith('@@');
    const body = isAllow ? line.slice(2) : line;
    const domain = exactDomain(body);
    if (!domain) continue;
    (isAllow ? allow : block).add(domain);
  }
  return { block, allow, cancel };
}

async function upstreamMarker(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'yggdrasil-adguard-rules', Accept: '*/*' },
    });
    if (res.ok) {
      return {
        etag: res.headers.get('etag') || '',
        lastModified: res.headers.get('last-modified') || '',
      };
    }
  } catch {
    // fall through to GET
  }
  return null;
}

async function download(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'yggdrasil-adguard-rules', Accept: 'text/plain' },
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await fn(items[index], index);
      }
    })
  );
  return results;
}

// Phase 1: cheap parallel HEAD checks. No body download for unchanged filters.
const plans = await mapLimit(FILTERS, 12, async (fid) => {
  const key = `filter_${fid}`;
  const url = `${BASE}/${fid}.txt`;
  const marker = await upstreamMarker(url);
  const previous = state[key] || {};
  const unchanged =
    !force &&
    state.meta?.filters === CONFIG_HASH &&
    fs.existsSync(BLOCK_FILE) &&
    marker &&
    previous.etag &&
    marker.etag === previous.etag &&
    (previous.lastModified || '') === (marker.lastModified || '');
  return { fid, key, url, marker, previous, unchanged };
});

const skipped = plans.filter((p) => p.unchanged).length;
if (skipped) console.log(`= ${skipped} filters unchanged (lazy skip)`);

// Phase 2: download only what actually changed.
const todo = plans.filter((p) => !p.unchanged);
await mapLimit(todo, 8, async (p) => {
  const text = await download(p.url);
  if (!text.includes('! Title:') && !text.includes('! Checksum:')) {
    throw new Error(`${p.key}: upstream content does not look like an AdGuard filter, aborting`);
  }
  const rules = parseRules(text);
  parsed.set(p.key, rules);
  state[p.key] = {
    etag: p.marker?.etag || p.previous.etag || '',
    lastModified: p.marker?.lastModified || p.previous.lastModified || '',
    sha256: short(text),
    syncedAt: new Date().toISOString(),
    // Persist the parsed domains so unchanged filters (skipped next runs) still
    // contribute their rules to the merged provider. Without this, a run where
    // only 9 filters changed emits only those 9 filters' domains.
    block: [...rules.block],
    allow: [...rules.allow],
    cancel: [...rules.cancel],
  };
  changed.push(p.key);
  console.log(`+ ${p.key}: downloaded ${text.length} bytes`);
});
changed.sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]));

if (!changed.length) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=false\nfiles=\n');
  }
  console.log('no changes');
  process.exit(0);
}

const block = new Set();
const allow = new Set();
const cancel = new Set();
// Merge from state for EVERY enabled filter. `parsed` only holds filters that
// were downloaded this run; skipped-but-unchanged filters live in state's
// cached domain arrays and must still contribute their rules.
let missingCache = 0;
for (const fid of FILTERS) {
  const key = `filter_${fid}`;
  const rules = parsed.get(key) || state[key];
  if (!rules || !rules.block) {
    missingCache++;
    continue;
  }
  for (const d of rules.block) block.add(d);
  for (const d of rules.allow || []) allow.add(d);
  for (const d of rules.cancel || []) cancel.add(d);
}
if (missingCache) console.log(`! ${missingCache} filters missing parsed cache (will rebuild next run)`);
// $badfilter rules cancel a whole-domain block outright (they are AdGuard's
// way of un-publishing a rule from another list).
for (const d of cancel) block.delete(d);
// Allow wins: drop `@@` exceptions from the block list. They are not emitted
// as a separate provider because Clash has no "don't block, keep routing"
// policy -- an Allow→DIRECT rule would override all later GEOSITE routing.
for (const d of allow) block.delete(d);

// Never block the upstream filter host itself. Some AdGuard lists include
// adtidy.org; blocking it would make the rule provider unable to self-update
// and lock the user out of fetching filters when REJECT is enabled.
for (const d of ['adtidy.org', 'filters.adtidy.org']) block.delete(d);

// No timestamp in the header: identical domains must produce byte-identical
// files so Actions can skip commits and CDN purges when nothing really changed.
const sorted = [...block].sort();
const content =
  '# GENERATED - DO NOT EDIT.\n' +
  '# From AdGuard browser-extension (Chromium) filter subscriptions.\n' +
  `# Filters: adguard-filters.json (${FILTERS.length} enabled)\n` +
  `# Upstream: ${BASE}/<id>.txt\n` +
  '#   <id> is a filter number (e.g. 2.txt), not a literal URL.\n' +
  '# Scope: whole-domain blocks only; path/modifier rules and exceptions excluded.\n' +
  `# Domains: ${sorted.length}\n` +
  '\n' +
  `payload:\n${sorted.map((d) => `  - '${d}'`).join('\n')}\n`;
const contentChanged = fs.existsSync(BLOCK_FILE)
  ? fs.readFileSync(BLOCK_FILE, 'utf8') !== content
  : true;
if (contentChanged) fs.writeFileSync(BLOCK_FILE, content);

state.meta = { base: BASE, filters: CONFIG_HASH };
fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `changed=true\ncontentChanged=${contentChanged}\nfiles=${changed.join(' ')}\nblock=${sorted.length}\n`
  );
}
console.log(`changed: ${changed.join(', ')}`);
console.log(`content changed: ${contentChanged}`);
console.log(`block domains: ${sorted.length}`);
