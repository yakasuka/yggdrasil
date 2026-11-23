import fallback from "../shared/catalog.json" with { type: "json" };
// Use the SAME generator the static build uses. The old catalogFromTemplate
// required a legacy `x-configurator.schema: 1` block that the current template
// no longer has, so every remote-template load silently fell back to the
// bundled snapshot — remote edits never reached the service, and its version
// hash disagreed with the frontend's. One generator = one source of truth.
import { catalogFromYaml } from "../shared/catalog-from-yaml.js";
import { readLimited } from "./subscriptions.js";
export function catalogLoader(fetcher = fetch) {
  let cached;
  return async (env) => {
    if (!env.TEMPLATE_URL || env.TEMPLATE_URL === "bundled") return fallback;
    if (cached && cached.until > Date.now()) return cached.value;
    try {
      const response = await fetcher(env.TEMPLATE_URL, {
        signal: AbortSignal.timeout(6000),
        headers: { Accept: "text/plain" },
      });
      if (!response.ok) throw Error();
      const value = await catalogFromYaml(
        await readLimited(response, 1024 * 1024),
      );
      cached = { value, until: Date.now() + 60000 };
      return value;
    } catch {
      return cached?.value || fallback;
    }
  };
}
