import http from "node:http";
import https from "node:https";

const DEFAULT_TIMEOUT_MS = 5000;

// Node's http/https client sends no User-Agent by default. Some management appliances sit behind
// a WAF/bot-filter that blocks or throttles requests with a missing/empty User-Agent, which showed
// up as a false "offline" for a system that opens fine in an actual browser - send a normal
// browser-like one so the check matches what a real user's browser would get.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function requestOnce(parsed: URL, method: "HEAD" | "GET", timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const mod = parsed.protocol === "https:" ? https : http;
    const req = mod.request(
      parsed,
      {
        method,
        timeout: timeoutMs,
        // Most internal management UIs (vCenter/iLO/iDRAC/etc.) use self-signed certs.
        rejectUnauthorized: false,
        headers: { "User-Agent": USER_AGENT },
      },
      (res) => {
        res.resume();
        resolve(true);
      }
    );

    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(false));
    req.end();
  });
}

/**
 * Reachability check, not a content check: any HTTP response (even 4xx/5xx) counts as online,
 * since we only care whether something is listening and answering at that URL.
 */
export async function checkSystemOnline(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  if (await requestOnce(parsed, "HEAD", timeoutMs)) return true;
  // Some appliance/embedded web UIs (NAS, iLO/iDRAC, etc.) don't support HEAD and just reset the
  // connection instead of responding - fall back to GET before calling it offline.
  return requestOnce(parsed, "GET", timeoutMs);
}
