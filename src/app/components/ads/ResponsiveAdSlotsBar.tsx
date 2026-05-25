"use client";

import { useEffect, useRef, useState } from "react";

const AD_WIDTH = 468;
const AD_HEIGHT = 60;
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
  enabled?: boolean;
  className?: string;
};

function runInAdQueue(task: () => Promise<void>) {
  const queueWindow = window as AdQueueWindow;
  queueWindow.__kimAdQueue = (queueWindow.__kimAdQueue || Promise.resolve())
    .then(task)
    .catch(() => undefined);
  return queueWindow.__kimAdQueue;
}

export default function ResponsiveAdSlotsBar({
  maxSlots = 4,
  adKeys = [
    "73b06254b42b30e1dada76bc6e9ae0ec",
    "73b06254b42b30e1dada76bc6e9ae0ec",
    "73b06254b42b30e1dada76bc6e9ae0ec",
    "73b06254b42b30e1dada76bc6e9ae0ec",
  ],
  enabled = true,
  className,
}: ResponsiveAdSlotsBarProps) {
  const [adSlotCount, setAdSlotCount] = useState(1);
  const rowRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;

    const updateSlots = () => {
      const width = row.clientWidth;
      const fitCount = Math.max(1, Math.floor((width + AD_GAP) / (AD_WIDTH + AD_GAP)));
      const nextCount = Math.min(maxSlots, fitCount);
      setAdSlotCount((prev) => (prev === nextCount ? prev : nextCount));
    };

    updateSlots();
    const observer = new ResizeObserver(updateSlots);
    observer.observe(row);

    return () => observer.disconnect();
  }, [enabled, maxSlots]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    slotRefs.current = slotRefs.current.slice(0, adSlotCount);
    slotRefs.current.forEach((slot) => {
      if (slot) slot.innerHTML = "";
    });

    async function renderSlots() {
      for (let index = 0; index < slotRefs.current.length; index += 1) {
        if (cancelled) return;
        const slot = slotRefs.current[index];
        if (!slot || !slot.isConnected) continue;

        const slotKey = adKeys[index] || adKeys[0];
        if (!slotKey) continue;

        await runInAdQueue(async () => {
          if (cancelled || !slot.isConnected) return;

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
            invokeScript.async = false;
            invokeScript.src = `https://www.highperformanceformat.com/${slotKey}/invoke.js?slot=${index}&cb=${Date.now()}`;
            invokeScript.onload = () => window.setTimeout(() => resolve(), 60);
            invokeScript.onerror = () => resolve();

            slot.appendChild(configScript);
            slot.appendChild(invokeScript);
          });
        });
      }
    }

    void renderSlots();

    return () => {
      cancelled = true;
    };
  }, [adSlotCount, adKeys, enabled]);

  if (!enabled) return null;

  return (
    <section ref={rowRef} className={`responsive-ads-bar${className ? ` ${className}` : ""}`}>
      <div className="responsive-ads-bar-row">
        {Array.from({ length: adSlotCount }).map((_, index) => (
          <div
            key={`responsive-ad-slot-${index}`}
            ref={(element) => {
              slotRefs.current[index] = element;
            }}
            className="responsive-ads-slot"
            style={{ width: AD_WIDTH, height: AD_HEIGHT }}
          />
        ))}
      </div>
    </section>
  );
}
