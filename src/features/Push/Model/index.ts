import { z } from "zod";

const endpointSchema = z.url().refine((value) => {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      host === "fcm.googleapis.com" || host === "fcmregistrations.googleapis.com" ||
      host === "web.push.apple.com" || host.endsWith(".push.services.mozilla.com") ||
      /^wns[\w-]*\.notify\.windows\.com$/.test(host)
    );
  } catch { return false; }
}, "Endpoint push inválido.");

export const subscriptionSchema = z.object({ endpoint: endpointSchema, keys: z.object({ p256dh: z.string().min(20).max(256), auth: z.string().min(10).max(256) }) });
export const unsubscribeSchema = z.object({ endpoint: endpointSchema });
export interface PushPermissionProps { enabled: boolean }
