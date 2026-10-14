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
 * Quality: q=82 with auto=format (AVIF first, then WebP). AVIF at 82 is visually
 * indistinguishable from the original to the eye, yet still far smaller than the
 * source PNG/JPEG — so we lift quality AND keep the hero fast.
 */
export const HERO_WIDTHS = [640, 828, 1080, 1440, 1920, 2560, 3200]
export const HERO_Q = 82

export const heroVariant = (base, w) => `${base}?auto=format&fit=max&q=${HERO_Q}&w=${w}`
export const heroSrcSet = (base) =>
  base ? HERO_WIDTHS.map((w) => `${heroVariant(base, w)} ${w}w`).join(', ') : undefined
