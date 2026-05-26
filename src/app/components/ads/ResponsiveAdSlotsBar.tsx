"use client";

import { useEffect, useRef, useState } from "react";

const AD_WIDTH = 300;
const AD_HEIGHT = 250;
const AD_GAP = 12;

type AdQueueWindow = Window & {
  __kimAdQueue?: Promise<void>;
  atOptions?: {
    key: string;
    format: "iframe";
    height: number;
    width: number;
    params: Record<string, unknown>;
  };
};

export type ResponsiveAdSlotsBarProps = {
  maxSlots?: number;
  adKeys?: string[];
  mobileAdKeys?: string[];
  enabled?: boolean;
  className?: string;
};

function runInGlobalQueue(task: () => Promise<void>) {
  const queueWindow = window as AdQueueWindow;
  queueWindow.__kimAdQueue = (queueWindow.__kimAdQueue || Promise.resolve())
    .then(task)
    .catch(() => undefined);
  return queueWindow.__kimAdQueue;
}

export default function ResponsiveAdSlotsBar({
  maxSlots = 2,
  adKeys = ["73b06254b42b30e1dada76bc6e9ae0ec"],
  mobileAdKeys = [],
  enabled = true,
  className,
}: ResponsiveAdSlotsBarProps) {
  const [adSlotCount, setAdSlotCount] = useState(1);
  const rowRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeAdKeys = mobileAdKeys.length > 0 ? mobileAdKeys : adKeys;

  useEffect(() => {
    if (!enabled) return;
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;

    const updateSlots = () => {
      const width = row.clientWidth;
      const fitCount = Math.max(1, Math.floor((width + AD_GAP) / (AD_WIDTH + AD_GAP)));
      const count = Math.min(maxSlots, fitCount);
      setAdSlotCount((prev) => (prev === count ? prev : count));
    };

    updateSlots();
    const observer = new ResizeObserver(updateSlots);
    observer.observe(row);

    return () => observer.disconnect();
  }, [maxSlots, enabled]);

  useEffect(() => {
    if (!enabled) return;
    slotRefs.current = slotRefs.current.slice(0, adSlotCount);

    slotRefs.current.forEach((slot) => {
      if (!slot) return;
      slot.innerHTML = "";
    });

    let cancelled = false;

    const renderSlots = async () => {
      for (let index = 0; index < slotRefs.current.length; index += 1) {
        if (cancelled) return;
        const slot = slotRefs.current[index];
        if (!slot) continue;

        const slotKey = activeAdKeys[index] || activeAdKeys[0];
        if (!slotKey) continue;

        await runInGlobalQueue(async () => {
          if (cancelled) return;

          await new Promise<void>((resolve) => {
            slot.innerHTML = "";

            const configScript = document.createElement("script");
            configScript.type = "text/javascript";
            configScript.text = `
              window.atOptions = {
                'key' : '${slotKey}',
                'format' : 'iframe',
                'height' : ${AD_HEIGHT},
                'width' : ${AD_WIDTH},
                'params' : {}
              };
            `;

            const invokeScript = document.createElement("script");
            invokeScript.type = "text/javascript";
            invokeScript.src = `https://www.highperformanceformat.com/${slotKey}/invoke.js?slot=${index}&cb=${Date.now()}`;
            invokeScript.async = false;
            invokeScript.onload = () => {
              window.setTimeout(() => resolve(), 60);
            };
            invokeScript.onerror = () => resolve();

            slot.appendChild(configScript);
            slot.appendChild(invokeScript);
          });
        });
      }
    };

    void renderSlots();

    return () => {
      cancelled = true;
    };
  }, [adSlotCount, activeAdKeys, enabled]);

  if (!enabled) return null;

  return (
    <section
      ref={rowRef}
      className={`responsive-ads-bar${className ? ` ${className}` : ""}`}
      style={{ overflowX: "hidden" }}
    >
      <div className="responsive-ads-bar-row" style={{ flexWrap: "nowrap", minWidth: "max-content" }}>
        {Array.from({ length: adSlotCount }).map((_, index) => (
          <div
            key={`responsive-ad-slot-${index}`}
            ref={(el) => {
              slotRefs.current[index] = el;
            }}
            className="responsive-ads-slot"
            style={{ width: AD_WIDTH, height: AD_HEIGHT, minWidth: AD_WIDTH, minHeight: AD_HEIGHT, flex: "0 0 auto" }}
          />
        ))}
      </div>
    </section>
  );
}
