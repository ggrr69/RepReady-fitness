# RepReady — first working prototype

RepReady is a mobile-first installable web-app starter. It includes a browsable program library, full program previews, workout-day selection, exercise add/edit/swap/remove, completion checkboxes, restore-original, and local browser storage.

## What's included
- `index.html` — app structure
- `styles.css` — responsive dark UI
- `app.js` — program data and app behavior
- `manifest.webmanifest` and `sw.js` — PWA install/offline basics

## Test it on a computer
You need a local web server for service-worker behavior. With Python 3 installed, open a terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Put it on your iPhone
To install it from Safari, the site must be deployed to an HTTPS web host. One straightforward route is to upload these files to a GitHub repository and deploy the repository with a static host such as Netlify or Cloudflare Pages. Once you have the HTTPS URL, open it in Safari on your iPhone, tap Share, then **Add to Home Screen**.

## Important prototype notes
- Customizations are stored in the current browser's `localStorage`; they are not synced across devices and may be erased if browser data is cleared.
- This is a starter build, not yet an App Store app.
- Exercise selection is editable, but exercise substitutions are manual: use **Swap** and type the replacement movement.
- Nutrition logging, macro targets, guided mobility sessions, workout history, account sync, and equipment editing are not implemented yet.
- Exercise suggestions are general examples, not medical advice. Adjust movements to your ability and seek professional advice for persistent pain or injury.
