/**
 * Shared full-bleed hero image sizing — used by BOTH the React app (to render the
 * hero <img srcset>) AND the Vite build plugin (to inject a matching <link rel=preload>).
 * They MUST stay identical: the preload URL has to be byte-for-byte the same as the
 * URL the <img> ends up requesting, or the browser downloads the hero twice.
 *
 * Sizing: the hero fills the whole viewport, so it needs a far larger image than a
 * card. We build a srcset straight off the raw Sanity asset URL so each screen (and
 * DPR) downloads a right-sized, crisp image — a small phone grabs ~640px, a retina
 * desktop up to 3200px — never upscaled (fit=max) and never over-fetched.
 *
 * Quality: q=95 with auto=format (AVIF first, then WebP). q95 is at the ceiling of
 * human perception — visibly identical to the uploaded original, with headroom above
 * the "visually lossless" q90 for the fussiest eye. Going to q100/original roughly
 * doubles the bytes for ZERO visible gain, so q95 is the sensible maximum.
 */
export const HERO_WIDTHS = [640, 828, 1080, 1440, 1920, 2560, 3200]
export const HERO_Q = 95

export const heroVariant = (base, w) => `${base}?auto=format&fit=max&q=${HERO_Q}&w=${w}`
export const heroSrcSet = (base) =>
  base ? HERO_WIDTHS.map((w) => `${heroVariant(base, w)} ${w}w`).join(', ') : undefined
