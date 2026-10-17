
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  // 验证订阅 Token
  if (!env.TOKEN || url.searchParams.get("token") !== env.TOKEN) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!env.GH_TOKEN) {
    return new Response("Missing GH_TOKEN", { status: 500 });
  }

  const api =
    "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/nodes.yaml";

  try {
    const response = await fetch(api, {
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "yggdrasil-subscription",
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("GitHub nodes.yaml error:", response.status, detail);

      return new Response(
        `Failed to read node file: GitHub HTTP ${response.status}\n${detail}`,
        {
          status: 502,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    const data = await response.json();

    if (!data.content || data.encoding !== "base64") {
      return new Response("Invalid nodes.yaml response from GitHub", {
        status: 502,
      });
    }

    const binary = atob(data.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const yaml = new TextDecoder("utf-8").decode(bytes);

    // 浏览器直接显示，不强制下载
    return new Response(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("sub.js error:", error);

    return new Response("Failed to read node file", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
