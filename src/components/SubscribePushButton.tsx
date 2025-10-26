"use client";

import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

export default function SubscribePushButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  async function subscribe() {
    if (!supported) return;
    const reg = await navigator.serviceWorker.ready;
    const resp = await fetch("/api/push/public-key");
    const vapidPublicKey = await resp.text();
    const key = urlBase64ToUint8Array(vapidPublicKey.trim());

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub)
    });
    setSubscribed(true);
  }

  return supported ? (
    <Button size="sm" variant={subscribed ? "success" : "outline-secondary"} onClick={subscribe}>
      {subscribed ? "通知ON" : "通知を有効化"}
    </Button>
  ) : null;
}

// utils
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
