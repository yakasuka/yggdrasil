// Public URLs are independent of the internal service's implementation and files.
export const SERVICE_ROUTES = Object.freeze({
  status: "/api/status",
  // Authoritative catalog (derived from the live template). The frontend
  // fetches this at startup so its pickers always mirror the server's config.
  catalog: "/api/catalog",
  inspect: "/api/inspect",
  probe: "/api/latency",
  create: "/api/subscriptions",
  preview: "/api/preview",
  preset: "/api/presets",
  config: "/config-builder",
});
