# Projects

My artistic presentation of my personal portfolio.

Implemented as a dependency-free standalone static page.

## Tech stack

- **Vanilla JavaScript (ES5-compatible)** — no framework, no build step, no
  bundler. A single IIFE in `app.js` drives everything.
- **Inline SVG**, generated and animated in JS — every logo, the blob cursor,
  and the corner signature are SVG paths whose `d`/`transform` attributes are
  mutated each frame via refs (React is never used).
- **`requestAnimationFrame`** — each animated mark and the morphs run their own
  rAF loop; organic shapes come from Catmull-Rom blob geometry + sine/cosine
  wobble, with smoothstep easing.
- **CSS3** — 3D coverflow via `perspective` / `transform` / `transition`,
  `@keyframes` (float, squish, glow pulse), SVG goo via `feGaussianBlur` +
  `feColorMatrix`, custom `cursor: none` + blob cursor.
- **Web fonts** — five local `@font-face` brand fonts (`fonts/`) plus Fredoka
  from Google Fonts. Glyph positions for the signature are measured at runtime
  with the SVG text API (`getStartPositionOfChar`).
- **Input** — wheel/trackpad, keyboard (arrows), and touch-swipe navigation.
- **Tooling** — served statically with `npx serve` (see Run); works equally by
  opening `index.html` directly.

## Projects

| Logo | Brand | Wordmark font | Link |
| --- | --- | --- | --- |
| Black + red orbiting dots | Playback | Clash Display | tryplayback.xyz |
| Orange asterisk / sunburst | create report engine | Vantely | createwellness.github.io |
| Spinning blue vinyl + tonearm | Needl | Resolide Serif | useneedl.netlify.app |
| Navy blob + gold "VP" | Vantage Prep | EB Garamond SemiBold | vantageprep.netlify.app |
| Black map pin + yellow glow | Pitstop | Hobsky | usepitstop.netlify.app |

## Interactions

- **Scroll / trackpad / arrow keys / swipe** — advance one project at a time
  (deliberate, slide-locked).
- **Hover a logo** — its brand wordmark oozes in letter-by-letter below it, in
  the correct brand font, color and capitalization.
- **Click a logo** — organic squash-and-stretch + glow pulse, opens the site in
  a new tab.
- **Corner signature** — `projects` rests spelled out at the top-left; hovering
  the `by arjun kalbag` goo-blob (top-right) slides `projects` across to dock
  with it, so the top reads `projects by arjun kalbag`. It melts back on
  mouse-out. Clicking the blob opens arjunkalbag.xyz.
- **Cursor** — a small, living black blob-arrow replaces the pointer; it follows
  with a soft lag, wobbles, and squishes on click/scroll.

## Files

- `index.html` — markup + all styles.
- `app.js` — all behavior (vanilla JS): blob logo engines, carousel, wordmark,
  cursor, and corner signature. Each animated mark runs its own
  `requestAnimationFrame` loop and mutates SVG attributes directly.
- `fonts/` — the five brand fonts.
- Fredoka (corner signature + VP monogram) loads from Google Fonts.

## Run

It's fully static — open `index.html`, or serve the folder:

```sh
npx serve projects-page -l 5190
```
