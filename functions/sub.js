export async function onRequest(context) {
  return new Response(
    "Pages Function OK",
    {
      headers: {
        "Content-Type": "text/plain"
      }
    }
  );
}