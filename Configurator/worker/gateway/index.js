import { SERVICE_ROUTES } from "../../shared/service-routes.js";
const failure = (status = 404) =>
  Response.json(
    {
      error:
        status === 404 ? "链接不存在。" : "配置服务暂时不可用，请稍后重试。",
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
export default {
  async fetch(request, env) {
    const publicURL = new URL(request.url),
      target = new URL(publicURL);
    const create = publicURL.pathname === SERVICE_ROUTES.create;
    const read = publicURL.pathname.match(
      /^\/subscription\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})(\.yaml|\/status)$/,
    );
    if (
      publicURL.pathname === SERVICE_ROUTES.status &&
      ["GET", "OPTIONS"].includes(request.method)
    )
      target.pathname = "/api/health";
    else if (create && ["POST", "OPTIONS"].includes(request.method))
      target.pathname = "/api/profiles";
    else if (
      publicURL.pathname === SERVICE_ROUTES.inspect &&
      ["POST", "OPTIONS"].includes(request.method)
    )
      target.pathname = "/api/inspect";
    else if (
      publicURL.pathname === SERVICE_ROUTES.probe &&
      ["POST", "OPTIONS"].includes(request.method)
    )
      target.pathname = "/api/probe";
    else if (read && ["GET", "HEAD"].includes(request.method))
      target.pathname = "/s/" + read[1] + "/" + read[2] + read[3];
    else return failure();
    if (!env.PROFILE_SERVICE) return failure(503);
    try {
      const response = await env.PROFILE_SERVICE.fetch(
        new Request(target, request),
      );
      if (response.status >= 500) return failure(503);
      if (create && request.method === "POST" && response.ok) {
        const data = await response.json();
        const internal = new URL(data.url);
        if (
          internal.origin !== publicURL.origin ||
          internal.username ||
          internal.password ||
          internal.search ||
          internal.hash ||
          !/^\/s\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}\.yaml$/.test(
            internal.pathname,
          )
        )
          return failure(502);
        data.url =
          publicURL.origin +
          SERVICE_ROUTES.subscription +
          internal.pathname.slice(3);
        data.usageUrl = data.url.replace(/\.yaml$/, "/status");
        const headers = new Headers(response.headers);
        headers.delete("Content-Length");
        return Response.json(data, { status: response.status, headers });
      }
      return response;
    } catch {
      return failure(503);
    }
  },
};
