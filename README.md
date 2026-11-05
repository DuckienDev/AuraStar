# Aura Star — Coming Soon

Landing page for **Aura Star**, a mobile app that turns the whole planet into your
feed: explore a glowing 3D globe, share your moments pinned to the exact places
they happened, and connect with friends worldwide.

> **Every moment is a star.** — *Mỗi khoảnh khắc là một vì sao.*

## What's inside

A static, no-build site (plain HTML/CSS/JS) that runs anywhere, including GitHub Pages.

- **Interactive 3D hero globe** built with [three.js](https://threejs.org/) (loaded
  from a CDN): a dotted point-cloud Earth, a glowing atmosphere, a drifting
  starfield, pulsing "post" dots, and gold connection arcs that mirror the app's
  friend-connection lines. Drag to spin; it auto-rotates on its own.
- Hero with logo, wordmark, tagline, a *Coming soon* badge and a (non-functional)
  email signup.
- Feature cards drawn from the store copy, a phone-screenshot strip, and a footer.
- Fully responsive, no horizontal scroll on mobile, and respects
  `prefers-reduced-motion` (the globe renders a calm static frame).

## Structure

```
index.html          # markup + meta
css/styles.css      # all styling
js/globe.js         # three.js hero globe
assets/
  star.png          # gold 4-point star logo
  icon.png          # app icon / favicon
  screens/*.png     # app screenshots
.nojekyll           # serve files as-is on GitHub Pages
```

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy (GitHub Pages)

Push to `main` and enable Pages from **Settings → Pages → Branch: `main` / root**.
The included `.nojekyll` file ensures assets are served unprocessed.

## Dependencies

Only one external library, loaded from a CDN: **three.js r128**. Everything else is
local.

---

© Aura Star. Screenshots and branding are property of the Aura Star project.
