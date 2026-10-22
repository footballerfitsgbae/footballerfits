/**
 * Server-side meta for crawlers & social scrapers.
 *
 * Every page route is rewritten (see vercel.json) to this function. It fetches the
 * relevant published document from Sanity, takes the built index.html, and replaces
 * the <head> SEO tags with per-page values — so WhatsApp, Facebook, X, LinkedIn and
 * Google (which run no JavaScript) see correct title/description/image per URL.
 *
 * Hard rule: it NEVER returns an error. On any failure it serves the base index.html
 * with its default tags, so the site always loads.
 */

const PROJECT = 'b5jktpaj'
const DATASET = 'production'
const SANITY = `https://${PROJECT}.apicdn.sanity.io/v2024-01-01/data/query/${DATASET}`
const SITE = 'https://www.footballerfits.co.uk'
const BRAND = 'Footballer Fits'

const DEFAULTS = {
  title: `${BRAND} | Where Football Meets Fashion and Culture`,
  description:
    'Culture-first editorial platform documenting the style, swagger, and untold stories behind the most beautiful game.',
  image: `${SITE}/logo.png`,
  type: 'website',
  url: SITE,
}

// Published content only (apicdn + no token). Params are passed as $name=JSON.
async function sanityFetch(query, params = {}) {
  const url = new URL(SANITY)
  url.searchParams.set('query', query)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v))
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`sanity ${r.status}`)
  return (await r.json()).result
}

// Build a share image EVERY platform renders: 1200x630, cropped, JPG. Never AVIF.
const shareImg = (assetUrl) => (assetUrl ? `${assetUrl}?w=1200&h=630&fit=crop&fm=jpg` : null)

function parseRoute(pathname) {
  const segs = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (segs.length === 0) return { type: 'home' }
  if (segs[0] === 'article') return { type: 'article', slug: segs.slice(1).join('/') }
  if (segs.length === 2 && segs[1] === 'all') return { type: 'section', slug: segs[0], all: true }
  if (segs.length === 1 && ['about', 'contact', 'privacy', 'terms'].includes(segs[0]))
    return { type: 'page', slug: segs[0] }
  if (segs.length === 1) return { type: 'section', slug: segs[0] }
  return { type: 'home' }
}

async function metaFor(route) {
  if (route.type === 'article') {
    const doc = await sanityFetch(
      `*[_type=="post" && slug.current==$slug][0]{
        title, excerpt, standfirst, publishedAt,
        "seoTitle": seo.metaTitle, "seoDesc": seo.metaDescription,
        "seoImg": seo.shareImage.asset->url, "heroImg": heroImage.image.asset->url
      }`,
      { slug: route.slug },
    )
    if (!doc) return null
    return {
      title: doc.seoTitle || `${doc.title} | ${BRAND}`,
      description: doc.seoDesc || doc.excerpt || doc.standfirst || DEFAULTS.description,
      image: shareImg(doc.seoImg || doc.heroImg) || DEFAULTS.image,
      url: `${SITE}/article/${route.slug}`,
      type: 'article',
      publishedTime: doc.publishedAt || null,
    }
  }

  if (route.type === 'section') {
    const doc = await sanityFetch(
      `*[_type=="section" && slug.current==$slug][0]{
        title, introCopy,
        "seoTitle": seo.metaTitle, "seoDesc": seo.metaDescription,
        "seoImg": seo.shareImage.asset->url,
        "heroImg": heroCover.images[0].asset->url,
        "latestImg": *[_type=="post" && !featured && section._ref==^._id] | order(publishedAt desc)[0].heroImage.image.asset->url
      }`,
      { slug: route.slug },
    )
    if (!doc) return null
    const path = route.all ? `/${route.slug}/all` : `/${route.slug}`
    return {
      title: doc.seoTitle || `${doc.title} | ${BRAND}`,
      description: doc.seoDesc || doc.introCopy || DEFAULTS.description,
      image: shareImg(doc.seoImg || doc.heroImg || doc.latestImg) || DEFAULTS.image,
      url: `${SITE}${path}`,
      type: 'website',
    }
  }

  if (route.type === 'page') {
    const names = { about: 'About', contact: 'Contact', privacy: 'Privacy Policy', terms: 'Terms & Conditions' }
    return { ...DEFAULTS, title: `${names[route.slug]} | ${BRAND}`, url: `${SITE}/${route.slug}` }
  }

  // Home: homePage.seo → siteSettings.defaultSeo → the static defaults.
  const r = await sanityFetch(`{
    "home": *[_type=="homePage"][0]{ "t": seo.metaTitle, "d": seo.metaDescription, "img": seo.shareImage.asset->url },
    "site": *[_type=="siteSettings"][0]{ "t": defaultSeo.metaTitle, "d": defaultSeo.metaDescription, "img": defaultSeo.shareImage.asset->url }
  }`)
  const h = r?.home || {}
  const s = r?.site || {}
  return {
    title: h.t || s.t || DEFAULTS.title,
    description: h.d || s.d || DEFAULTS.description,
    image: shareImg(h.img || s.img) || DEFAULTS.image,
    url: SITE,
    type: 'website',
  }
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Strip the default SEO tags from the built HTML and inject per-page ones, so there
// are never duplicate og:/twitter:/title tags for a crawler to trip over.
function injectMeta(html, m) {
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+name=["']description["'][^>]*>/i, '')
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/i, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')

  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${esc(m.url)}" />`,
    `<meta property="og:type" content="${esc(m.type)}" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(m.url)}" />`,
    `<meta property="og:image" content="${esc(m.image)}" />`,
    m.publishedTime ? `<meta property="article:published_time" content="${esc(m.publishedTime)}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${esc(m.image)}" />`,
  ]
    .filter(Boolean)
    .join('\n    ')

  return stripped.replace('</head>', `    ${tags}\n  </head>`)
}

// Last-resort page if even the base HTML can't be fetched — still 200, still has meta.
const minimalHtml = (m) =>
  `<!doctype html><html lang="en"><head><meta charset="UTF-8" />
  <title>${esc(m.title)}</title>
  <meta name="description" content="${esc(m.description)}" />
  <link rel="canonical" href="${esc(m.url)}" />
  <meta property="og:title" content="${esc(m.title)}" />
  <meta property="og:description" content="${esc(m.description)}" />
  <meta property="og:url" content="${esc(m.url)}" />
  <meta property="og:image" content="${esc(m.image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  </head><body></body></html>`

export default async function handler(req, res) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString()
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString().split(',')[0]

  // Grab the built shell once; it carries the app's JS, preconnects and hero preload.
  let baseHtml = ''
  try {
    const r = await fetch(`${proto}://${host}/index.html`)
    if (r.ok) baseHtml = await r.text()
  } catch {
    baseHtml = ''
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Let Vercel's edge cache the rendered HTML per-URL so this stays fast.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')

  try {
    const pathname = decodeURIComponent((req.url || '/').split('?')[0])
    const meta = (await metaFor(parseRoute(pathname))) || DEFAULTS
    res.statusCode = 200
    res.end(baseHtml ? injectMeta(baseHtml, meta) : minimalHtml(meta))
  } catch {
    // Never error: serve the shell with its default tags.
    res.statusCode = 200
    res.end(baseHtml || minimalHtml(DEFAULTS))
  }
}
