import { useEffect, useState } from 'react'
import { sanityClient } from './sanityClient'
import { ALL_CONTENT_QUERY } from './queries'

/**
 * Content layer: fetches everything from Sanity in one round trip, maps it into
 * the exact shapes the existing components already expect, and falls back to the
 * hardcoded defaults for anything Sanity has not been filled in with yet.
 *
 * Fallback-first: state is seeded with the defaults, so the very first paint is
 * complete and correct. Sanity content swaps in when it arrives. That means the
 * UI can never flash empty or break, whether Sanity is empty, slow or offline.
 */

/* ── helpers ─────────────────────────────────────────────────────────────── */

const isFilled = (v) =>
  Array.isArray(v) ? v.length > 0
  : v && typeof v === 'object' ? Object.keys(v).length > 0
  : typeof v === 'string' ? v.trim().length > 0
  : v != null

/** Use the Sanity value only when it actually has content. */
const pick = (sanityVal, fallbackVal) => (isFilled(sanityVal) ? sanityVal : fallbackVal)

const pad2 = (n) => String(n).padStart(2, '0')

/* ── mappers: Sanity document -> the shape the components already use ────── */

/** A post -> the legacy article/card shape ({ id, tag, title, excerpt, image, ratio, category }). */
export function mapPost(doc, i = 0) {
  if (!doc) return null
  return {
    id: doc._id,
    slug: doc.slug,
    tag: `${pad2(i + 1)} / ${doc.category ?? 'Editorial'}`,
    title: doc.title ?? '',
    excerpt: doc.excerpt ?? '',
    image: doc.image ?? '',
    ratio: doc.ratio ?? 'portrait',
    category: doc.categorySlug ?? 'editorial',
    // real metadata, used in preference to the pseudo values
    publishedAt: doc.publishedAt,
    readMinutes: doc.readMinutes,
    author: doc.author,
    standfirst: doc.standfirst,
    externalLink: doc.externalLink,
  }
}

const mapPosts = (docs) => (Array.isArray(docs) ? docs.map(mapPost).filter(Boolean) : [])

/** Portable Text -> the article page's composable block list. */
export function mapBody(blocks) {
  if (!Array.isArray(blocks)) return []
  return blocks
    .map((b) => {
      switch (b?._type) {
        case 'block':
          return {
            _type: 'paragraph',
            text: (b.children ?? []).map((c) => c.text ?? '').join(''),
          }
        case 'figureImage':
          return { _type: 'image', src: b.url, alt: b.alt ?? '', caption: b.caption }
        case 'imageGallery':
          return {
            _type: 'gallery',
            images: (b.images ?? []).map((im) => ({ src: im.url, alt: im.alt ?? '' })),
            caption: b.caption,
          }
        case 'socialEmbed':
          return { _type: 'embed', provider: b.provider, url: b.url, caption: b.caption }
        default:
          return null
      }
    })
    .filter((b) => b && (b._type !== 'paragraph' || b.text.trim()))
}

/** A post (with body) -> the article page shape. */
export function mapArticle(doc, fallback) {
  if (!doc) return fallback
  const body = mapBody(doc.body)
  return {
    slug: doc.slug ?? fallback.slug,
    section: doc.sectionSlug ?? fallback.section,
    category: doc.category ?? fallback.category,
    title: doc.title ?? fallback.title,
    hero: doc.image ?? fallback.hero,
    heroAlt: doc.imageAlt ?? doc.heroAlt ?? fallback.heroAlt,
    author: doc.author ?? fallback.author,
    publishedAt: doc.publishedAt,
    agoHours: fallback.agoHours,
    readMin: doc.readMinutes ?? fallback.readMin,
    standfirst: doc.standfirst ?? fallback.standfirst,
    body: body.length ? body : fallback.body,
  }
}

/** Sections -> { order, meta, pool } keyed by slug. */
function mapSections(sections, fallback) {
  if (!Array.isArray(sections) || !sections.length) return fallback
  const order = []
  const meta = {}
  const pool = {}
  const extra = {}
  sections.forEach((s) => {
    if (!s?.slug) return
    order.push(s.slug)
    const fb = fallback.meta[s.slug] ?? {}
    meta[s.slug] = {
      name: s.title ?? fb.name ?? s.slug,
      label: s.shortLabel ?? fb.label ?? '',
      image: s.heroCover?.images?.[0]?.url ?? s.spotlight?.image ?? fb.image ?? '',
      introTitle: s.introTitle ?? fb.introTitle ?? '',
      introCopy: s.introCopy ?? fb.introCopy ?? '',
      heroCover: s.heroCover?.images?.[0]?.url ?? fb.heroCover,
      heroTag: s.heroTag ?? fb.heroTag,
      heroHeadline: s.heroHeadline ?? s.spotlight?.title ?? fb.heroHeadline,
      spotlight: s.spotlight ? mapPost(s.spotlight, 0) : null,
      homeEyebrow: s.homeEyebrow ?? fb.homeEyebrow,
      homeMeta: s.homeMeta ?? fb.homeMeta,
      theme: s.theme ?? fb.theme,
    }
    const posts = mapPosts(s.posts)
    pool[s.slug] = posts.length ? posts : (fallback.pool[s.slug] ?? [])
    // "See more" pool: category articles (newest first) not already in the
    // baseline. Empty until the client adds articles beyond the curated set.
    const shownIds = new Set(pool[s.slug].map((p) => p.id))
    extra[s.slug] = mapPosts(s.categoryPosts).filter((p) => !shownIds.has(p.id))
  })
  return order.length ? { order, meta, pool, extra } : fallback
}

/** Site settings nav links -> the app's { label, page } / external shape. */
function mapNavLinks(links, fallback) {
  if (!Array.isArray(links) || !links.length) return fallback
  const mapped = links
    .map((l) => {
      if (!l?.label) return null
      if (l.targetType === 'external') {
        return l.externalUrl ? { label: l.label, href: l.externalUrl, external: true } : null
      }
      if (l.targetType === 'home') return { label: l.label, page: 'home' }
      return l.sectionSlug ? { label: l.label, page: l.sectionSlug } : null
    })
    .filter(Boolean)
  return mapped.length ? mapped : fallback
}

/* ── the merge: Sanity result + fallbacks -> one content object ──────────── */

export function buildContent(res, fb) {
  if (!res) return fb

  const sections = mapSections(res.sections, {
    order: fb.sectionOrder,
    meta: fb.sectionMeta,
    pool: fb.sectionPool,
    extra: {},
  })

  const articles = pick(mapPosts(res.articles), fb.articles)
  const home = res.homePage ?? {}
  const site = res.siteSettings ?? {}

  return {
    articles,
    sectionOrder: sections.order,
    sectionMeta: sections.meta,
    sectionPool: sections.pool,
    sectionExtra: sections.extra ?? {},

    categories: pick(res.categories, fb.categories),
    authors: pick(res.authors, fb.authors),

    home: {
      heroImage: home.heroBackground?.images?.[0]?.url ?? fb.home.heroImage,
      heroTag: pick(home.heroTag, fb.home.heroTag),
      heroTitle: pick(home.heroHeadline, home.featuredPost?.title ?? fb.home.heroTitle),
      heroPost: home.featuredPost ? mapPost(home.featuredPost, 0) : null,
      heroCtaLabel: pick(home.heroCtaLabel, fb.home.heroCtaLabel),
      sideLabels: pick(home.heroSideLabels, fb.home.sideLabels),
      copyright: pick(home.copyrightLabel, fb.home.copyright),
      featuredEyebrow: pick(home.featuredEyebrow, fb.home.featuredEyebrow),
      featuredTitle: pick(home.featuredTitle, fb.home.featuredTitle),
      featuredPosts: pick(mapPosts(home.featuredPosts), articles),
    },

    marqueeWords: pick(home.marqueeItems, fb.marqueeWords),

    site: {
      siteTitle: pick(site.siteTitle, fb.site.siteTitle),
      logo: pick(site.logo, fb.site.logo),
      wordmark: pick(site.wordmark, fb.site.wordmark),
      monogram: pick(site.monogram, fb.site.monogram),
      contactEmail: pick(site.contactEmail, fb.site.contactEmail),
      contactCtaLabel: pick(site.contactCtaLabel, fb.site.contactCtaLabel),
      contactCtaUrl: site.contactCtaUrl ?? null,
      copyrightText: pick(site.copyrightText, fb.site.copyrightText),
    },

    navLinks: mapNavLinks(site.navLinks, fb.navLinks),
    socialLinks: pick(site.socialLinks, fb.socialLinks),

    microcopy: { ...fb.microcopy, ...Object.fromEntries(
      Object.entries(res.microcopy ?? {}).filter(([, v]) => isFilled(v))
    ) },

    article: mapArticle(res.latestArticle, fb.article),
  }
}

/* ── the hook ────────────────────────────────────────────────────────────── */

/**
 * @param {object} fallback  the hardcoded defaults (used until/unless Sanity has content)
 * @returns {{content: object, loading: boolean, error: Error|null}}
 */
export function useSanityContent(fallback) {
  const [content, setContent] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    sanityClient
      .fetch(ALL_CONTENT_QUERY)
      .then((res) => {
        if (cancelled) return
        setContent(buildContent(res, fallback))
      })
      .catch((err) => {
        if (cancelled) return
        // Keep the fallback content on screen; the site stays fully usable.
        console.warn('[sanity] content fetch failed, using defaults:', err.message)
        setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { content, loading, error }
}
