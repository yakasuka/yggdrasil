/**
 * Generate the AdGuard browser-extension rule-provider for Clash/Mihomo from
 * official Chromium-extension filter subscriptions.
 *
 * Lazy by design:
 *   - each upstream filter is checked with a HEAD request (ETag / Last-Modified)
 *   - the body is downloaded only when the upstream changed, the local state is
 *     missing, or the enabled-filter list changed
 *   - `@@` exceptions are subtracted from the block list at generation time,
 *     so no separate allow provider is needed
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
// Include the upstream base so switching platform (desktop -> extension)
// invalidates cached ETags even if an ETag happens to match across sources.
const CONFIG_HASH = createHash('sha256')
  .update(JSON.stringify({ base: BASE, filters: FILTERS }))
  .digest('hex')
  .slice(0, 16);

const force = process.argv.includes('--force');
const hash = (s) => createHash('sha256').update(s).digest('hex');
const short = (s) => hash(s).slice(0, 16);

const DOMAIN_RE = /^(?=.{4,253}$)[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?(?:\.[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?)+$/;
const URL_FILTER_RE = /^\|\|(?:https?:\/\/)?([A-Za-z0-9._-]+)(?:[\^/:]|$)/;
const PLAIN_FILTER_RE = /^([A-Za-z0-9._-]+)\$/;

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

function extractDomain(line) {
  // Cosmetic, scriptlet, HTML-filtering and regex rules cannot be represented
  // by a Clash domain rule-provider, so they are intentionally ignored.
  if (/##|#@#|#%#|#@%#|\$\$/.test(line) || line.startsWith('/')) return null;
  const body = line.split('$')[0];
  const m = URL_FILTER_RE.exec(body) || PLAIN_FILTER_RE.exec(body);
  return normalizeDomain(m?.[1]);
}

function parseRules(text) {
  const block = new Set();
  const allow = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('!')) continue;
    const isAllow = line.startsWith('@@');
    const body = isAllow ? line.slice(2) : line;
    const domain = extractDomain(body);
    if (!domain) continue;
    (isAllow ? allow : block).add(domain);
  }
  return { block, allow };
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
  parsed.set(p.key, parseRules(text));
  state[p.key] = {
    etag: p.marker?.etag || p.previous.etag || '',
    lastModified: p.marker?.lastModified || p.previous.lastModified || '',
    sha256: short(text),
    syncedAt: new Date().toISOString(),
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
for (const { block: b, allow: a } of parsed.values()) {
  for (const d of b) block.add(d);
  for (const d of a) allow.add(d);
}
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
  '# GENERATED - DO NOT EDIT. Source: AdGuard browser-extension filters.\n' +
  `# config: adguard-filters.json (${FILTERS.length} enabled)\n` +
  `# source: ${BASE}/{id}.txt\n` +
  `# block domains: ${sorted.length}\n` +
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
