/**
 * Sync Aethersailor rule files into resources/rules and re-apply local overlays.
 *
 * Change detection is per file: the GitHub blob SHA of the upstream file plus a
 * hash of that file's local overlay. A file is rebuilt only when one of them
 * changes, so unrelated commits in the upstream repo never cause a rebuild.
 *
 * Usage:
 *   node scripts/sync-rule-providers.mjs            # rebuild only changed files
 *   node scripts/sync-rule-providers.mjs --force   # rebuild everything
 *
 * Optional env: GITHUB_TOKEN / GH_TOKEN (raises the GitHub API rate limit).
 * In Actions, GITHUB_OUTPUT receives changed=true|false and the changed file list.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const UPSTREAM_REPO = 'Aethersailor/Custom_OpenClash_Rules';
const UPSTREAM_BRANCH = 'main';
const API_ROOT = `https://api.github.com/repos/${UPSTREAM_REPO}/contents/rule`;

const ROOT = 'resources/rules';
const OVERLAY_DIR = path.join(ROOT, 'overlays');
const STATE_FILE = path.join(ROOT, '.upstream-state.json');

// Keep the upstream file names exactly as they are in Aethersailor's repo.
const FILES = [
  'Custom_Direct_Domain.yaml',
  'Custom_Direct_Classical_IP.yaml',
  'Custom_Proxy_Domain.yaml',
  'Custom_Proxy_Classical_IP.yaml',
  'Custom_Port_Direct.yaml',
];

const force = process.argv.includes('--force');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'yggdrasil-rule-sync',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);
const clean = (value) => value.trim().replace(/^['"]|['"]$/g, '');

function parseItems(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1])
    .filter(Boolean)
    .map((value) => clean(value.replace(/\s+#.*$/, '')))
    .filter(Boolean);
}

const state = JSON.parse(read(STATE_FILE) || '{}');
const changed = [];

for (const name of FILES) {
  const overlayPath = path.join(OVERLAY_DIR, name);
  const excludePath = path.join(OVERLAY_DIR, `${name}.exclude.txt`);
  const overlayText = read(overlayPath);
  const excludeText = read(excludePath);
  const overlayHash = hash(`${overlayText}\n--exclude--\n${excludeText}`);

  // The blob SHA changes only when this specific file changes upstream.
  const response = await fetch(`${API_ROOT}/${name}?ref=${UPSTREAM_BRANCH}`, { headers });
  if (!response.ok) {
    throw new Error(`${name}: GitHub API ${response.status} ${response.statusText}`);
  }
  const meta = await response.json();
  const blobSha = meta.sha;
  if (!blobSha) throw new Error(`${name}: upstream blob SHA missing`);

  const upToDate =
    !force &&
    state[name]?.upstream === blobSha &&
    state[name]?.overlay === overlayHash &&
    fs.existsSync(path.join(ROOT, name));
  if (upToDate) {
    console.log(`= ${name}: unchanged`);
    continue;
  }

  let upstreamText;
  if (meta.content && meta.encoding === 'base64') {
    upstreamText = Buffer.from(meta.content, 'base64').toString('utf8');
  } else if (meta.download_url) {
    const raw = await fetch(meta.download_url);
    if (!raw.ok) throw new Error(`${name}: raw download ${raw.status}`);
    upstreamText = await raw.text();
  } else {
    throw new Error(`${name}: upstream content unavailable`);
  }

  // Guard against silently emptying the local file if the upstream format changes.
  if (!/^payload:/m.test(upstreamText)) {
    throw new Error(`${name}: upstream payload format changed, aborting`);
  }

  const upstream = parseItems(upstreamText);
  const extra = parseItems(overlayText);
  const excluded = new Set(
    excludeText.split(/\r?\n/).map(clean).filter(Boolean)
  );

  const seen = new Set();
  const lines = [];
  for (const item of [...upstream, ...extra]) {
    if (excluded.has(item) || seen.has(item)) continue;
    seen.add(item);
    lines.push(`  - '${item}'`);
  }

  fs.writeFileSync(
    path.join(ROOT, name),
    `# GENERATED - DO NOT EDIT. Add your rules to overlays/${name}\n` +
      `# upstream: ${UPSTREAM_REPO}@${UPSTREAM_BRANCH}/rule/${name}\n` +
      `# upstream blob: ${blobSha}\n` +
      `# total: ${lines.length} (upstream ${upstream.length}, extra ${extra.length})\n` +
      `payload:\n${lines.join('\n')}\n`
  );

  state[name] = {
    upstream: blobSha,
    overlay: overlayHash,
    syncedAt: new Date().toISOString(),
  };
  changed.push(name);
  console.log(`+ ${name}: ${lines.length} rules (upstream ${upstream.length}, extra ${extra.length})`);
}

fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `changed=${changed.length > 0}\nfiles=${changed.join(' ')}\n`
  );
}
console.log(changed.length ? `changed: ${changed.join(', ')}` : 'no changes');
