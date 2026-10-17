export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  // 1. 验证订阅 Token
  if (!env.TOKEN || url.searchParams.get("token") !== env.TOKEN) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  // 2. 检查 GitHub Token
  if (!env.GH_TOKEN) {
    return new Response("Missing GH_TOKEN environment variable", {
      status: 500,
    });
  }

  // 3. 私密仓库中的节点配置文件
  const api =
    "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/nodes.yaml";

  try {
    const res = await fetch(api, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "yggdrasil-subscription",
      },
    });

    // 4. 返回 GitHub 的具体错误，方便定位 403 原因
    if (!res.ok) {
      const detail = await res.text();

      console.error("GitHub API error:", res.status, detail);

      return new Response(
        `Failed to read node file: GitHub HTTP ${res.status}\n${detail}`,
        {
          status: 502,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 5. 解析 GitHub 返回的文件内容
    const data = await res.json();

    if (!data.content || data.encoding !== "base64") {
      return new Response("Invalid GitHub file response", {
        status: 502,
      });
    }

    // Base64 解码，并安全转换为 UTF-8 文本
    const binary = atob(data.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const content = new TextDecoder("utf-8").decode(bytes);

    // 6. 返回节点 YAML 文件
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="yggdrasil.yaml"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Subscription error:", error);

    return new Response("Failed to read node file", {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}