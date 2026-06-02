# Credent — download website

A multi-page static site for the Credent desktop app (Emrys AI), styled with the
brand glow theme (cyan · blue · indigo · magenta).

## Pages
- `index.html` — home (hero, feature highlights, thesis, CTA)
- `features.html` — full feature list
- `download.html` — Windows download (live) + macOS (coming soon)
- `support.html` — contact, company, FAQ

## Folder layout
```
site/
├─ index.html  features.html  download.html  support.html
├─ css/style.css
├─ js/main.js          ← nav, OS detection, glow canvas, scroll reveal, FAQ
├─ assets/             ← logos used by the site
└─ downloads/
   └─ Credent-1.0.0-Setup.exe   ← the Windows build (already here)
```

## Run it locally
It's plain static HTML — just open `index.html` in a browser. Or serve it:

```powershell
# from the site/ folder
python -m http.server 8080
# then open http://localhost:8080
```

## When the Mac build is ready
1. Build it from the project root: `npm run build:mac`
2. Copy the artifact into `downloads/`, e.g.:
   ```powershell
   Copy-Item "..\dist\Credent-1.0.0.dmg" ".\downloads\Credent-1.0.0.dmg"
   ```
3. In `download.html`, find the macOS `<a class="btn btn-disabled" ...>` and replace it with:
   ```html
   <a class="btn btn-primary" href="downloads/Credent-1.0.0.dmg" download>
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
     Download for macOS
   </a>
   ```
   …and delete the `<span class="badge-soon">Coming soon</span>` line in that card.
4. In `js/main.js`, the `os === "mac"` branch can be pointed straight at the `.dmg`
   instead of `download.html`.

## Hosting (free options)
- **Netlify / Vercel / Cloudflare Pages** — drag the `site/` folder in, done.
- **GitHub Pages** — push `site/` to a repo, enable Pages.
- **Any static host / your own server** — upload the `site/` folder.

> Note: large binaries (the ~72 MB `.exe`) exceed some free tiers' file limits.
> If a host rejects it, put the installer on a release host (GitHub Releases, S3,
> Cloudflare R2) and point the download button's `href` at that URL instead.
