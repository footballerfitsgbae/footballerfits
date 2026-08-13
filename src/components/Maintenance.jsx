/**
 * Maintenance — a standalone holding page shown when VITE_MAINTENANCE_MODE=true.
 *
 * Fully self-contained: it renders INSTEAD of <App/> (gated in main.jsx), imports
 * nothing from the app, and touches no existing component, route, style or Sanity
 * code. Styling is inline and leans on the site's own design tokens (defined in
 * App.css, already loaded globally in main.jsx) so it matches the brand exactly,
 * with hard fallbacks in case those tokens ever change.
 *
 * Full-bleed banner photo (public/Homepage_banner.webp) sits behind a ~66% black
 * overlay for readability; both are layered in one `background` so no extra DOM is
 * needed. The FF logo art is white-on-black, so `mixBlendMode: 'screen'` drops its
 * black backdrop and lets the darkened photo show through seamlessly behind it.
 */
export default function Maintenance() {
  return (
    <main style={styles.page}>
      <img src="/logo.png" alt="Footballer Fits" style={styles.logo} />
      <span style={styles.divider} aria-hidden="true" />
      <h1 style={styles.headline}>
        <span style={styles.line1}>The fits. The culture. The stories.</span>
        <span style={styles.line2}>Coming soon.</span>
      </h1>
      <p style={styles.subline}>
        We&rsquo;re putting the finishing touches on something built for the culture. Stay close.
      </p>
      <a href="mailto:contact@footballerfits.co.uk" style={styles.email}>
        contact@footballerfits.co.uk
      </a>
      <span style={styles.footer}>footballerfits.com</span>
    </main>
  )
}

const DISPLAY = "var(--font-display, 'Helvetica Neue', Arial, sans-serif)"
const BODY = "var(--font-body, 'Helvetica Neue', Arial, sans-serif)"
const DIM = 'var(--chalk-dim, rgba(232,228,220,0.55))'

const styles = {
  page: {
    minHeight: '100dvh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '56px 24px',
    boxSizing: 'border-box',
    color: 'var(--chalk, #e8e4dc)',
    fontFamily: BODY,
    position: 'relative',
    overflow: 'hidden',
    // Dark overlay (~66%) over the full-bleed banner, with a solid dark fallback.
    background:
      'linear-gradient(rgba(8,8,8,0.66), rgba(8,8,8,0.66)), url("/Homepage_banner.webp") center / cover no-repeat, var(--black, #0a0a0a)',
  },
  logo: {
    width: 'clamp(64px, 12vw, 96px)',
    height: 'auto',
    mixBlendMode: 'screen', // hides the logo's black backdrop over the photo
  },
  divider: {
    display: 'block',
    width: 'clamp(40px, 8vw, 56px)',
    height: '1px',
    margin: 'clamp(22px, 4vw, 32px) 0',
    background: 'rgba(232,228,220,0.28)',
  },
  headline: {
    margin: 0,
    maxWidth: 'min(92vw, 900px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(6px, 1.4vw, 14px)',
    textShadow: '0 2px 34px rgba(0,0,0,0.45)',
  },
  line1: {
    fontFamily: DISPLAY,
    fontWeight: 400, // lighter weight
    fontSize: 'clamp(20px, 4.2vw, 44px)',
    lineHeight: 1.12,
    letterSpacing: '-0.02em',
    color: 'var(--chalk, #e8e4dc)',
  },
  line2: {
    fontFamily: DISPLAY,
    fontWeight: 900, // larger + bolder
    fontSize: 'clamp(46px, 10vw, 108px)',
    lineHeight: 1.0,
    letterSpacing: '-0.04em',
    color: 'var(--chalk, #e8e4dc)',
  },
  subline: {
    margin: 'clamp(20px, 3.4vw, 30px) 0 0',
    maxWidth: '46ch',
    fontFamily: BODY,
    fontWeight: 400,
    fontSize: 'clamp(15px, 2.4vw, 19px)',
    lineHeight: 1.55,
    color: DIM,
    textShadow: '0 1px 20px rgba(0,0,0,0.4)',
  },
  email: {
    marginTop: 'clamp(20px, 3vw, 28px)',
    fontFamily: BODY,
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.14em',
    color: DIM,
    textDecoration: 'none',
    borderBottom: '1px solid rgba(232,228,220,0.22)',
    paddingBottom: '3px',
  },
  footer: {
    position: 'absolute',
    bottom: 'clamp(24px, 5vh, 40px)',
    fontFamily: BODY,
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: DIM,
  },
}
