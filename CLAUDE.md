# Jetpack Comedy — Website (`web/`)

The live marketing site at jetpackcomedy.com. Static HTML/CSS/JS deployed to GitHub Pages from this repo (`punkhop/punkhop.github.io`).

**Read `../CLAUDE.md` first** for the full project context — strategy, mission, ad plans, analytics, archived experiments. This file only covers the website layer.

## Files in this folder (production)

| File | Purpose |
|------|---------|
| `index.html` | The landing page. Cinematic hero, proof bar, pitch + press, rotating room/comic photo grid, embedded Jetbook iframe, reviews, sticky mobile CTA, Schema.org rich snippets. Ships Meta Pixel + GA4. |
| `cal.html` | Alternate calendar listing view. |
| `success.html` | Draft from abandoned custom checkout (2026-04). Not in any active funnel — keep for reference or delete. |
| `images/` | Webp + originals. `images/webp/comics/_originals/` holds pre-crop versions of comic headshots; the visible files were auto-cropped to faces via OpenCV on 2026-04-24. |
| `CNAME`, `.nojekyll` | GitHub Pages config — DO NOT delete. |
| `Jetpack Logo Solo Straight.png`, press logos, `test*.png`, comic `.jpg`s at root | Legacy assets. Some still referenced. Run `grep` before deleting any. |

## Architecture

Single static HTML page. No build step. No framework. Inline `<style>` and `<script>` blocks per section. The hero rotation, room grid crossfade, and Schema.org JSON-LD are all in `index.html`.

The "Upcoming shows" section embeds Jetbook's iframe (`https://jetbook.co/o_iframe/jetpack-comedy-9yo7g`) — that handles ticket selection and checkout.

## Deploy

```bash
cd /Users/peet/dev/personal/jetpack/web
git add -A && git commit -m "..." && git push
```

GitHub Pages picks it up in ~30 seconds. CNAME points jetpackcomedy.com → punkhop.github.io.

## When editing the site

1. Use the existing visual language: red velvet / cinematic / `#0e0a0b` background, `#e4002b` accent (Jetpack red), Inter font.
2. The mission is conversion: every change should support funneling visitors toward the iframe ticket purchase.
3. Test changes via `browser-harness` (NOT `dev-browser` without `--connect`).
4. Image alt text should be descriptive — Google reads it for SEO.
5. Maintain the Schema.org `ComedyClub` JSON-LD; it powers Google rich snippets.

## Tracking

- **Meta Pixel** ID `4310041135918044` — fires PageView. `_fbp`/`_fbc` cookies set correctly.
- **GA4** `G-9MV3236KH3` — fires PageView + custom `select_content` event on event card clicks.
- **NO Google Ads tag installed** (none running yet).
- Conversion events do NOT fire here — purchase happens on jetbook.co (different domain). See `../CLAUDE.md` "Critical limitation" section.

## Recent changes worth knowing

- **2026-04-24**: Major redesign — replaced masonry hero with cinematic stage backdrop, added proof bar / pitch / room grid / reviews / sticky CTA, added Schema.org structured data, rewrote H1/meta for SEO, set up rotating room photo grid pulling from `images/webp/comics/`.
- **2026-04-24**: Auto-cropped 34 of 37 comic photos via OpenCV face detection. Originals in `images/webp/comics/_originals/`.
- **2026-04-26**: Site folder moved from `~/dev/personal/jetpackcomedy/` to `~/dev/personal/jetpack/web/`. Git remote unchanged (still `punkhop.github.io`). Deleted: `ebpix/` (moved to Dropbox/Micdrop), strategy `.md` files (moved to `../strategy/`, `../ads/`, etc.), CODEX-* docs (archived), old HANDOFF.md (archived).
