import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { open, seal } from "../worker/crypto.js";
import { newShareCode, pickShareable, SHARE_CODE_RE } from "../shared/share.js";

// Shared codes live in the same file-backed store as subscriptions, but are
// sealed with a local key so the on-disk record never contains airport URLs in
// plain text. The key is generated once and stays on the owner's server.
export function createPresetStore(storage, options = {}) {
  const directory = storage.directory || process.cwd();
  const keyPath = options.keyPath || join(directory, ".preset-key");
  const ttl = Number(options.ttl) > 0 ? Number(options.ttl) : 0;
  let keyPromise;

  function encryptionKey() {
    keyPromise ||= (async () => {
      try {
        const value = (await readFile(keyPath, "utf8")).trim();
        if (value) return value;
      } catch {}
      const value = randomBytes(32).toString("base64url");
      await writeFile(keyPath, value, { encoding: "utf8", mode: 0o600 });
      return value;
    })();
    return keyPromise;
  }

  const storageKey = (code) => "preset:" + code;

  return {
    async create(profile, includeProviders = false) {
      const shared = pickShareable(profile, includeProviders);
      if (!shared) throw Error("配置内容无效。");
      // A fresh code is generated per request; the code is never derived from
      // the profile, so similar choices cannot be correlated.
      let code = newShareCode();
      while (await storage.get(storageKey(code), "json")) code = newShareCode();
      const record = await seal(shared, code, await encryptionKey());
      await storage.put(
        storageKey(code),
        JSON.stringify(record),
        ttl ? { expirationTtl: ttl } : {},
      );
      return code;
    },
    async read(code) {
      if (!SHARE_CODE_RE.test(code)) return null;
      const record = await storage.get(storageKey(code), "json");
      if (!record) return null;
      try {
        return await open(record, code, await encryptionKey());
      } catch {
        return null;
      }
    },
  };
}
