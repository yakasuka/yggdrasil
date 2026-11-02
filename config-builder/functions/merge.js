import gateway from "../worker/gateway/index.js";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  url.pathname = "/merge";
  return gateway.fetch(new Request(url, context.request), context.env);
}
