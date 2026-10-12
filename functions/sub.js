
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");

  // 验证 Token
  if (!token || token !== context.env.TOKEN) {
    return new Response("Forbidden", {
      status: 403
    });
  }

  // 返回自建节点配置，并附加展示用订阅信息
  return new Response(context.env.NODES, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",

      // 展示用数据，不代表真实流量
      "Subscription-Userinfo":
        "upload=1073741824; download=5368709120; total=107374182400; expire=1798761600",

      // 配置更新间隔：24 小时
      "Profile-Update-Interval": "24",

      // 订阅卡片显示的名称
      "Content-Disposition":
        'attachment; filename="My-Private-Nodes.yaml"'
    }
  });
}
