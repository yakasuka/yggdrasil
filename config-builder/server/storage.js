import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";

// A small KV-compatible store. Each record is one file on the owner's server,
// so no Cloudflare KV namespace is needed. Records are still AES-GCM sealed by
// worker/crypto.js before they reach this layer.
export function fileStorage(directory) {
  const pathFor = (key) =>
    join(directory, createHash("sha256").update(String(key)).digest("hex") + ".json");

  async function read(key) {
    let record;
    try {
      record = JSON.parse(await readFile(pathFor(key), "utf8"));
    } catch {
      return null;
    }
    if (record.expiresAt && record.expiresAt <= Date.now()) {
      await unlink(pathFor(key)).catch(() => {});
      return null;
    }
    return record;
  }

  // Enumerate live records for the owner's admin API. The key is embedded in
  // each file so hashed filenames never leak as identifiers.
  async function list() {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return [];
    }
    const result = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      let record;
      try {
        record = JSON.parse(
          await readFile(join(directory, entry.name), "utf8"),
        );
      } catch {
        continue;
      }
      if (record.expiresAt && record.expiresAt <= Date.now()) {
        await unlink(join(directory, entry.name)).catch(() => {});
        continue;
      }
      if (typeof record.key === "string" && record.key)
        result.push({ key: record.key, value: record.value, expiresAt: record.expiresAt || null });
    }
    return result;
  }

  return {
    directory,
    async put(key, value, options = {}) {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const ttl = Number(options?.expirationTtl);
      const record = {
        key,
        value,
        expiresAt: Number.isFinite(ttl) && ttl > 0 ? Date.now() + ttl * 1000 : null,
      };
      const target = pathFor(key);
      const temporary = target + "." + randomUUID() + ".tmp";
      await writeFile(temporary, JSON.stringify(record), {
        encoding: "utf8",
        mode: 0o600,
      });
      try {
        await rename(temporary, target);
      } catch (error) {
        await unlink(temporary).catch(() => {});
        throw error;
      }
    },
    async get(key, type) {
      const record = await read(key);
      if (!record) return null;
      return type === "json" ? JSON.parse(record.value) : record.value;
    },
    async delete(key) {
      await unlink(pathFor(key)).catch(() => {});
    },
    list,
    async purge() {
      let entries = [];
      try {
        entries = await readdir(directory);
      } catch {
        return 0;
      }
      let removed = 0;
      for (const name of entries) {
        if (!name.endsWith(".json")) continue;
        const path = join(directory, name);
        try {
          const record = JSON.parse(await readFile(path, "utf8"));
          if (record.expiresAt && record.expiresAt <= Date.now()) {
            await unlink(path);
            removed++;
          }
        } catch {}
      }
      return removed;
    },
  };
}
