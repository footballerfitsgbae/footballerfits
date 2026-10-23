/**
 * Dynamic sitemap.xml, generated live from Sanity: the home page, every section,
 * each section's /all page, and every article (lastmod from _updatedAt).
 * Served at /sitemap.xml via a rewrite in vercel.json. Never errors.
 */
const PROJECT = 'b5jktpaj'
const DATASET = 'production'
const SANITY = `https://${PROJECT}.apicdn.sanity.io/v2024-01-01/data/query/${DATASET}`
const SITE = 'https://www.footballerfits.co.uk'

async function sanityFetch(query) {
  const url = new URL(SANITY)
  url.searchParams.set('query', query)
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`sanity ${r.status}`)
  return (await r.json()).result
}

const xmlEsc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')

  try {
    const data = await sanityFetch(`{
      "sections": *[_type=="section" && defined(slug.current)]{ "slug": slug.current, "lastmod": _updatedAt },
      "articles": *[_type=="post" && defined(slug.current)]{ "slug": slug.current, "lastmod": _updatedAt }
    }`)

    const rows = []
    const add = (loc, lastmod) =>
      rows.push(`  <url><loc>${xmlEsc(SITE + loc)}</loc>${lastmod ? `<lastmod>${xmlEsc(lastmod)}</lastmod>` : ''}</url>`)

    add('/', null)

    // De-dupe sections by slug (keep the most recent lastmod), then emit page + /all.
    // Top Stories is a homepage-only block (no standalone page), so it's excluded.
    const EXCLUDE = new Set(['top-stories'])
    const bySlug = new Map()
    for (const s of data?.sections || []) {
      if (!s?.slug || EXCLUDE.has(s.slug)) continue
      const prev = bySlug.get(s.slug)
      if (!prev || (s.lastmod && s.lastmod > prev)) bySlug.set(s.slug, s.lastmod)
    }
    for (const [slug, lastmod] of bySlug) {
      add(`/${slug}`, lastmod)
      add(`/${slug}/all`, lastmod)
    }

    for (const a of data?.articles || []) {
      if (a?.slug) add(`/article/${a.slug}`, a.lastmod)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>`
    res.statusCode = 200
    res.end(xml)
  } catch {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}/</loc></url>\n</urlset>`
    res.statusCode = 200
    res.end(xml)
  }
}
