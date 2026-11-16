# Restore Reddit subscriber count

Userscript for **old Reddit** (`old.reddit.com`). Reddit removed the subscriber count from the subreddit sidebar; this script shows it again, in bold, under the subreddit title.

- One request to `/r/<sub>/about.json` per page view, only on a cache miss
- Cache in `localStorage`: 6 h for counts, 1 h for failures, 10 min pause after HTTP 429
- Skips `/r/all`, `/r/popular`, multireddits and similar pages
- No external hosts, no `GM_*` permissions

## Install

1. Install a userscript manager (Tampermonkey, Violentmonkey).
   Chromium-based browsers since v138 also need "Allow user scripts" enabled for the extension (and possibly a browser restart).
2. Open [restore-reddit-subscriber-count.user.js](https://github.com/ai-ag2026/restore-reddit-subscriber-count/raw/main/restore-reddit-subscriber-count.user.js) and confirm the installation.

Updates come automatically from this repository.

## Test

```
node check.mjs
```

Runs the script against stubbed `document`, `localStorage` and `fetch`.

Inspired by wlonkly's original "Restore Reddit subscriber count" script.

## License

MIT
