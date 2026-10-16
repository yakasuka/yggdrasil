
export async function onRequest({ request, env }) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  // 1. 验证访问令牌
  if (!env.TOKEN || token !== env.TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!env.GH_TOKEN || !env.PUBLIC_CONFIG_URL) {
    return new Response("Missing environment configuration", {
      status: 500
    });
  }

  try {
    // 2. 读取公开主配置
    const configResponse = await fetch(env.PUBLIC_CONFIG_URL, {
      headers: { "Cache-Control": "no-cache" }
    });

    if (!configResponse.ok) {
      console.error("Public config read failed:", configResponse.status);
      return new Response("Failed to read public config", {
        status: 502
      });
    }

    // 3. 读取私密仓库中的 providers.yaml
    const providersResponse = await fetch(
      "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/providers.yaml",
      {
        headers: {
          Authorization: `Bearer ${env.GH_TOKEN}`,
          Accept: "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );

    if (!providersResponse.ok) {
      console.error("Private providers read failed:", providersResponse.status);
      return new Response("Failed to read private providers", {
        status: 502
      });
    }

    const config = await configResponse.text();
    const providers = await providersResponse.text();

    // 4. 检查 providers.yaml 格式
    if (!/^proxy-providers:[ \t]*$/m.test(providers)) {
      return new Response("Invalid providers.yaml: missing proxy-providers", {
        status: 500
      });
    }

    // 5. 检查模板标记：必须各出现一次，且顺序正确
    const startMarker = "# >>> AUTO-PROVIDERS-START";
    const endMarker = "# <<< AUTO-PROVIDERS-END";

    if (
      config.split(startMarker).length !== 2 ||
      config.split(endMarker).length !== 2
    ) {
      return new Response("Config must contain exactly one pair of provider markers", {
        status: 500
      });
    }

    const start = config.indexOf(startMarker);
    const end = config.indexOf(endMarker);

    if (start >= end) {
      return new Response("Provider markers are in the wrong order", {
        status: 500
      });
    }

    // 6. 只替换两个标记之间的内容，其他文字保持不动
    const before = config.slice(0, start + startMarker.length);
    const after = config.slice(end);

    const result =
      before + "\n\n" + providers.trim() + "\n\n" + after;

    // 7. 返回最终 YAML
    return new Response(result, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="openclash.yaml"'
      }
    });
  } catch (error) {
    console.error("Merge failed:", error);
    return new Response("Internal error", { status: 500 });
  }
}
