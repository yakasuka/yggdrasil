// Friendly config links expose a readable name instead of a random id/key.
// An optional password adds a second dimension to the storage key so two
// people can keep a memorable name without colliding. The password is hashed
// before it reaches storage and is never written to disk in plain text.

export const CONFIG_NAME_RE = /^[\p{L}\p{N}_-]{3,60}$/u;
export const CONFIG_PWD_RE = /^[^\s\x00-\x1f\x7f]{1,64}$/u;

const encoder = new TextEncoder();

export function configQuery(name, pwd = "") {
  const normalized = String(name || "").toLowerCase();
  if (!CONFIG_NAME_RE.test(normalized)) return null;
  const params = new URLSearchParams({ token: normalized });
  if (pwd) {
    if (!CONFIG_PWD_RE.test(pwd)) return null;
    params.set("pwd", pwd);
  }
  return params.toString();
}

export function parseConfigQuery(searchParams) {
  const name = String(searchParams.get("token") || "").toLowerCase();
  if (!CONFIG_NAME_RE.test(name)) return null;
  const keys = [...searchParams.keys()];
  if (keys.length === 1) return { name, pwd: "" };
  if (keys.length !== 2 || !keys.includes("pwd")) return null;
  const pwd = searchParams.get("pwd");
  if (!CONFIG_PWD_RE.test(pwd || "")) return null;
  return { name, pwd };
}

export async function configAliasKey(name, pwd = "") {
  const base = "alias:" + String(name).toLowerCase();
  if (!pwd) return base;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(
      "yggdrasil:config-link\0" + String(name).toLowerCase() + "\0" + pwd,
    ),
  );
  const suffix = [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return base + ":" + suffix;
}
