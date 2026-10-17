
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  // 1. 验证订阅 Token
  if (!env.TOKEN || url.searchParams.get("token") !== env.TOKEN) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // 2. 检查 GitHub Token
  if (!env.GH_TOKEN) {
    return new Response("Missing GH_TOKEN", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 3. 读取私密仓库 nodes.yaml
  const api =
    "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/nodes.yaml";

  try {
    const response = await fetch(api, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "yggdrasil-subscription",
      },
    });

    if (!response.ok) {
      const detail = await response.text();

      console.error(
        "GitHub nodes.yaml error:",
        response.status,
        detail
      );

      return new Response(
        `Failed to read node file: GitHub HTTP ${response.status}`,
        {
          status: 502,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const data = await response.json();

    if (!data.content || data.encoding !== "base64") {
      return new Response("Invalid GitHub file response", {
        status: 502,
      });
    }

    // 4. Base64 解码为 UTF-8 YAML
    const binary = atob(data.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0)
    );
    const yaml = new TextDecoder("utf-8").decode(bytes);

    // 5. 生成模拟流量信息（非真实统计）
    // 每次请求随机生成 0–20 TiB 的已用流量
    const TiB = 1024 ** 4;
    const used = Math.floor(Math.random() * (20 * TiB + 1));

    // 上传量随机分配，下载量保证与已用总量一致
    const upload = Math.floor(Math.random() * (used + 1));
    const download = used - upload;

    // total=0、expire=0 通常表示不限流量、无到期限制
    const userinfo = [
      `upload=${upload}`,
      `download=${download}`,
      "total=0",
      "expire=0",
    ].join("; ");

    // 6. 返回 YAML，并附加模拟订阅流量响应头
    return new Response(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Subscription-Userinfo": userinfo,
      },
    });
  } catch (error) {
    console.error("sub.js error:", error);

    return new Response("Failed to read node file", {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
