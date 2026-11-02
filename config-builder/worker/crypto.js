const encode = new TextEncoder();
export const b64 = (bytes) => {
  const data = new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < data.length; i += 8192)
    str += String.fromCharCode(...data.subarray(i, i + 8192));
  return btoa(str).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};
const unb64 = (text) =>
  Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (c) =>
    c.charCodeAt(0),
  );
const key = (token, mode) =>
  crypto.subtle.importKey("raw", unb64(token), "AES-GCM", false, [mode]);
export const secret = (bytes) =>
  b64(crypto.getRandomValues(new Uint8Array(bytes)));
export async function seal(profile, id, token) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encode.encode(id) },
    await key(token, "encrypt"),
    encode.encode(JSON.stringify(profile)),
  );
  return { iv: b64(iv), cipher: b64(cipher) };
}
export async function open(record, id, token) {
  return JSON.parse(
    new TextDecoder().decode(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: unb64(record.iv),
          additionalData: encode.encode(id),
        },
        await key(token, "decrypt"),
        unb64(record.cipher),
      ),
    ),
  );
}
