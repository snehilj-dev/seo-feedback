import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const targetEndpoint = process.env.TARGET_WEBHOOK;

  if (!targetEndpoint) {
    return res.status(500).json({
      error: "TARGET_WEBHOOK not configured",
      message: "Set TARGET_WEBHOOK to the public n8n webhook URL.",
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 360000);

    const forwardRes = await fetch(targetEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/pdf",
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!forwardRes.ok) {
      const errorText = await forwardRes.text();
      console.error("Target webhook error:", forwardRes.status, errorText);
      return res.status(forwardRes.status).json({
        error: "Target webhook error",
        status: forwardRes.status,
        message: errorText || "Upstream webhook returned an error.",
      });
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(202).json({
      status: "accepted",
      message: "SEO workflow triggered. Report PDF will be emailed shortly.",
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(err.name === "AbortError" ? 504 : 500).json({
      error: "Proxy error",
      message: String(err),
    });
  }
}
