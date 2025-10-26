export async function GET() {
  return new Response(process.env.VAPID_PUBLIC_KEY || "", { headers: { "Content-Type": "text/plain" } });
}
