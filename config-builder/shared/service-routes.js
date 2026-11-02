// Public URLs are independent of the internal service's implementation and files.
export const SERVICE_ROUTES = Object.freeze({
  status: "/api/status",
  inspect: "/api/inspect",
  probe: "/api/latency",
  create: "/api/subscriptions",
  preview: "/api/preview",
  subscription: "/subscription/",
});
