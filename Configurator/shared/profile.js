export const LIFETIMES = [
  { id: "3h", label: "3 小时", seconds: 10800 },
  { id: "7d", label: "7 天", seconds: 604800 },
  { id: "30d", label: "30 天", seconds: 2592000 },
  { id: "forever", label: "永久", seconds: null },
];
export function filename(title) {
  const safe =
    String(title)
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
      .replace(/^[.\s-]+|[.\s-]+$/g, "")
      .slice(0, 60) || "用户";
  return safe + "-ratatoskr.yaml";
}
export function lifetime(id) {
  const value = LIFETIMES.find((x) => x.id === id);
  if (!value) throw Error("订阅有效期无效。");
  return value.seconds;
}

export function contentDisposition(title) {
  const file = filename(title);
  const ascii = file.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(file).replace(
    /['()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
