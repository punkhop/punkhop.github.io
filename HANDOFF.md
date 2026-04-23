# Jetpack Comedy — Handoff (2026-04-22)

## What's Live (jetpackcomedy.com)

### `index-new.html` — Event Listing
- **Native HTML/JS** pulling events from Bubble Data API
- Dark theme, hero card for next show, compact cards for upcoming
- Mobile-responsive
- Links to `event.html?slug=xxx` for each event
- **BLOCKED**: Shows "No upcoming shows" because V2_Event not deployed to Live API

### `event.html` — Event Detail + Ticket Selection
- Full event page with hero image, title, date, venue, description
- **Inline ticket selection** with +/- buttons (Micdrop AirbnbSplitMain inspired)
- Running order summary, mobile fixed CTA bar
- 2-column desktop (content left, sticky ticket sidebar right)
- "Checkout" links to `jetbook.co/o_iframe/{slug}` (existing checkout)
- **BLOCKED**: Same API issue — needs Deploy

## What Peet Needs To Do

### 1. Deploy Bubble (critical — 1 click)
In Bubble editor → top-right → click **Deploy**
This exposes V2_Event to the live API so real Jetpack events show up.

### 2. Switch event.html API from test to live
After Deploy, edit `event.html` line ~26:
Change `var API = API_TEST;` to `var API = API_LIVE;`
Then commit + push.

### 3. Switch index-new.html to live API (already set)
It's already pointing to `API_LIVE`. After Deploy, it'll just work.

## Architecture

```
jetpackcomedy.com/index-new.html
  ↓ fetch events from jetbook.co/api/1.1/obj/V2_Event
  ↓ render dark-themed event cards
  ↓ click event card
  
jetpackcomedy.com/event.html?slug=xxx
  ↓ fetch event details from Bubble API
  ↓ show hero image, title, date, tickets with +/-
  ↓ click "Checkout"
  
jetbook.co/o_iframe/{slug}?event=xxx  (existing Bubble checkout)
  ↓ ticket selection → personal details → Stripe → success
```

## Files

| File | Purpose |
|------|---------|
| `index-new.html` | Event listing (HTML/JS, Bubble API) |
| `event.html` | Event detail + ticket selection |
| `/jetpack/bubble-fix-embed-dark.js` | Bubble editor automation (fix steps A-D) |
| `/jetpack/bubble-clone-embed-dark.sh` | Full delete+clone pipeline |
| `/jetpack/EMBED-EVENT-SPEC.md` | Event page design spec |
| `/jetpack/JETBOOK-NEW-CHECKOUT-FLOW.md` | Overall checkout flow design |
| `/jetpack/JETBOOK-EMBED-ANALYSIS.md` | Original o_iframe analysis |

## Key Learnings (for next session)

### Bubble Automation
- **Solid.js `$$click`** on `._10fw3og6` items for dropdown selection
- **Dual approach**: compositor click + $$click for Clone from dropdown
- **Page delete**: right-click → Delete → CONFIRM via `div.btn` JS click
- **Undo doesn't work** for automated type changes — use delete+re-clone
- **HTML Header** is in Interaction tab → SEO section (new editor)
- **Text composer** can't be cleared with Cmd+A — must append

### Why Bubble listing approach failed
- Changing RG type cascades 5-10 issues
- CalendarMonth A is deeply referenced (38+ issues if deleted)
- calendar_view state hides items via inline JS display:none
- CSS !important can't override Bubble's JS-set styles

### Correct approach: HTML/JS listing + Bubble checkout
- Event listing rendered natively — no Bubble, no iframe
- Bubble Data API with CORS: `Access-Control-Allow-Origin: *`
- Test API: `jetbook.co/version-test/api/1.1/obj/V2_Event`
- Live API: `jetbook.co/api/1.1/obj/V2_Event` (needs Deploy)

## Next Steps

1. **Deploy Bubble** to enable live API
2. **Test with real Jetpack events** — posters, dates, names
3. **Add User_Owner constraint** to API call to filter to Jetpack's events only
4. **Connect checkout** — wire "Checkout" button to pass ticket selections to o_iframe
5. **Build embed_checkout** — standalone payment page (Phase 3)
6. **Polish** — loading skeletons, error states, SEO meta tags, share buttons
7. **Replace index.html with index-new.html** when ready to go live
