export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return response;
    }

    const origin = new URL(request.url).origin;

    return new HTMLRewriter()
      .on("meta[data-dynamic-og]", {
        element(element) {
          element.setAttribute("content", `${origin}/og.png`);
        },
      })
      .transform(response);
  },
};
