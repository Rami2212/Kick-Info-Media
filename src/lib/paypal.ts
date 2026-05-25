type PayPalEnv = "sandbox" | "live";

function getPayPalEnv(): PayPalEnv {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

export function getPayPalBaseUrl(): string {
  return getPayPalEnv() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getPayPalClientId(): string {
  return (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "").trim();
}

function getPayPalSecret(): string {
  return (process.env.PAYPAL_CLIENT_SECRET || "").trim();
}

function assertCredentials() {
  const clientId = getPayPalClientId();
  const secret = getPayPalSecret();
  if (!clientId || !secret) {
    throw new Error("PayPal credentials are missing.");
  }
  return { clientId, secret };
}

export async function getPayPalAccessToken(): Promise<string> {
  const { clientId, secret } = assertCredentials();
  const baseUrl = getPayPalBaseUrl();
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.access_token) {
    const message = typeof data?.error_description === "string"
      ? data.error_description
      : "Failed to fetch PayPal access token";
    throw new Error(message);
  }

  return String(data.access_token);
}

