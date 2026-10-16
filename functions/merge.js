
export async function onRequest(context) {
  const env = context.env;
  const requestUrl = new URL(context.request.url);

  if (
    requestUrl.searchParams.get("token") !== env.TOKEN ||
    !env.TOKEN
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!env.GH_TOKEN) {
    return new Response("GitHub token not configured", {
      status: 500
    });
  }

  try {
    const response = await fetch(
      "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/config.yaml",
      {
        headers: {
          "Authorization": `Bearer ${env.GH_TOKEN}`,
          "Accept": "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );

    if (!response.ok) {
      return new Response("Failed to read private config", {
        status: 502
      });
    }

    let config = await response.text();

    const subscriptionUrl =
      `${requestUrl.origin}/sub?token=${encodeURIComponent(env.TOKEN)}`;

    const urlPattern =
      /^(\s+url:\s*)["'][^"'\n]*\/sub\?token=[^"'\n]*["'](.*)$/m;

    if (!urlPattern.test(config)) {
      return new Response(
        "Could not find the proxy-provider subscription URL",
        { status: 500 }
      );
    }

    config = config.replace(
      urlPattern,
      (_, prefix, suffix) =>
        `${prefix}"${subscriptionUrl}"${suffix}`
    );

    return new Response(config, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="openclash.yaml"'
      }
    });
  } catch {
    return new Response("Internal error", { status: 500 });
  }
}
