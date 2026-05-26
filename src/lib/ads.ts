export const SMART_LINK_AD_URL =
  "https://www.effectivecpmnetwork.com/uchgqj04?key=2574fdb935cb9911fc406e7b646b878a";

export const NATIVE_BANNER_AD = {
  scriptSrc:
    "https://pl29543154.effectivecpmnetwork.com/64b0bde26e8f9484467cb3f9b780f5cf/invoke.js",
  containerId: "container-64b0bde26e8f9484467cb3f9b780f5cf",
} as const;

export const SOCIAL_BAR_AD = {
  scriptSrc:
    "https://pl29543155.effectivecpmnetwork.com/94/64/f9/9464f94ce8203adcb127c961ee69fc51.js",
} as const;

export const POPUNDER_AD = {
  scriptSrc:
    "https://pl29543165.effectivecpmnetwork.com/9e/b5/2e/9eb52e9cbbd4eb0ea5848034ea9f1ac8.js",
} as const;

export type BannerAdSize =
  | "468x60"
  | "460x100"
  | "160x300"
  | "320x50"
  | "728x90"
  | "160x600"
  | "300x250";

type BannerAdUnit = {
  key: string;
  width: number;
  height: number;
  format: "iframe";
  invokeScriptSrc: string;
};

export const BANNER_AD_UNITS: Record<BannerAdSize, BannerAdUnit> = {
  "468x60": {
    key: "5df9d8a3c5779965904de51d4bc59bbd",
    width: 468,
    height: 60,
    format: "iframe",
    invokeScriptSrc:
      "https://www.highperformanceformat.com/5df9d8a3c5779965904de51d4bc59bbd/invoke.js",
  },
  "460x100": {
    key: "5df9d8a3c5779965904de51d4bc59bbd",
    width: 460,
    height: 100,
    format: "iframe",
    invokeScriptSrc:
      "https://www.highperformanceformat.com/5df9d8a3c5779965904de51d4bc59bbd/invoke.js",
  },
  "160x300": {
    key: "fadd1779bd97b3d65c52be0fdc501cd7",
    width: 160,
    height: 300,
    format: "iframe",
    invokeScriptSrc:
      "https://www.highperformanceformat.com/fadd1779bd97b3d65c52be0fdc501cd7/invoke.js",
  },
  "320x50": {
    key: "dcc8355407fd4ba1b056409f3cd0e44a",
    width: 320,
    height: 50,
    format: "iframe",
    invokeScriptSrc:
      "https://www.highperformanceformat.com/dcc8355407fd4ba1b056409f3cd0e44a/invoke.js",
  },
  "728x90": {
    key: "82fd1e0ecb7de4b4e551a57386736098",
    width: 728,
    height: 90,
    format: "iframe",
    invokeScriptSrc:
      "https://www.highperformanceformat.com/82fd1e0ecb7de4b4e551a57386736098/invoke.js",
  },
  "160x600": {
    key: "06a129fe95dfd719dad67514bcaab33d",
    width: 160,
    height: 600,
    format: "iframe",
    invokeScriptSrc:
      "https://www.highperformanceformat.com/06a129fe95dfd719dad67514bcaab33d/invoke.js",
  },
  "300x250": {
    key: "bf62a20e490a361287592a9c51ad8323",
    width: 300,
    height: 250,
    format: "iframe",
    invokeScriptSrc:
      "https://www.highperformanceformat.com/bf62a20e490a361287592a9c51ad8323/invoke.js",
  },
};

export function isPopunderEnabled(extra: Record<string, unknown>): boolean {
  return extra.popunderAdsEnabled === true;
}
