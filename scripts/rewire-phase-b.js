/**
 * Rewire — PHASE B (the rename). Run this ONLY AFTER the new frontend is
 * deployed, because it changes section slugs and the old build routes by slug.
 *
 *   • section-lifestyle      → title "Culture",    slug "culture"
 *   • section-entertainment  → title "Interviews", slug "interviews"
 *
 * Articles are unaffected — they reference sections by id (set in Phase A), so
 * their links keep working. Only the two section documents change.
 *
 * Idempotent (patch `set`). Safe to re-run.
 * Usage:  node scripts/rewire-phase-b.js [--dry-run]
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

const RENAMES = [
  {
    id: 'section-lifestyle',
    set: {
      title: 'Culture',
      slug: { _type: 'slug', current: 'culture' },
      heroTag: 'Latest in Culture',
      shortLabel: 'Off the pitch',
      homeEyebrow: 'Off the pitch',
    },
  },
  {
    id: 'section-entertainment',
    set: {
      title: 'Interviews',
      slug: { _type: 'slug', current: 'interviews' },
      heroTag: 'Latest in Interviews',
      shortLabel: 'In their words',
      homeEyebrow: 'In their words',
    },
  },
]

async function run() {
  console.log(`\n▶ Phase B — rename${DRY ? ' (dry run)' : ''}\n`)
  for (const r of RENAMES) {
    console.log(`  ${r.id} → "${r.set.title}" (/${r.set.slug.current})`)
    if (!DRY) await client.patch(r.id).set(r.set).commit()
  }
  console.log(`\n✔ Phase B ${DRY ? 'dry run complete' : 'done'}.\n`)
}
run().catch((e) => { console.error('\n✖ Failed:', e.message, '\n'); process.exit(1) })
