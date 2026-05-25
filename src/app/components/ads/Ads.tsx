"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BANNER_AD_UNITS,
  type BannerAdSize,
  NATIVE_BANNER_AD,
  POPUNDER_AD,
  SMART_LINK_AD_URL,
  SOCIAL_BAR_AD,
} from "@/lib/ads";

type BannerOptionsWindow = Window & {
  __kimAdQueue?: Promise<void>;
  atOptions?: {
    key: string;
    format: "iframe";
    height: number;
    width: number;
    params: Record<string, unknown>;
  };
};

type ClassNameProps = {
  className?: string;
};

type SmartLinkAdAnchorProps = {
  className?: string;
  label?: string;
};

type BannerAdProps = ClassNameProps & {
  size: BannerAdSize;
};

type AdSideRailProps = {
  size: BannerAdSize;
  className?: string;
  smartLinkLabel?: string;
};

type AutoStackedAdSideRailProps = {
  size: BannerAdSize;
  className?: string;
  smartLinkLabel?: string;
  targetSelector?: string;
  minSlots?: number;
  maxSlots?: number;
};

type CompactAdSlotProps = {
  size?: BannerAdSize;
  className?: string;
};

function runInAdQueue(task: () => Promise<void>) {
  const queueWindow = window as BannerOptionsWindow;
  queueWindow.__kimAdQueue = (queueWindow.__kimAdQueue || Promise.resolve())
    .then(task)
    .catch(() => undefined);
  return queueWindow.__kimAdQueue;
}

export function SmartLinkAdAnchor({
  className,
  label = "Open Sponsor Link",
}: SmartLinkAdAnchorProps) {
  return (
    <a href={SMART_LINK_AD_URL} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  );
}

export function SocialBarAdScript() {
  useEffect(() => {
    if (document.querySelector('script[data-kim-ad="social-bar"]')) return;
    const script = document.createElement("script");
    script.src = SOCIAL_BAR_AD.scriptSrc;
    script.setAttribute("data-kim-ad", "social-bar");
    document.body.appendChild(script);
  }, []);

  return null;
}

function useSiteSettingScriptToggle({
  settingKey,
  scriptKey,
  scriptSrc,
}: {
  settingKey: string;
  scriptKey: string;
  scriptSrc: string;
}) {
  useEffect(() => {
    let isMounted = true;

    async function syncScriptState() {
      try {
        const res = await fetch("/api/site-settings", { cache: "no-store" });
        if (!res.ok || !isMounted) return;

        const data = (await res.json()) as { extra?: Record<string, unknown> };
        const enabled = data.extra?.[settingKey] === true;
        const existing = document.querySelector(`script[data-kim-ad="${scriptKey}"]`);

        if (!enabled) {
          if (existing) existing.remove();
          return;
        }

        if (existing) return;

        const script = document.createElement("script");
        script.src = scriptSrc;
        script.setAttribute("data-kim-ad", scriptKey);
        document.body.appendChild(script);
      } catch {
        // Ignore ad loading failures.
      }
    }

    syncScriptState();

    return () => {
      isMounted = false;
    };
  }, [scriptKey, scriptSrc, settingKey]);
}

export function NativeBannerAd({ className }: ClassNameProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const hostSection = root.closest(".global-native-ad-wrap") as HTMLElement | null;

    root.innerHTML = "";
    if (hostSection) hostSection.style.display = "";
    let didRenderAnyCreative = false;

    const evaluateNativeSlot = (allowHide: boolean) => {
      const slot = root.querySelector<HTMLElement>(`#${NATIVE_BANNER_AD.containerId}`);
      if (!slot) return;

      slot.style.setProperty("width", "100%", "important");
      slot.style.setProperty("max-width", "100%", "important");
      slot.style.setProperty("margin", "0", "important");

      const iframe = slot.querySelector<HTMLElement>("iframe");
      if (iframe) {
        iframe.style.setProperty("width", "100%", "important");
        iframe.style.setProperty("max-width", "100%", "important");
        iframe.style.setProperty("display", "block", "important");
      }

      const hasCreative =
        !!iframe ||
        slot.querySelector<HTMLElement>("img, ins, object, embed, video") !== null ||
        slot.childElementCount > 0 ||
        (slot.textContent || "").trim().length > 0;

      if (hasCreative) {
        didRenderAnyCreative = true;
        if (hostSection) hostSection.style.display = "";
        return;
      }

      if ((allowHide || didRenderAnyCreative) && hostSection) {
        hostSection.style.display = "none";
      }
    };

    const slot = document.createElement("div");
    slot.id = NATIVE_BANNER_AD.containerId;
    slot.style.width = "100%";
    slot.style.maxWidth = "100%";
    root.appendChild(slot);

    const observer = new MutationObserver(() => {
      evaluateNativeSlot(false);
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true });

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = NATIVE_BANNER_AD.scriptSrc;
    script.setAttribute("data-kim-ad", "native-banner");
    script.onload = () => {
      window.setTimeout(() => evaluateNativeSlot(true), 900);
    };

    root.appendChild(script);
    evaluateNativeSlot(false);
    const fallbackCheckTimer = window.setTimeout(() => evaluateNativeSlot(true), 4200);

    return () => {
      window.clearTimeout(fallbackCheckTimer);
      observer.disconnect();
      root.innerHTML = "";
      if (hostSection) hostSection.style.display = "";
    };
  }, []);

  return <div ref={rootRef} className={className} />;
}

export function BannerAd({ size, className }: BannerAdProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const unit = useMemo(() => BANNER_AD_UNITS[size], [size]);
  const slotIdRef = useRef(`kim-banner-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;

    mount.innerHTML = "";
    void runInAdQueue(async () => {
      if (cancelled || !mount.isConnected) return;

      await new Promise<void>((resolve) => {
        if (cancelled || !mount.isConnected) {
          resolve();
          return;
        }

        mount.innerHTML = "";

        (window as BannerOptionsWindow).atOptions = {
          key: unit.key,
          format: unit.format,
          height: unit.height,
          width: unit.width,
          params: {},
        };

        const script = document.createElement("script");
        script.async = false;
        script.src = `${unit.invokeScriptSrc}?slot=${slotIdRef.current}&cb=${Date.now()}`;
        script.setAttribute("data-kim-ad", `banner-${size}-${slotIdRef.current}`);
        script.onload = () => window.setTimeout(() => resolve(), 60);
        script.onerror = () => resolve();

        mount.appendChild(script);
      });
    });

    return () => {
      cancelled = true;
      mount.innerHTML = "";
    };
  }, [size, unit.format, unit.height, unit.invokeScriptSrc, unit.key, unit.width]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: `${unit.width}px`, height: `${unit.height}px` }}
    />
  );
}

export function AdSideRail({
  size,
  className,
  smartLinkLabel = "Visit Sponsor",
}: AdSideRailProps) {
  return (
    <div className={`ad-side-rail${className ? ` ${className}` : ""}`}>
      <BannerAd size={size} className="ad-banner-frame" />
      <SmartLinkAdAnchor className="ad-smart-link" label={smartLinkLabel} />
    </div>
  );
}

export function AutoStackedAdSideRail({
  size,
  className,
  smartLinkLabel = "Visit Sponsor",
  targetSelector,
  minSlots = 1,
  maxSlots = 8,
}: AutoStackedAdSideRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [slotCount, setSlotCount] = useState(minSlots);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateSlotCount = () => {
      if (window.innerWidth <= 820) {
        setSlotCount(1);
        return;
      }

      const target =
        (targetSelector ? document.querySelector<HTMLElement>(targetSelector) : null) ||
        rail.parentElement;
      const contentHeight = Math.max(
        target?.scrollHeight || 0,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      const slotStride = BANNER_AD_UNITS[size].height + 12;
      const estimatedCount = Math.max(minSlots, Math.ceil(contentHeight / slotStride));
      const boundedCount = Math.min(maxSlots, estimatedCount);
      setSlotCount((prev) => (prev === boundedCount ? prev : boundedCount));
    };

    updateSlotCount();
    window.addEventListener("resize", updateSlotCount);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateSlotCount());
      const target =
        (targetSelector ? document.querySelector<HTMLElement>(targetSelector) : null) ||
        rail.parentElement;
      if (target) resizeObserver.observe(target);
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("resize", updateSlotCount);
      resizeObserver?.disconnect();
    };
  }, [maxSlots, minSlots, size, targetSelector]);

  return (
    <div ref={railRef} className={`ad-side-rail ad-side-rail-stacked${className ? ` ${className}` : ""}`}>
      {Array.from({ length: slotCount }).map((_, index) => (
        <BannerAd key={`stacked-side-ad-${size}-${index}`} size={size} className="ad-banner-frame" />
      ))}
      <SmartLinkAdAnchor className="ad-smart-link" label={smartLinkLabel} />
    </div>
  );
}

export function CompactAdSlot({ size = "320x50", className }: CompactAdSlotProps) {
  return (
    <div className={`ad-compact-slot${className ? ` ${className}` : ""}`}>
      <BannerAd size={size} className="ad-banner-frame ad-banner-frame-compact" />
    </div>
  );
}

export function PopunderAdGate() {
  useSiteSettingScriptToggle({
    settingKey: "popunderAdsEnabled",
    scriptKey: "popunder",
    scriptSrc: POPUNDER_AD.scriptSrc,
  });

  return null;
}

export function SocialBarAdGate() {
  useSiteSettingScriptToggle({
    settingKey: "socialBarAdsEnabled",
    scriptKey: "social-bar",
    scriptSrc: SOCIAL_BAR_AD.scriptSrc,
  });

  return null;
}
