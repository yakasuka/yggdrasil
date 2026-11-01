import fallback from "../shared/catalog.json" with { type: "json" };
import { catalogFromTemplate } from "../shared/template.js";
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
      const value = await catalogFromTemplate(
        await readLimited(response, 1024 * 1024),
      );
      cached = { value, until: Date.now() + 60000 };
      return value;
    } catch {
      return cached?.value || fallback;
    }
  };
}
