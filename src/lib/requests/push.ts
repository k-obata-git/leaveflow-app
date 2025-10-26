// import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

let configured = false;

export function ensureConfigured() {
  if (!configured) {
    // webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
}

export async function sendPush(payload: any, subscription: { endpoint: string; keys: { p256dh: string; auth: string }}) {
  ensureConfigured();
  // return webpush.sendNotification(subscription as any, JSON.stringify(payload));
  return;
}
