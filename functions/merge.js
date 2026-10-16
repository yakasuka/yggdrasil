
export async function onRequest({ request, env }) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  // 验证访问令牌
  if (!env.TOKEN || token !== env.TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  // 检查环境变量
  if (!env.GH_TOKEN || !env.PUBLIC_CONFIG_URL) {
    console.error("Missing environment configuration:", {
      GH_TOKEN: Boolean(env.GH_TOKEN),
      PUBLIC_CONFIG_URL: Boolean(env.PUBLIC_CONFIG_URL),
    });

    return new Response("Missing environment configuration", {
      status: 500,
    });
  }

  try {
    // 读取公开仓库的主配置
    const configResponse = await fetch(env.PUBLIC_CONFIG_URL, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    console.log("Public config status:", configResponse.status);

    if (!configResponse.ok) {
      console.error(
        "Public config read failed:",
        configResponse.status,
        configResponse.statusText
      );

      return new Response("Failed to read public config", {
        status: 502,
      });
    }

    // 读取私密仓库中的 providers.yaml
    const providersUrl =
      "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/providers.yaml";

    const providersResponse = await fetch(providersUrl, {
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "yggdrasil-afx",
      },
    });

    console.log("GitHub providers status:", providersResponse.status);

    if (!providersResponse.ok) {
      const errorBody = await providersResponse.text();

      // 仅记录 GitHub 错误信息，不记录任何令牌或订阅 URL
      console.error("Private providers read failed:", {
        status: providersResponse.status,
        statusText: providersResponse.statusText,
        body: errorBody.slice(0, 500),
      });

      return new Response(
        `Failed to read private providers (GitHub HTTP ${providersResponse.status})`,
        { status: 502 }
      );
    }

    const config = await configResponse.text();
    const providers = await providersResponse.text();

    // 检查 providers.yaml 格式
    if (!/^proxy-providers:[ \t]*$/m.test(providers)) {
      console.error("Invalid providers.yaml: missing proxy-providers");

      return new Response(
        "Invalid providers.yaml: missing proxy-providers",
        { status: 500 }
      );
    }

    // 检查主配置中的插入标记
    const startMarker = "# >>> AUTO-PROVIDERS-START";
    const endMarker = "# <<< AUTO-PROVIDERS-END";

    if (
      config.split(startMarker).length !== 2 ||
      config.split(endMarker).length !== 2
    ) {
      console.error("Config must contain exactly one pair of provider markers");

      return new Response(
        "Config must contain exactly one pair of provider markers",
        { status: 500 }
      );
    }

    const start = config.indexOf(startMarker);
    const end = config.indexOf(endMarker);

    if (start >= end) {
      console.error("Provider markers are in the wrong order");

      return new Response("Provider markers are in the wrong order", {
        status: 500,
      });
    }

    // 只替换两个标记之间的内容，其他主配置保持不变
    const before = config.slice(0, start + startMarker.length);
    const after = config.slice(end);

    const result =
      before + "\n\n" + providers.trim() + "\n\n" + after;

    return new Response(result, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="openclash.yaml"',
      },
    });
  } catch (error) {
    console.error("Merge failed:", error);

    return new Response("Internal error", {
      status: 500,
    });
  }
}
