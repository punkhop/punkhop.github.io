# Jetpack Comedy — Website (`web/`)

The live marketing site at jetpackcomedy.com. Static HTML/CSS/JS deployed to GitHub Pages from this repo (`punkhop/punkhop.github.io`).

**Read `../CLAUDE.md` first** for the full project context — strategy, mission, ad plans, analytics, archived experiments. This file only covers the website layer.

## Files in this folder (production)

| File | Purpose |
|------|---------|
| `index.html` | The landing page (2026-10 redesign): lights-first hero intro, next-show ticket card, upcoming shows, About photos fading through, reviews, FAQ, find us, sticky phone buy bar, Schema.org rich snippets. Ships Meta Pixel + GA4. |
| `site.css` / `site.js` | The one stylesheet and the one script (intro, Micdrop slots, buy bar, menu, FAQ, GA4 ticket event). |
| `images/falls/` | About photos, `-s` (≤800px) and `-l` (1600px) per photo. |
| `images/` | Webp + originals. `images/webp/comics/_originals/` holds pre-crop versions of comic headshots; the visible files were auto-cropped to faces via OpenCV on 2026-04-24. |
| `CNAME`, `.nojekyll` | GitHub Pages config — DO NOT delete. |
| `Jetpack Logo Solo Straight.png`, press logos, `test*.png`, comic `.jpg`s at root | Legacy assets. Some still referenced. Run `grep` before deleting any. |

## Architecture

Single static HTML page. No build step. No framework. Markup and Schema.org JSON-LD in `index.html`, styles in `site.css`, behaviour in `site.js`.

Tickets sell on Micdrop. Two marked slots (`<div data-micdrop-slot="featured">` in the hero, `<div data-micdrop-slot="list">` under Upcoming shows) hold server-rendered cards linking to the Jetpack page on Micdrop; `site.js` fills them from Micdrop's public events API (venue 1) and every Get tickets opens that show's Micdrop event page. Swap each slot for the Micdrop embed when it ships. The API needs a widget key for this domain (`WIDGET_KEY` in `site.js`).

## Deploy

```bash
cd /Users/peet/dev/personal/jetpack/web
git add -A && git commit -m "..." && git push
```

GitHub Pages picks it up in ~30 seconds. Cloudflare caches `site.css` and `site.js` for 4 hours, so `index.html` links them as `site.css?v=…` / `site.js?v=…`: change that value whenever either file changes, or visitors keep the old one. CNAME points jetpackcomedy.com → punkhop.github.io.

## The intro: when it plays, what loads when

One set of rules, in the head script of `index.html` (it decides) and `site.js` `intro()`/`end()` (they run it):

- **Plays** once per tab, on a fresh arrival at the top: lamps blink on over the dark room, then the header and page rise in. Scrolling is held only while it plays (about 4.3s).
- **Skips** on a reload, Back/Forward, a second visit in the same tab, a link to a section or a show (`#…`, `?m=`), a background tab, reduced motion, or a hero photo not in by 1.5s. The page is simply there, where the browser left it, lamps lit.
- **Ends at once** if the visitor leaves mid-intro or the page moves off the top; 6s is the hard stop.
- **Show widgets** load on their own clock and never hold the page: the hand-made cards stay until a Micdrop widget has drawn.

Check every path with `/tmp/jpwork/proof/intro-rules.cjs` (or rewrite it: first visit, reload mid-page, away and Back, leave mid-intro, home again, `#shows`, slow hero photo).

## When editing the site

1. Use the existing visual language: red velvet / cinematic / `#0e0a0b` background, `#e4002b` accent (Jetpack red), Inter font.
2. The mission is conversion: every change should support funneling visitors toward a Get tickets click.
3. Test changes via `browser-harness` (NOT `dev-browser` without `--connect`).
4. Image alt text should be descriptive — Google reads it for SEO.
5. Maintain the Schema.org `ComedyClub` JSON-LD; it powers Google rich snippets.

## Tracking

- **Meta Pixel** ID `4310041135918044` — fires PageView. `_fbp`/`_fbc` cookies set correctly.
- **GA4** `G-9MV3236KH3` — fires PageView + custom `select_content` event on every Get tickets click (`item_id` = Micdrop event id).
- **NO Google Ads tag installed** (none running yet).
- Conversion events do NOT fire here — purchase happens on get-micdrop.com (different domain).

## Recent changes worth knowing

- **2026-04-24**: Major redesign — replaced masonry hero with cinematic stage backdrop, added proof bar / pitch / room grid / reviews / sticky CTA, added Schema.org structured data, rewrote H1/meta for SEO, set up rotating room photo grid pulling from `images/webp/comics/`.
- **2026-04-24**: Auto-cropped 34 of 37 comic photos via OpenCV face detection. Originals in `images/webp/comics/_originals/`.
- **2026-04-26**: Site folder moved from `~/dev/personal/jetpackcomedy/` to `~/dev/personal/jetpack/web/`. Git remote unchanged (still `punkhop.github.io`). Deleted: `ebpix/` (moved to Dropbox/Micdrop), strategy `.md` files (moved to `../strategy/`, `../ads/`, etc.), CODEX-* docs (archived), old HANDOFF.md (archived).
