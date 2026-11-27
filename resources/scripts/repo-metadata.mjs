#!/usr/bin/env node
/**
 * Repository metadata — single source of truth for GitHub About + SEO.
 *
 * The description/homepage/topics below power the GitHub "About" panel and
 * are mirrored by the landing page meta tags. Keep them in sync.
 *
 * Apply to GitHub (requires a token with `repo` scope):
 *
 *   GH_TOKEN=<token> node resources/scripts/repo-metadata.mjs
 *
 * Print the metadata as JSON without writing:
 *
 *   node resources/scripts/repo-metadata.mjs --print
 */

export const REPO = 'yakasuka/yggdrasil';
export const HOMEPAGE = 'https://yggdrasil-afx.pages.dev/';

export const DESCRIPTION =
  'Yggdrasil 是面向 Mihomo / Clash / OpenClash 的配置与订阅工具，以 Ratatoskr 为核心模板：浏览器插件版 AdGuard 广告拦截、GeoSite/GeoIP 精准分流、多策略出口编排与可视化配置工坊。Mihomo / Clash config builder with browser-extension AdGuard filtering, Geo routing and auto-updating rules.';

export const TOPICS = [
  'mihomo',
  'clash',
  'openclash',
  'clash-verge',
  'proxy',
  'rule-set',
  'geosite',
  'geoip',
  'adguard',
  'adblock',
  'config-generator',
  'subscription',
  'yaml',
  'network-proxy',
  'cloudflare-pages',
  'ratatoskr',
  'mihomo-config',
  'dns',
  'chinese',
  'vpn',
];

async function apply() {
  const token = process.env.GH_TOKEN;
  if (!token) {
    console.error('GH_TOKEN is required. Run with: GH_TOKEN=<token> node resources/scripts/repo-metadata.mjs');
    process.exit(1);
  }

  const api = `https://api.github.com/repos/${REPO}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'yggdrasil-repo-metadata',
    'Content-Type': 'application/json',
  };

  const patch = await fetch(api, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ description: DESCRIPTION, homepage: HOMEPAGE }),
  });
  if (!patch.ok) {
    console.error(`PATCH /repos failed: ${patch.status} ${await patch.text()}`);
    process.exit(1);
  }

  const topicsRes = await fetch(`${api}/topics`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ names: TOPICS }),
  });
  if (!topicsRes.ok) {
    console.error(`PUT /topics failed: ${topicsRes.status} ${await topicsRes.text()}`);
    process.exit(1);
  }

  const data = await patch.json();
  console.log(`Updated About for ${REPO}:`);
  console.log(`  description: ${data.description}`);
  console.log(`  homepage:    ${data.homepage}`);
  console.log(`  topics:      ${TOPICS.join(', ')}`);
}

if (process.argv.includes('--print')) {
  console.log(JSON.stringify({ repo: REPO, homepage: HOMEPAGE, description: DESCRIPTION, topics: TOPICS }, null, 2));
} else {
  apply().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
