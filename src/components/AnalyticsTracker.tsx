"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";

// Counts page views and time on page for admin → SEO & Traffic, but ONLY after the visitor
// clicked "Accept" in the cookie banner. It uses a random visitor id in the browser's own
// storage (no IP address, name or e-mail is ever stored).

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

function ids() {
  let vid = localStorage.getItem("tp_vid");
  if (!vid) {
    vid = randomId();
    localStorage.setItem("tp_vid", vid);
  }
  // A visit ends after 30 minutes without activity.
  const now = Date.now();
  let sid = sessionStorage.getItem("tp_sid");
  const last = Number(sessionStorage.getItem("tp_sid_at") || 0);
  let isNew = false;
  if (!sid || now - last > 30 * 60 * 1000) {
    sid = randomId();
    sessionStorage.setItem("tp_sid", sid);
    isNew = true;
  }
  sessionStorage.setItem("tp_sid_at", String(now));
  return { vid, sid, isNew };
}

function send(body: object, beacon = false) {
  const data = JSON.stringify(body);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([data], { type: "application/json" }));
    return Promise.resolve(null);
  }
  return fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: data, keepalive: true })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [allowed, setAllowed] = useState(false);
  const page = useRef<{ pv: number | null; sid: string; activeMs: number; since: number | null }>({ pv: null, sid: "", activeMs: 0, since: null });

  // Follow the visitor's cookie choice (also when it changes).
  useEffect(() => {
    setAllowed(readConsent(document.cookie) === "accepted");
    const onChange = (e: Event) => setAllowed((e as CustomEvent).detail === "accepted");
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  // Time on page: only while the tab is visible. Sent when the page is left or hidden.
  useEffect(() => {
    if (!allowed) return;
    const flush = () => {
      const p = page.current;
      if (!p.pv) return;
      if (p.since) p.activeMs += Date.now() - p.since;
      p.since = null;
      send({ t: "leave", sid: p.sid, pv: p.pv, ms: Math.round(p.activeMs) }, true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else if (page.current.pv) page.current.since = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [allowed]);

  // A page view for every page the visitor opens.
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    // Close the previous page first.
    const prev = page.current;
    if (prev.pv) {
      if (prev.since) prev.activeMs += Date.now() - prev.since;
      send({ t: "leave", sid: prev.sid, pv: prev.pv, ms: Math.round(prev.activeMs) }, true);
    }
    let v: ReturnType<typeof ids>;
    try {
      v = ids();
    } catch {
      return; // storage blocked: don't track
    }
    page.current = { pv: null, sid: v.sid, activeMs: 0, since: Date.now() };
    // Wait a moment so the page title is set.
    const timer = setTimeout(async () => {
      const utm = (k: string) => search.get(k) ?? "";
      const res = (await send({
        t: "view",
        vid: v.vid,
        sid: v.sid,
        path: pathname,
        title: document.title,
        ref: v.isNew ? document.referrer : "",
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lang: navigator.language,
        w: window.innerWidth,
        utm_source: utm("utm_source"),
        utm_medium: utm("utm_medium"),
        utm_campaign: utm("utm_campaign"),
      })) as { pv?: number } | null;
      if (!cancelled && res?.pv) page.current.pv = res.pv;
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Only when the page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, pathname]);

  return null;
}
