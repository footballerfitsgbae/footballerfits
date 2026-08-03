/**
 * Footballer Fits — Sanity content migration / seed.
 *
 * Takes every piece of hardcoded content out of src/App.jsx and creates it as
 * real Sanity documents: categories, sections, an author, all articles (with
 * uploaded images and full article body), plus the homePage, siteSettings and
 * microcopy singletons.
 *
 * Safe to run repeatedly: every document uses a stable _id with
 * `createOrReplace`, and image uploads are content-hash deduplicated by Sanity.
 *
 * ⚠️  `createOrReplace` REPLACES the whole document. If the client has edited
 *     content in the Studio, re-running this will overwrite those edits.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=sk... node scripts/migrate.js
 *   SANITY_WRITE_TOKEN=sk... node scripts/migrate.js --dry-run
 */

import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const DRY_RUN = process.argv.includes('--dry-run')

const token = process.env.SANITY_WRITE_TOKEN
if (!token && !DRY_RUN) {
  console.error(`
✖ Missing SANITY_WRITE_TOKEN.

  Create one at https://sanity.io/manage → project "ffxgbae" (b5jktpaj)
  → API → Tokens → "Add API token" → permission: Editor.

  Then run:
    SANITY_WRITE_TOKEN=sk_your_token_here node scripts/migrate.js
`)
  process.exit(1)
}

const client = createClient({
  projectId: 'b5jktpaj',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false, // never read from the CDN when writing
})

/* ══════════════════════════════════════════════════════════════════════════
   THE HARDCODED CONTENT (lifted verbatim from src/App.jsx)
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { slug: 'fashion', title: 'Fashion', order: 1, description: 'Kits, collabs, sneakers and matchday drip.' },
  { slug: 'lifestyle', title: 'Lifestyle', order: 2, description: 'How the game’s biggest names move off the pitch.' },
  { slug: 'entertainment', title: 'Entertainment', order: 3, description: 'Music, cameos, memes and football in culture.' },
]

// The 12 cards from the `articles` array. `cat` maps the original editorial tags
// (Culture / Editorial / Style / Archive) onto the three real categories.
// `ago` + `read` reproduce AGO_HOURS and readTime(id) exactly.
const ARTICLES = [
  { n: 1,  cat: 'lifestyle',     ratio: 'portrait', ago: 3,   read: 4, image: 'blog1.JPG',  title: 'Coming Home?',              excerpt: 'Tuchel names his 26-man squad. We break down the looks, the choices, and what it says about the culture.' },
  { n: 2,  cat: 'lifestyle',     ratio: 'portrait', ago: 6,   read: 5, image: 'blog2.JPG',  title: "Let's Go Arsenal",          excerpt: '21 Savage at the Emirates. When rap and football culture collide in the stands.' },
  { n: 3,  cat: 'fashion',       ratio: 'tall',     ago: 20,  read: 6, image: 'blog3.JPG',  title: 'Como Debut Rhude × Adidas', excerpt: 'The fourth kit created to support the fight against childhood leukaemia, a collab that hits different.' },
  { n: 4,  cat: 'fashion',       ratio: 'tall',     ago: 31,  read: 3, image: 'blog4.JPG',  title: 'Arrived',                   excerpt: "Juventus drop their 26/27 home shirt, honouring the club's identity while reimagining iconic elements." },
  { n: 5,  cat: 'fashion',       ratio: 'portrait', ago: 47,  read: 4, image: 'blog5.jpeg', title: 'Galáctico Elegance',        excerpt: "Redefining what it means to be the face of the world's biggest club, on and off the pitch." },
  { n: 6,  cat: 'fashion',       ratio: 'portrait', ago: 72,  read: 5, image: 'blog6.jpeg', title: 'The Dior Era',              excerpt: 'When streetwear meets luxury. Tracking the stylistic evolution of the modern winger.' },
  { n: 7,  cat: 'entertainment', ratio: 'tall',     ago: 120, read: 6, image: 'blog7.jpeg', title: 'Obsession',                 excerpt: 'Ditching current drops for obscure 90s fashion archives and rare Japanese denim.' },
  { n: 8,  cat: 'entertainment', ratio: 'tall',     ago: 168, read: 3, image: 'blog8.jpeg', title: 'The Tunnel Walk',           excerpt: 'How the Premier League adopted NBA tunnel fashion, turning concrete corridors into runways.' },
  { n: 9,  cat: 'fashion',       ratio: 'portrait', ago: 24,  read: 4, image: 'blog9.jpeg', title: 'The Comeback Kit',          excerpt: 'A retro away shirt reborn, and how the archive keeps rewriting the modern matchday wardrobe.' },
  { n: 10, cat: 'entertainment', ratio: 'tall',     ago: 24,  read: 5, image: 'blog2.JPG',  title: 'Tunnel Vision',             excerpt: "The pre-match walk has become the runway. Inside football's obsession with the tunnel fit." },
  { n: 11, cat: 'lifestyle',     ratio: 'portrait', ago: 24,  read: 6, image: 'blog5.jpeg', title: 'Ballon Nights',             excerpt: "Tailoring, ice and quiet luxury, and how the game's biggest night became a menswear moment." },
  { n: 12, cat: 'fashion',       ratio: 'tall',     ago: 24,  read: 3, image: 'blog3.JPG',  title: 'Vintage Nine',              excerpt: 'Chasing the perfect number-nine shirt through 90s catalogues and dead-stock rails.' },
]

// The full featured article (MOCK_ARTICLE), used as the home hero story.
const FEATURE = {
  slug: 'every-boot-michael-olise-has-worn-at-the-world-cup',
  title: 'Every Boot Michael Olise Has Worn At The World Cup',
  cat: 'fashion',
  image: 'michael_olise.png',
  imageAlt: 'Michael Olise at the World Cup',
  ago: 22,
  read: 5,
  ratio: 'portrait',
  excerpt: 'The France winger has spent the World Cup quietly building the tournament’s most talked about boot rotation.',
  standfirst: 'While the biggest names chase million dollar deals, the France winger has spent the World Cup quietly building the tournament’s most talked about boot rotation.',
  body: [
    { p: 'Michael Olise has quietly become one of the most fascinating football boot stories at the World Cup. While the biggest names in the game are often tied to multi million dollar endorsement deals and required to wear the latest commercial releases, the France winger has gone in the opposite direction. His choices have turned him into a favourite among football boot enthusiasts, not because he is chasing attention, but because he simply wears what he likes.' },
    { p: 'Throughout the tournament, Olise has rotated between several carefully selected colourways while staying loyal to one iconic silhouette, the Nike Hypervenom Phantom III. The boot was discontinued years ago, yet Olise continues to source fresh pairs privately instead of switching to newer models. From clean white editions to striking blue, mint green and gold variations, every pair has been chosen to complement France’s kit rather than satisfy a sponsor’s marketing campaign.' },
    { gallery: [{ file: 'ib1.jpeg', alt: 'Olise in the white Hypervenom Phantom III' }, { file: 'ib2.jpeg', alt: 'A blue colourway of the Phantom III' }] },
    { p: 'That attention to detail has become part of his identity. Every match feels like another opportunity to showcase a different colourway while maintaining the same trusted performance. It is an approach rarely seen in modern football where nearly every elite player is contractually obligated to wear whatever their boot manufacturer launches each season. Olise, however, has reportedly turned down lucrative sponsorship opportunities in order to keep complete freedom over what he wears on the pitch.' },
    { image: { file: 'ib3.jpeg', alt: 'A close detail of the Phantom III soleplate', caption: 'The Phantom III soleplate, sourced privately years after the boot was discontinued.' } },
    { p: 'His loyalty to the Hypervenom Phantom III is easy to understand. The boot remains one of Nike’s most celebrated creations, known for its close touch, responsive feel and aggressive traction. For a player who relies on quick changes of direction, delicate first touches and precise passing in tight spaces, familiarity matters more than marketing. Instead of constantly adapting to new technology, Olise has perfected his game in a model he completely trusts.' },
    { embed: { provider: 'instagram', url: 'https://www.instagram.com/p/Da20rt_CFVe/?hl=en&img_index=1', caption: 'The rotation, catalogued by the boot community.' } },
    { p: 'As France progressed through the World Cup, fans began paying almost as much attention to Olise’s boots as they did to his performances. Each appearance sparked conversations across football boot communities as supporters tried to identify the latest colourway before kickoff. In a tournament dominated by bright pink releases and coordinated brand campaigns, Olise’s understated individuality stood out even more.' },
    { gallery: [{ file: 'ib4.jpeg', alt: 'A mint green Phantom III' }, { file: 'ib5.jpeg', alt: 'A gold Phantom III catching the light' }] },
    { p: 'In an era where football equipment has become heavily commercialised, Michael Olise reminds us that style can still be personal. Every pair he has worn tells a story of preference over promotion, comfort over contracts and individuality over conformity. Whether he steps onto the pitch in white, blue, green or gold, one thing remains constant. Michael Olise continues to prove that some of football’s most memorable boot stories are written by players who simply refuse to follow the script.' },
  ],
}

const AUTHOR = { slug: 'jules-okafor', name: 'Jules Okafor', role: 'Staff Writer' }

// SECTION_META, verbatim.
const SECTIONS = [
  {
    slug: 'fashion', title: 'Fashion', order: 1, theme: 'light',
    shortLabel: 'Kits, collabs & drip', homeEyebrow: 'Latest Stories', homeMeta: 'Updated weekly',
    heroTag: 'Latest in Fashion', heroCover: 'jcvr.png',
    heroHeadline: 'Do England Have The Best Hair Game In The World Cup?',
    introTitle: 'Worth getting dressed for.',
    introCopy: 'Kits, collabs, sneakers and matchday drip. The shirts worth framing, the drops worth queuing for and the fits we haven’t stopped thinking about.',
  },
  {
    slug: 'lifestyle', title: 'Lifestyle', order: 2, theme: 'dark',
    shortLabel: 'Off the pitch', homeEyebrow: 'Off the pitch', homeMeta: '',
    heroTag: 'Latest in Lifestyle', heroCover: 'jcvr.png',
    heroHeadline: 'Do England Have The Best Hair Game In The World Cup?',
    introTitle: 'Off the pitch is where the story lives.',
    introCopy: 'How the game’s biggest names move once the whistle goes. The homes, the rides, the downtime and the flexes that never make the highlight reel.',
  },
  {
    slug: 'entertainment', title: 'Entertainment', order: 3, theme: 'light',
    shortLabel: 'Culture & more', homeEyebrow: 'Culture & more', homeMeta: 'Selected',
    heroTag: 'Latest in Entertainment', heroCover: 'jcvr.png',
    heroHeadline: 'Do England Have The Best Hair Game In The World Cup?',
    introTitle: 'The game after the game.',
    introCopy: 'Music, cameos, memes and the moments football hands straight to culture. Everything the sport touches the second it leaves the ninety minutes.',
  },
]

const MARQUEE = ['Editorial', 'Off-Pitch', 'Style', 'Culture', 'Archive', 'The Tunnel', 'Weekly Drops']

const MICROCOPY = {
  seeMoreLabel: 'See More',
  readMoreLabel: 'Read more',
  seeAllTemplate: 'See all {section}',
  latestArticleLabel: 'Latest Article',
  homeBreadcrumbLabel: 'Home',
  bylinePrefix: 'By',
  readTimeSuffix: 'min read',
  sectionLatestPrefix: 'Latest in',
  crossEyebrow: 'Keep going',
  crossHeadingTemplate: 'There’s more to the fit than {section}.',
  crossReelTagPrefix: 'From',
  crossPairTagPrefix: 'Also in',
  crossPairTitle: 'Two you shouldn’t miss',
  readNextEyebrow: 'Keep reading',
  readNextTitleTemplate: 'More in {section}',
}

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

let keySeq = 0
const key = () => `k${(keySeq++).toString(36)}`

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const isoAgo = (hours) => new Date(Date.now() - hours * 3600_000).toISOString()

const ref = (_ref) => ({ _type: 'reference', _ref })
const refItem = (_ref) => ({ _type: 'reference', _ref, _key: key() })

// Upload once per file; Sanity itself dedupes by content hash across runs.
const assetCache = new Map()
async function uploadImage(file) {
  if (!file) return null
  if (assetCache.has(file)) return assetCache.get(file)
  const abs = path.join(PUBLIC_DIR, file)
  if (!fs.existsSync(abs)) {
    console.warn(`  ⚠ missing image, skipping: ${file}`)
    assetCache.set(file, null)
    return null
  }
  if (DRY_RUN) {
    assetCache.set(file, `image-DRYRUN-${slugify(file)}`)
    return assetCache.get(file)
  }
  const asset = await client.assets.upload('image', fs.createReadStream(abs), {
    filename: path.basename(abs),
  })
  console.log(`  ↑ ${file} → ${asset._id}`)
  assetCache.set(file, asset._id)
  return asset._id
}

const figureImage = (assetId, alt, caption) =>
  assetId ? { _type: 'figureImage', image: { _type: 'image', asset: ref(assetId) }, ...(alt && { alt }), ...(caption && { caption }) } : undefined

const imageGallery = (entries, caption) => {
  const images = entries.filter((e) => e.assetId).map((e) => ({
    _type: 'image', _key: key(), asset: ref(e.assetId), ...(e.alt && { alt: e.alt }),
  }))
  return images.length ? { _type: 'imageGallery', images, ...(caption && { caption }) } : undefined
}

const textBlock = (text) => ({
  _type: 'block', _key: key(), style: 'normal', markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
})

/** Turn the app's body blocks into Portable Text + custom block types. */
async function buildBody(blocks) {
  const out = []
  for (const b of blocks) {
    if (b.p) out.push(textBlock(b.p))
    else if (b.image) {
      const id = await uploadImage(b.image.file)
      const fig = figureImage(id, b.image.alt, b.image.caption)
      if (fig) out.push({ ...fig, _key: key() })
    } else if (b.gallery) {
      const entries = []
      for (const g of b.gallery) entries.push({ assetId: await uploadImage(g.file), alt: g.alt })
      const gal = imageGallery(entries)
      if (gal) out.push({ ...gal, _key: key() })
    } else if (b.embed) {
      out.push({ _type: 'socialEmbed', _key: key(), ...b.embed })
    }
  }
  return out
}

const docs = []
const stage = (doc) => { docs.push(doc); return doc._id }

/* ══════════════════════════════════════════════════════════════════════════
   BUILD
   ══════════════════════════════════════════════════════════════════════════ */

async function build() {
  console.log(`\n▶ Building documents${DRY_RUN ? ' (dry run, nothing will be written)' : ''}…\n`)

  // 1. Categories
  console.log('· categories')
  const catId = {}
  for (const c of CATEGORIES) {
    catId[c.slug] = `category-${c.slug}`
    stage({
      _id: catId[c.slug], _type: 'category',
      title: c.title, slug: { _type: 'slug', current: c.slug },
      description: c.description, order: c.order,
    })
  }

  // 2. Author
  console.log('· author')
  const authorId = `author-${AUTHOR.slug}`
  stage({
    _id: authorId, _type: 'author',
    name: AUTHOR.name, slug: { _type: 'slug', current: AUTHOR.slug }, role: AUTHOR.role,
  })

  // 3. Articles — UNIQUE documents per section.
  // Each section owns its own posts (Fashion 9, Lifestyle 12, Entertainment 8),
  // every one a separate document with a unique _id and slug, so a story is only
  // ever recommended within its own category and editing one never touches
  // another. Content is drawn from the original templates and may repeat for now;
  // the documents are still distinct entities.
  console.log('· articles + images (unique per section)')
  const byN = Object.fromEntries(ARTICLES.map((a) => [a.n, a]))
  const SECTION_POOLS = {
    fashion:       [3, 4, 5, 6, 9, 12, 7, 8, 11],            // 9
    lifestyle:     [1, 2, 11, 6, 5, 9, 3, 8, 7, 4, 10, 12],  // 12
    entertainment: [8, 6, 4, 2, 1, 7, 5, 10],                // 8
  }

  // Slugs must be globally unique (routing is by slug), so de-duplicate.
  const usedSlugs = new Set()
  const uniqueSlug = (base) => {
    let s = base
    for (let i = 2; usedSlugs.has(s); i++) s = `${base}-${i}`
    usedSlugs.add(s)
    return s
  }

  const postIdsBySection = {}   // section slug -> [post ids], in order
  for (const s of SECTIONS) {
    const ids = []
    const pool = SECTION_POOLS[s.slug] ?? []
    for (let i = 0; i < pool.length; i++) {
      const t = byN[pool[i]]
      if (!t) continue
      const id = `post-${s.slug}-${i + 1}`
      const slug = uniqueSlug(slugify(t.title))
      const assetId = await uploadImage(t.image)
      stage({
        _id: id, _type: 'post',
        title: t.title,
        slug: { _type: 'slug', current: slug },
        category: ref(catId[s.slug]),   // category == the owning section
        author: ref(authorId),
        excerpt: t.excerpt,
        heroImage: figureImage(assetId, t.title),
        publishedAt: isoAgo(t.ago),
        readMinutes: t.read,
        ratio: t.ratio,
        featured: false,
      })
      ids.push(id)
    }
    postIdsBySection[s.slug] = ids
    console.log(`  ${s.slug}: ${ids.length} posts`)
  }

  // 4. The featured (home hero) article, with its full body. Its own document.
  console.log('· featured article (full body)')
  const featureAsset = await uploadImage(FEATURE.image)
  const featureBody = await buildBody(FEATURE.body)
  const featureId = `post-${FEATURE.slug}`
  usedSlugs.add(FEATURE.slug)
  stage({
    _id: featureId, _type: 'post',
    title: FEATURE.title,
    slug: { _type: 'slug', current: FEATURE.slug },
    category: ref(catId[FEATURE.cat]),
    author: ref(authorId),
    excerpt: FEATURE.excerpt,
    standfirst: FEATURE.standfirst,
    heroImage: figureImage(featureAsset, FEATURE.imageAlt),
    body: featureBody,
    publishedAt: isoAgo(FEATURE.ago),
    readMinutes: FEATURE.read,
    ratio: FEATURE.ratio,
    featured: true,
  })

  // 5. Sections — each points at its own unique posts.
  console.log('· sections')
  const sectionIds = []
  for (const s of SECTIONS) {
    const id = `section-${s.slug}`
    const ids = postIdsBySection[s.slug] ?? []
    stage({
      _id: id, _type: 'section',
      title: s.title,
      slug: { _type: 'slug', current: s.slug },
      order: s.order,
      shortLabel: s.shortLabel,
      theme: s.theme,
      homeEyebrow: s.homeEyebrow,
      homeMeta: s.homeMeta,
      heroTag: s.heroTag,
      introTitle: s.introTitle,
      introCopy: s.introCopy,
      category: ref(catId[s.slug]),
      // heroCover and spotlightPost intentionally left blank — the section hero
      // auto-pulls its background image, headline and link from the latest article
      // in the category. Jordan can set either field to override.
      featuredPosts: ids.map(refItem),
    })
    sectionIds.push(id)
  }

  // 6. Home page singleton  (_id must be "homePage" — the desk structure pins it)
  // The "Featured Fits" index shows a balanced mix: the first few from each section.
  console.log('· homePage singleton')
  const indexIds = [
    ...(postIdsBySection.fashion ?? []).slice(0, 4),
    ...(postIdsBySection.lifestyle ?? []).slice(0, 4),
    ...(postIdsBySection.entertainment ?? []).slice(0, 4),
  ]
  stage({
    _id: 'homePage', _type: 'homePage',
    heroBackground: imageGallery([{ assetId: featureAsset, alt: FEATURE.imageAlt }]),
    heroTag: 'Latest Article',
    featuredPost: ref(featureId),
    heroHeadline: FEATURE.title,
    heroCtaLabel: 'Read more',
    heroSideLabels: ['Editorial', 'Culture', 'Style'],
    copyrightLabel: '© 2026',
    sections: sectionIds.map(refItem),
    marqueeItems: MARQUEE,
    featuredEyebrow: 'Featured',
    featuredTitle: 'Featured Fits, in order.',
    featuredPosts: indexIds.map(refItem),
  })

  // 7. Site settings singleton  (_id must be "siteSettings")
  console.log('· siteSettings singleton')
  const logoAsset = await uploadImage('logo.JPG')
  const wordmarkAsset = await uploadImage('ff_hero.avif')
  stage({
    _id: 'siteSettings', _type: 'siteSettings',
    siteTitle: 'Footballer Fits',
    monogram: 'FF',
    ...(logoAsset && { logo: { _type: 'image', asset: ref(logoAsset) } }),
    ...(wordmarkAsset && { wordmark: { _type: 'image', asset: ref(wordmarkAsset) } }),
    contactEmail: 'contact@footballerfits.co.uk',
    contactCtaLabel: 'Contact Now',
    copyrightText: '© 2026',
    navLinks: [
      { _type: 'navItem', _key: key(), label: 'Home', targetType: 'home' },
      ...SECTIONS.map((s) => ({
        _type: 'navItem', _key: key(), label: s.title,
        targetType: 'section', section: ref(`section-${s.slug}`),
      })),
      // The Privacy page is not a section, so it is stored as a link. See the
      // note printed at the end of this script.
      { _type: 'navItem', _key: key(), label: 'Privacy Policy', targetType: 'external', externalUrl: '/#/privacy' },
    ],
    // URLs intentionally left blank for the client to fill in with real profiles.
    socialLinks: ['x', 'instagram', 'tiktok', 'youtube'].map((platform) => ({
      _type: 'socialLink', _key: key(), platform,
    })),
  })

  // 8. Microcopy singleton  (_id must be "microcopy")
  console.log('· microcopy singleton')
  stage({ _id: 'microcopy', _type: 'microcopy', ...MICROCOPY })
}

/* ══════════════════════════════════════════════════════════════════════════
   WRITE
   ══════════════════════════════════════════════════════════════════════════ */

async function main() {
  await build()

  const counts = docs.reduce((m, d) => ({ ...m, [d._type]: (m[d._type] ?? 0) + 1 }), {})
  console.log(`\n▶ ${docs.length} documents ready:`)
  Object.entries(counts).forEach(([t, n]) => console.log(`   ${n.toString().padStart(3)} × ${t}`))

  if (DRY_RUN) {
    console.log('\n✔ Dry run complete. Nothing was written.\n')
    return
  }

  // One transaction: all-or-nothing, so a failure never leaves a half-seeded dataset.
  const tx = docs.reduce((t, doc) => t.createOrReplace(doc), client.transaction())
  await tx.commit()

  // Clean up posts from earlier runs that use the old id scheme and are no longer
  // referenced (sections/homePage above now point only at the new documents).
  // Only touches migration-created ids (prefix "post-"); client-added posts get
  // random ids and are left untouched.
  const keep = new Set(docs.filter((d) => d._type === 'post').map((d) => d._id))
  const existing = await client.fetch(`*[_type == "post" && string::startsWith(_id, "post-")]._id`)
  const stale = existing.filter((id) => !keep.has(id))
  if (stale.length) {
    const del = stale.reduce((t, id) => t.delete(id), client.transaction())
    await del.commit()
    console.log(`\n🧹 Removed ${stale.length} stale post document(s) from a previous run.`)
  }

  console.log(`
✔ Migration complete. ${docs.length} documents written to b5jktpaj/production.

  Next steps
  ──────────
  1. Open the Studio and confirm the content:  cd ../studio-ffxgbae && npm run dev
  2. Allow the site to read the dataset (required, or the app silently falls back):
       npx sanity cors add http://localhost:5173
       npx sanity cors add https://footballerfits.vercel.app

  Note: "Privacy Policy" was stored as an external nav link ("/#/privacy")
  because the navItem schema only supports home / section / external targets.
  It works, but opens in a new tab. Ask for a one-line schema tweak if you'd
  prefer a proper internal page option.
`)
}

main().catch((err) => {
  console.error('\n✖ Migration failed:', err.message)
  if (err.statusCode === 401 || err.statusCode === 403) {
    console.error('  The token is missing, wrong, or lacks Editor permission.')
  }
  process.exit(1)
})
