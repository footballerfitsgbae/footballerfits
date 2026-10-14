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

// Sanity CDN image transforms — serve a right-sized WebP/AVIF instead of the
// full-size original (a hero PNG drops from ~2.3MB to ~110KB). `auto=format`
// lets the browser pick WebP/AVIF; `fit=max` caps the width WITHOUT upscaling
// or cropping, so each image keeps its aspect ratio (CSS object-fit still crops).
// `null + "?..."` stays null in GROQ, so a missing image never yields a broken URL.
// auto=format serves AVIF (then WebP) — at these quality levels it's visually
// indistinguishable from the source to the eye, while still far smaller than the
// original PNG/JPEG. Quality lifted (q82/q82/q80) so photos stay crisp and premium.
const IMG_HERO = `?auto=format&fit=max&q=82&w=2560`   // full-bleed hero covers / backgrounds (retina-sized)
const IMG_BODY = `?auto=format&fit=max&q=82&w=1600`   // article body figures + galleries
const IMG_CARD = `?auto=format&fit=max&q=80&w=1200`   // cards (and card-derived heroes)
const IMG_THUMB = `?auto=format&fit=max&q=78&w=500`   // avatars / small thumbs

// figureImage object -> { url, alt, caption }
const figureFragment = /* groq */ `
  "url": image.asset->url + "${IMG_BODY}",
  alt,
  caption
`

// imageGallery object -> { images: [{url, alt, caption}], caption }
const galleryFragment = /* groq */ `
  "images": images[]{
    "url": asset->url + "${IMG_HERO}",
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
  // Section the card belongs to (routing) — new "section" ref, falling back to
  // the deprecated "category" ref so old data still resolves during the migration.
  "sectionSlug": coalesce(section->slug.current, category->slug.current),
  "sectionTitle": coalesce(section->title, category->title),
  // Category TAGS (Music/Drops/…) shown on the card; first one wins, else section.
  "categoryTags": categories[]->title,
  "image": heroImage.image.asset->url + "${IMG_CARD}",
  "imageAlt": heroImage.alt,
  "imageCredit": heroImage.credit,
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
    ${bodyFragment}
  }
`

/** The most recent article overall (used for the home hero fallback). */
export const LATEST_ARTICLE_QUERY = /* groq */ `
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0] {
    ${cardFragment},
    ${bodyFragment}
  }
`

/** All category tags. */
export const CATEGORIES_QUERY = /* groq */ `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current
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
    "photo": photo.asset->url + "${IMG_THUMB}",
    socialLinks[]{ platform, url }
  }
`

// An article belongs to a section when its `section` reference points to it.
// That's the single source of truth: set an article's Section field and it appears
// in that section automatically, newest first. `^` is the enclosing section doc.
const IN_SECTION = `section._ref == ^._id`

/**
 * All sections, in display order, each with the articles that belong to it.
 * The article grid is driven PURELY by the article's `section` reference, newest
 * first — no dependency on the section's `featuredPosts` array. `spotlightPost`
 * stays available as an OPTIONAL hero override (the "spotlight" field below).
 * The "latest" section aggregates every article across all sections.
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
    // The bespoke design this section renders in — its own layoutStyle, falling
    // back to the deprecated category layoutStyle. JS defaults an empty value to Fashion.
    "layout": coalesce(layoutStyle, category->layoutStyle),
    // The section hero's article: the newest one in this section (the "latest"
    // section aggregates every section), excluding the home-hero feature.
    "latest": select(
      slug.current == "latest" => *[_type == "post" && !featured] | order(publishedAt desc)[0]{ ${cardFragment} },
      *[_type == "post" && !featured && ${IN_SECTION}] | order(publishedAt desc)[0]{ ${cardFragment} }
    ),
    // Every article in this section, newest first (home block + section page grid).
    // Pulled straight from the article's section reference — NOT featuredPosts.
    // The "latest" section aggregates every section. Excludes the home-hero feature
    // so it isn't shown twice.
    "posts": select(
      slug.current == "latest" => *[_type == "post" && !featured] | order(publishedAt desc){ ${cardFragment} },
      *[_type == "post" && !featured && ${IN_SECTION}] | order(publishedAt desc){ ${cardFragment} }
    ),
    // Same set (grid + /all page). Kept as its own field for the frontend pipeline.
    "categoryPosts": select(
      slug.current == "latest" => *[_type == "post" && !featured] | order(publishedAt desc){ ${cardFragment} },
      *[_type == "post" && !featured && ${IN_SECTION}] | order(publishedAt desc){ ${cardFragment} }
    ),
    // The editor's "Article order" list (section settings → Articles): the full
    // article cards, in the editor's chosen order. Pre-filled with this section's own
    // articles (newest-first) so the Studio count matches "Articles in this section",
    // and it's where the client REORDERS or ADDS EXTRA articles to show. The frontend
    // renders these in order, and auto-prepends any section article not yet listed
    // (newest-first), so brand-new uploads always appear up top without extra work.
    "listed": featuredPosts[]->{ ${cardFragment} }
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
    "heroBackground": heroBackground{ ${galleryFragment} },
    "featuredPost": featuredPost->{ ${cardFragment} },
    // Raw (un-transformed) asset URL of the hero image so the frontend can build a
    // responsive srcset at the right size for each screen — the full-bleed hero
    // needs a much larger image than a card, or it upscales and looks blurry.
    "heroImageBase": coalesce(heroBackground.images[0].asset->url, featuredPost->heroImage.image.asset->url),
    "sections": sections[]->{ "slug": slug.current, title },
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

/** The About page singleton. */
export const ABOUT_PAGE_QUERY = /* groq */ `
  *[_type == "aboutPage"][0] {
    eyebrow,
    statement,
    lead,
    paragraphs,
    columns[]{ title, description },
    ctaLabel,
    seo
  }
`

/** The Contact page singleton. */
export const CONTACT_PAGE_QUERY = /* groq */ `
  *[_type == "contactPage"][0] {
    eyebrow,
    title,
    lead,
    rows[]{ label, description, email },
    seo
  }
`

/** The two legal pages (Terms & Conditions, Privacy Policy), keyed by id. */
export const LEGAL_PAGES_QUERY = /* groq */ `
  *[_type == "legalPage"] {
    _id,
    title,
    lastUpdated,
    lead,
    sections[]{
      heading,
      body[]{
        _type,
        _type == "legalText" => { text },
        _type == "legalBullets" => { items }
      }
    },
    seo
  }
`

/** The 3 most recently published articles across ALL sections (homepage Latest block). */
export const LATEST_POSTS_QUERY = /* groq */ `
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...10]{ ${cardFragment} }
`

/**
 * One round trip that fetches everything the site needs. Cheaper and simpler
 * than separate requests on first paint.
 */
export const ALL_CONTENT_QUERY = /* groq */ `{
  "articles": ${ARTICLES_QUERY},
  "categories": ${CATEGORIES_QUERY},
  "authors": ${AUTHORS_QUERY},
  "sections": ${SECTIONS_QUERY},
  "homePage": ${HOME_PAGE_QUERY},
  "siteSettings": ${SITE_SETTINGS_QUERY},
  "microcopy": ${MICROCOPY_QUERY},
  "latestArticle": ${LATEST_ARTICLE_QUERY},
  "latestPosts": ${LATEST_POSTS_QUERY},
  "aboutPage": ${ABOUT_PAGE_QUERY},
  "contactPage": ${CONTACT_PAGE_QUERY},
  "legalPages": ${LEGAL_PAGES_QUERY}
}`
