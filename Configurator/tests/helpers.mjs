import fs from "node:fs";
import { defaults, catalog } from "../shared/compiler.js";
import { createWorker } from "../worker/index.js";
export const text = fs.readFileSync(
  new URL("./fixtures/subscription.yaml", import.meta.url),
  "utf8",
);
export const profile = () => ({
  ...defaults(),
  title: "Eaibee",
  providers: [
    {
      name: "香港机场",
      url: "https://airport.example.com/sub?token=private-fixture",
    },
  ],
  countries: ["JP", "US"],
  other: true,
});
export function environment() {
  const records = new Map();
  return {
    records,
    ALLOWED_ORIGINS: "https://yakasuka.github.io",
    TEMPLATE_URL: "bundled",
    TCP_PROBE_ENABLED: "true",
    SUBSCRIPTIONS: {
      put: async (k, v, options) => records.set(k, { v, options }),
      get: async (k, type) => {
        const v = records.get(k)?.v;
        return !v ? null : type === "json" ? JSON.parse(v) : v;
      },
    },
  };
}
export function app({
  model = () => catalog,
  header = "upload=10; download=20; total=100; expire=1900000000",
} = {}) {
  return createWorker({
    loadCatalog: async () => model(),
    resolver: async () => ["8.8.8.8"],
    probe: async () => 12,
    fetcher: async (_url, options) =>
      new Response(options?.method === "HEAD" ? null : text, {
        headers: { "Subscription-Userinfo": header },
      }),
  });
}
export const post = (path, body, origin = "https://yakasuka.github.io") =>
  new Request("https://relay.example" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
