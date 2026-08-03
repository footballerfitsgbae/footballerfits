/**
 * GROQ queries for Footballer Fits.
 *
 * Notes:
 *  - Image assets are dereferenced to a plain `url` string so the components can
 *    use them directly in <img src>, with no extra image-url dependency.
 *  - `order(...)` always runs BEFORE any slice, per GROQ semantics.
 *  - Filters are `_type ==` first so they stay index-optimizable.
 *  - Queries are plain template literals prefixed with a groq comment marker for
 *    editor highlighting. (`defineQuery` is only needed for TypeGen, which this
 *    plain-JS app does not use.)
 */

/* ── Reusable fragments ──────────────────────────────────────────────────── */

// figureImage object -> { url, alt, caption }
const figureFragment = /* groq */ `
  "url": image.asset->url,
  alt,
  caption
`

// imageGallery object -> { images: [{url, alt, caption}], caption }
const galleryFragment = /* groq */ `
  "images": images[]{
    "url": asset->url,
    alt,
    caption
  },
  caption
`

// Everything a card needs to render (matches the shape the components expect)
const cardFragment = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  standfirst,
  ratio,
  featured,
  publishedAt,
  readMinutes,
  externalLink,
  "category": category->title,
  "categorySlug": category->slug.current,
  "image": heroImage.image.asset->url,
  "imageAlt": heroImage.alt,
  "author": author->name
`

// Portable-text body, expanding each custom block type
const bodyFragment = /* groq */ `
  body[]{
    ...,
    _type == "figureImage" => { ${figureFragment} },
    _type == "imageGallery" => { ${galleryFragment} },
    _type == "socialEmbed" => { provider, url, caption }
  }
`

/* ── Document queries ────────────────────────────────────────────────────── */

/** All articles, newest first. */
export const ARTICLES_QUERY = /* groq */ `
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    ${cardFragment}
  }
`

/** A single article by slug, with its full body. */
export const ARTICLE_BY_SLUG_QUERY = /* groq */ `
  *[_type == "post" && slug.current == $slug][0] {
    ${cardFragment},
    "heroAlt": heroImage.alt,
    "gallery": gallery{ ${galleryFragment} },
    ${bodyFragment},
    "sectionSlug": *[_type == "section" && references(^.category._ref)][0].slug.current
  }
`

/** The most recent article overall (used for the home hero fallback). */
export const LATEST_ARTICLE_QUERY = /* groq */ `
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0] {
    ${cardFragment},
    ${bodyFragment}
  }
`

/** All categories. */
export const CATEGORIES_QUERY = /* groq */ `
  *[_type == "category"] | order(order asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    "image": coverImage.image.asset->url
  }
`

/** All authors. */
export const AUTHORS_QUERY = /* groq */ `
  *[_type == "author"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    role,
    bio,
    "photo": photo.asset->url,
    socialLinks[]{ platform, url }
  }
`

/**
 * All sections, in display order, each with the articles that belong to it.
 * `posts` prefers hand-picked `featuredPosts`, and falls back to every article
 * in the linked category, newest first.
 */
export const SECTIONS_QUERY = /* groq */ `
  *[_type == "section"] | order(order asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    shortLabel,
    theme,
    homeEyebrow,
    homeMeta,
    heroTag,
    heroHeadline,
    introTitle,
    introCopy,
    "heroCover": heroCover{ ${galleryFragment} },
    "spotlight": spotlightPost->{ ${cardFragment} },
    // The most recently published article in this section's category. The section
    // hero uses the manual spotlight if set, otherwise this latest article.
    "latest": *[_type == "post" && references(^.category._ref)] | order(publishedAt desc)[0]{ ${cardFragment} },
    "categorySlug": category->slug.current,
    "posts": select(
      count(featuredPosts) > 0 => featuredPosts[]->{ ${cardFragment} },
      *[_type == "post" && references(^.category._ref)] | order(publishedAt desc){ ${cardFragment} }
    ),
    // Every non-featured article in this section's category, newest first.
    // The section page shows the curated "posts" as the initial load, then the
    // "See more" button reveals these in batches (excluding any already shown).
    "categoryPosts": *[_type == "post" && !featured && references(^.category._ref)]
      | order(publishedAt desc){ ${cardFragment} }
  }
`

/** The home page singleton. */
export const HOME_PAGE_QUERY = /* groq */ `
  *[_type == "homePage"][0] {
    heroTag,
    heroHeadline,
    heroCtaLabel,
    heroSideLabels,
    copyrightLabel,
    marqueeItems,
    featuredEyebrow,
    featuredTitle,
    "heroBackground": heroBackground{ ${galleryFragment} },
    "featuredPost": featuredPost->{ ${cardFragment} },
    "sections": sections[]->{ "slug": slug.current, title },
    "featuredPosts": featuredPosts[]->{ ${cardFragment} },
    seo
  }
`

/** Global site settings singleton (nav, socials, footer, brand). */
export const SITE_SETTINGS_QUERY = /* groq */ `
  *[_type == "siteSettings"][0] {
    siteTitle,
    monogram,
    contactEmail,
    contactCtaLabel,
    contactCtaUrl,
    copyrightText,
    "logo": logo.asset->url,
    "wordmark": wordmark.asset->url,
    "favicon": favicon.asset->url,
    navLinks[]{
      label,
      targetType,
      externalUrl,
      "sectionSlug": section->slug.current
    },
    socialLinks[]{ platform, url },
    defaultSeo
  }
`

/** All the small repeated interface labels. */
export const MICROCOPY_QUERY = /* groq */ `
  *[_type == "microcopy"][0] {
    seeMoreLabel,
    readMoreLabel,
    seeAllTemplate,
    latestArticleLabel,
    homeBreadcrumbLabel,
    bylinePrefix,
    readTimeSuffix,
    sectionLatestPrefix,
    crossEyebrow,
    crossHeadingTemplate,
    crossReelTagPrefix,
    crossPairTagPrefix,
    crossPairTitle,
    readNextEyebrow,
    readNextTitleTemplate
  }
`

/**
 * One round trip that fetches everything the site needs. Cheaper and simpler
 * than seven separate requests on first paint.
 */
export const ALL_CONTENT_QUERY = /* groq */ `{
  "articles": ${ARTICLES_QUERY},
  "categories": ${CATEGORIES_QUERY},
  "authors": ${AUTHORS_QUERY},
  "sections": ${SECTIONS_QUERY},
  "homePage": ${HOME_PAGE_QUERY},
  "siteSettings": ${SITE_SETTINGS_QUERY},
  "microcopy": ${MICROCOPY_QUERY},
  "latestArticle": ${LATEST_ARTICLE_QUERY}
}`
