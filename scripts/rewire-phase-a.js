/**
 * Rewire — PHASE A (safe, additive). Prepares the live dataset for the new
 * section/category architecture WITHOUT breaking the currently-deployed site:
 *
 *   1. Sets each existing section's `layoutStyle` (fashion/lifestyle/entertainment).
 *   2. Adds a `section` reference to every article, mapped from its current
 *      category (fashion→Fashion, lifestyle→Culture-section, entertainment→
 *      Interviews-section). Articles KEEP their `category` field, so any older
 *      build still renders correctly.
 *   3. Creates the new "Latest" section (aggregates all articles).
 *   4. Creates the new category TAGS (Music, Drops, News, Features).
 *
 * The section RENAME (Lifestyle→Culture, Entertainment→Interviews slug/title) is
 * deliberately NOT here — see rewire-phase-b.js — because renaming slugs would
 * break the old build's routing until the new frontend is deployed.
 *
 * Idempotent: patches use `set`, creates use `createOrReplace`. Safe to re-run.
 * Usage:  node scripts/rewire-phase-a.js [--dry-run]
 */
import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DRY = process.argv.includes('--dry-run')
const token =
  process.env.SANITY_WRITE_TOKEN ||
  (() => { try { return JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken } catch { return null } })()
if (!token && !DRY) { console.error('\n✖ No write token. Run `sanity login`.\n'); process.exit(1) }

const client = createClient({ projectId: 'b5jktpaj', dataset: 'production', apiVersion: '2024-01-01', token, useCdn: false })

// existing section id  ->  its design layout
const SECTION_LAYOUT = {
  'section-fashion': 'fashion',
  'section-lifestyle': 'lifestyle',       // becomes "Culture" in phase B
  'section-entertainment': 'entertainment', // becomes "Interviews" in phase B
}
// current category slug on a post  ->  the section it belongs to
const CAT_TO_SECTION = {
  fashion: 'section-fashion',
  lifestyle: 'section-lifestyle',
  entertainment: 'section-entertainment',
}
const TAGS = [
  { _id: 'category-music', title: 'Music' },
  { _id: 'category-drops', title: 'Drops' },
  { _id: 'category-news', title: 'News' },
  { _id: 'category-features', title: 'Features' },
]
const LATEST_SECTION = {
  _id: 'section-latest', _type: 'section',
  title: 'Latest', slug: { _type: 'slug', current: 'latest' }, order: 4,
  layoutStyle: 'fashion', theme: 'light',
  shortLabel: 'Just in', homeEyebrow: 'Just in',
  heroTag: 'The latest',
  introTitle: 'Everything, as it drops.',
  introCopy: 'The most recent stories across Fashion, Culture and Interviews — newest first.',
}

async function run() {
  console.log(`\n▶ Phase A${DRY ? ' (dry run)' : ''}\n`)

  // 1. section layoutStyle
  for (const [id, layoutStyle] of Object.entries(SECTION_LAYOUT)) {
    console.log(`  layoutStyle  ${id} → ${layoutStyle}`)
    if (!DRY) await client.patch(id).set({ layoutStyle }).commit()
  }

  // 3+4. Latest section + tag categories (new docs)
  console.log(`  section      section-latest (Latest)`)
  if (!DRY) await client.createOrReplace(LATEST_SECTION)
  for (const t of TAGS) {
    console.log(`  tag          ${t._id} (${t.title})`)
    if (!DRY) await client.createOrReplace({ _type: 'category', _id: t._id, title: t.title, slug: { _type: 'slug', current: t._id.replace('category-', '') } })
  }

  // 2. section ref on every post, mapped from its category slug
  const posts = await client.fetch(`*[_type=="post"]{ _id, "cat": category->slug.current, "hasSection": defined(section) }`)
  let set = 0, skipped = 0
  for (const p of posts) {
    const target = CAT_TO_SECTION[p.cat]
    if (!target) { skipped++; continue }
    if (!DRY) await client.patch(p._id).set({ section: { _type: 'reference', _ref: target } }).commit()
    set++
  }
  console.log(`  section ref  set on ${set} posts (skipped ${skipped} with no mappable category)`)

  console.log(`\n✔ Phase A ${DRY ? 'dry run complete' : 'done'}.\n`)
}
run().catch((e) => { console.error('\n✖ Failed:', e.message, '\n'); process.exit(1) })
