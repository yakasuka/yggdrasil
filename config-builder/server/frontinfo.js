// Owner-editable front-end information (the Ratatoskr YAML template).
//
// The dashboard lets the owner edit the template text that every picker is
// derived from. Edits are kept as a draft in the existing on-disk store; a
// scheduled GitHub Action later commits the draft into the repository so the
// YAML file and the derived catalog.json stay in version control.
//
// No GitHub credential lives here: the Action writes to the repository with
// its built-in GITHUB_TOKEN, and reaches this service over plain HTTPS.

import { parse } from "yaml";
import { catalogFromYaml } from "../shared/catalog-from-yaml.js";
import { applyTemplateOps } from "../shared/template-patch.js";
import bundled from "../shared/catalog.json" with { type: "json" };

export const FRONTINFO_KEY = "frontinfo:draft";
const MAX_TEMPLATE = 1024 * 1024;

function summarize(model) {
  return {
    version: model.version || "",
    regions: model.regions?.length ?? 0,
    apps: model.apps?.length ?? 0,
    rules: model.orderedRules?.length ?? 0,
    strategies: model.strategies?.length ?? 0,
  };
}

// What the editor and the sync Action should load: the live draft if one
// exists, otherwise the repository version embedded at build time.
export async function readFrontInfo(storage) {
  const draft = await storage.get(FRONTINFO_KEY, "json");
  if (draft && typeof draft.text === "string") {
    let catalog = null;
    try {
      catalog = await catalogFromYaml(draft.text);
    } catch {}
    return {
      text: draft.text,
      source: "draft",
      updatedAt: draft.updatedAt || null,
      summary: draft.summary || null,
      catalog,
    };
  }
  return {
    text: bundled.templateText,
    source: "repository",
    updatedAt: null,
    summary: summarize(bundled),
    catalog: bundled,
  };
}

// Validate by actually deriving a catalog, so a broken template can never be
// saved and take down the public /api/catalog endpoint.
export async function saveFrontInfo(storage, text) {
  if (typeof text !== "string" || !text.trim())
    throw new Error("模板内容不能为空。");
  if (text.length > MAX_TEMPLATE)
    throw new Error("模板内容过大（上限 1 MB）。");
  const model = await catalogFromYaml(text);
  const summary = summarize(model);
  const record = {
    text,
    summary,
    updatedAt: new Date().toISOString(),
  };
  // fileStorage.get(key, "json") calls JSON.parse on the stored value, so the
  // value handed to put() must itself be a JSON string.
  await storage.put(FRONTINFO_KEY, JSON.stringify(record));
  return record;
}

// Graphical edits: apply a set of surgical operations to the current text
// (draft first, repository version otherwise), validate the result by deriving
// a catalog, then save. Returning the derived catalog lets the UI re-render
// its cards immediately without re-fetching.
export async function editFrontInfo(storage, ops) {
  if (!Array.isArray(ops) || !ops.length)
    throw new Error("没有需要保存的修改。");
  const current = await readFrontInfo(storage);
  const patched = applyTemplateOps(current.text, ops, parse);
  const model = await catalogFromYaml(patched); // throws on malformed output
  const summary = summarize(model);
  const record = {
    text: patched,
    summary,
    updatedAt: new Date().toISOString(),
  };
  await storage.put(FRONTINFO_KEY, JSON.stringify(record));
  return { record, catalog: model };
}

export async function clearFrontInfo(storage) {
  await storage.delete(FRONTINFO_KEY);
}

// Wrap the service's catalog loader so a saved draft takes effect at runtime
// (before the Action has committed anything). Identical text is cached so
// repeated /api/catalog calls do not reparse the YAML on every request.
export function draftAwareLoader(storage, baseLoader) {
  let cache = null;
  return async (env) => {
    const draft = await storage.get(FRONTINFO_KEY, "json");
    if (!draft || typeof draft.text !== "string") return baseLoader(env);
    if (cache && cache.text === draft.text) return cache.model;
    const model = await catalogFromYaml(draft.text);
    cache = { text: draft.text, model };
    return model;
  };
}
