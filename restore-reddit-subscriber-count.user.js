// ==UserScript==
// @name        Restore Reddit subscriber count
// @namespace   https://github.com/ai-ag2026/restore-reddit-subscriber-count
// @match       *://*.reddit.com/r/*
// @version     2.0.1
// @license     MIT
// @run-at      document-idle
// @grant       none
// @description Old Reddit: show the subscriber count (bold) under the subreddit title again. One request per page view, 6 h cache, failures cached 1 h, 10 min pause after HTTP 429.
// @homepageURL https://github.com/ai-ag2026/restore-reddit-subscriber-count
// @supportURL  https://github.com/ai-ag2026/restore-reddit-subscriber-count/issues
// @downloadURL https://github.com/ai-ag2026/restore-reddit-subscriber-count/raw/main/restore-reddit-subscriber-count.user.js
// @updateURL   https://github.com/ai-ag2026/restore-reddit-subscriber-count/raw/main/restore-reddit-subscriber-count.user.js
// ==/UserScript==

(async () => {
  'use strict';
  const KEY = 'rrsc_cache_v2';                 // { subs: { [sub]: { n: number|null, ts } }, cooldown?: ts }
  const TTL = 6 * 3600e3, FAIL_TTL = 3600e3, COOLDOWN = 10 * 60e3;
  const ID = 'rrsc-count-chip';

  // Old Reddit lädt bei jedem Seitenwechsel neu: einmal laufen reicht, kein Observer.
  const header = document.querySelector('.titlebox h1.redditname');
  if (!header || document.getElementById(ID)) return;

  // Nur einzelne echte Subs: keine Multis (a+b), keine Sammelseiten.
  const sub = location.pathname.match(/^\/r\/([^/+]+)(?:\/|$)/)?.[1]?.toLowerCase();
  if (!sub || ['all', 'popular', 'friends', 'mod', 'random', 'randnsfw'].includes(sub)) return;

  let c;
  try { c = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { c = {}; }
  c.subs ??= {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };

  let e = c.subs[sub];
  if (!e || Date.now() - e.ts > (e.n == null ? FAIL_TTL : TTL)) {
    if (Date.now() < (c.cooldown || 0)) return;
    let n = null;
    try {
      const r = await fetch(`/r/${sub}/about.json?raw_json=1`);
      if (r.status === 429) { c.cooldown = Date.now() + COOLDOWN; save(); return; }
      const v = r.ok ? (await r.json())?.data?.subscribers : null;
      if (Number.isFinite(v) && v > 0) n = v;  // 0 = Reddit liefert die Zahl nicht mehr, nicht anzeigen
    } catch {}
    e = c.subs[sub] = { n, ts: Date.now() };   // Fehlschläge auch cachen: kein Abruf-Sturm bei 403/404
    save();
  }
  if (e.n == null) return;

  document.querySelector('.titlebox .subscribers')?.style.setProperty('display', 'none', 'important');
  const el = document.createElement('div');
  el.id = ID;
  el.style.cssText = 'display:block!important;margin-top:6px;font-size:12px';
  el.innerHTML = `<strong>${new Intl.NumberFormat().format(e.n)}</strong> subscribers`;
  header.after(el);
})();
