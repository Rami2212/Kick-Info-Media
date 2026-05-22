const SIGHTENGINE_URL = "https://api.sightengine.com/1.0/check.json";
const DEFAULT_MODELS = "nudity-2.1";

export const MODERATION_BLOCK_MESSAGE = "Pornography is not allowed.";

type NumericMap = Record<string, unknown>;

function readNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function getNestedNumber(obj: NumericMap | undefined, path: string[]): number {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return 0;
    cur = (cur as NumericMap)[key];
  }
  return readNumber(cur);
}

function getMaxScore(obj: NumericMap | undefined, paths: string[][]): number {
  return paths.reduce((max, p) => Math.max(max, getNestedNumber(obj, p)), 0);
}

export function isSightengineConfigured(): boolean {
  return !!process.env.SIGHTENGINE_API_USER && !!process.env.SIGHTENGINE_API_SECRET;
}

export async function checkImageWithSightengine(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const apiUser = process.env.SIGHTENGINE_API_USER || "";
  const apiSecret = process.env.SIGHTENGINE_API_SECRET || "";
  const models = process.env.SIGHTENGINE_MODELS || DEFAULT_MODELS;

  if (!apiUser || !apiSecret) {
    throw new Error("Sightengine credentials are missing.");
  }

  const form = new FormData();
  const binary = new Uint8Array(fileBuffer);
  const blob = new Blob([binary], { type: mimeType || "application/octet-stream" });

  form.append("media", blob, fileName || "upload.jpg");
  form.append("models", models);
  form.append("api_user", apiUser);
  form.append("api_secret", apiSecret);

  const response = await fetch(SIGHTENGINE_URL, {
    method: "POST",
    body: form,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : "Sightengine request failed";
    throw new Error(message);
  }

  const nudity = (payload?.nudity || {}) as NumericMap;
  const gore = (payload?.gore || {}) as NumericMap;
  const selfHarm = (payload?.self_harm || payload?.["self-harm"] || {}) as NumericMap;

  const sexualScore = getMaxScore(nudity, [
    ["sexual_activity"],
    ["sexual_display"],
    ["very_suggestive"],
    ["suggestive"],
    ["erotica"],
  ]);
  const goreScore = getMaxScore(gore, [["prob"], ["very_bloody"], ["graphic"]]);
  const selfHarmScore = getMaxScore(selfHarm, [["prob"], ["intent"]]);

  const blocked = sexualScore >= 0.6 || goreScore >= 0.85 || selfHarmScore >= 0.85;

  return {
    allowed: !blocked,
    sexualScore,
    goreScore,
    selfHarmScore,
    raw: payload,
  };
}
