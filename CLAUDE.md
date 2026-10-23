# Jetpack Comedy — Website (`web/`)

The live marketing site at jetpackcomedy.com. Static HTML/CSS/JS deployed to GitHub Pages from this repo (`punkhop/punkhop.github.io`).

**Read `../CLAUDE.md` first** for the full project context — strategy, mission, ad plans, analytics, archived experiments. This file only covers the website layer.

## Files in this folder (production)

| File | Purpose |
|------|---------|
| `index.html` | The landing page (2026-10 redesign): lights-first hero intro, next-show ticket card, upcoming shows, About photos fading through, reviews, FAQ, find us, sticky phone buy bar, Schema.org rich snippets. Ships Meta Pixel + GA4. |
| `site.css` / `site.js` | The one stylesheet and the one script (intro, gliding scroll, Micdrop slots, buy bar, menu, FAQ, GA4 ticket event). |
| `images/intro/` | The sign masks the intro lights the LED sign with. |
| `vendor/` | Self-hosted third-party scripts (Lenis). |
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

- **Plays** once per tab, on a fresh arrival at the top. Scrolling is held only while it plays (3.3s).
- **Skips** on a reload, Back/Forward, a second visit in the same tab, a link to a section or a show (`#…`, `?m=`), a background tab, reduced motion, or a hero photo not in by 1.5s. The page is simply there, where the browser left it, lamps lit.
- **Ends at once** if the visitor leaves mid-intro or the page moves off the top; 6s is the hard stop. `end()` is safe to call more than once.
- **Lit after:** the lamps and the LED sign stay lit over the photo for good, re-fitted whenever the photo's box changes size (a ResizeObserver, not only window resize).
- **No shift when scrolling returns:** `html { scrollbar-gutter: stable }` keeps the scrollbar's room while the hold hides it, so the photo never re-crops.
- **Show widgets** load on their own clock and never hold the page: the hand-made cards stay until a Micdrop widget has drawn.

**The look (Peet's pick from the intro playground, 2026-10-22, at `len=3.3&flick=60&order=edges&sign=last&look=led&dark=0&pools=0`).** 3.3s in all. Every one of the 18 lights in the photo (mirror shades, wall sconces, chandeliers, lanterns, the bare bulb) comes on one by one from the outer walls in, each with one flicker, spread over the lights actually on screen (a phone starts on its outermost visible light; a short desktop window that crops the bulb ends on the lanterns). The room comes up around a dark sign: only the letters stay dark (the `sign-unlit` mask), no dark patch. Then the sign switches on last as white LED neon on a clear acrylic board: crisp white tubes, a near and a far white bloom, the board's cut edge catching a little. Curtain pools off. The header drops and the page rises in after, its rise-in scaled with the new length.

- The timeline lives in `site.js` (`LEN`, `K`, `PK`, `LIGHTS`, `BLINK`, `sign()`) and the matching times in `site.css` (`.j-lights` vars `--room-t`, `--room-d`, `--hdr-t`, `--page-t`, `--pk`). Change the length in both.
- The sign masks are `images/intro/sign-tubes.png`, `sign-board.png`, `sign-unlit.png`: alpha cut-outs of the sign's box in hero-mid (930–1530 × 370–570 of 2400 × 1600). A new hero photo needs new masks and new light positions.
- The playground that drew it: `~/sync/memory/sessions/2026-10-22-jetpack-intro-timings/lab/` (`index.html`).

Check every path with `/tmp/jpwork/proof/intro-rules.cjs` (or rewrite it: first visit, reload mid-page, away and Back, leave mid-intro, home again, `#shows`, slow hero photo).

## Scrolling

- **Slim scrollbar:** a dark track and a cream handle (`html::-webkit-scrollbar…` in `site.css`; Firefox gets `scrollbar-width: thin`).
- **Menu jumps** glide to their section and stop under the header: the browser's own `scroll-behavior: smooth` plus `scroll-padding-top`. Reduced motion jumps.
- **Gliding wheel scroll** (Lenis 1.3.11, Peet's pick): self-hosted at `vendor/lenis-1.3.11.min.js`, never a CDN; its stylesheet is copied at the end of `site.css`. `site.js` `glide()` loads it from `end()`, so it never runs while the intro holds scrolling. It is skipped for reduced motion and for touch-only devices (it needs `(hover: hover) and (pointer: fine)`). It leaves the wheel to the browser over anything that scrolls by itself (`allowNestedScroll`), over any `<dialog>`, and whenever a dialog is open: the Micdrop widget's full-window show page and checkout are modal dialogs, and the page behind must not move. A new upgrade means a new file name in `vendor/`.

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
