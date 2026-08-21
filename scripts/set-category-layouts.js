/**
 * Footballer Fits — set layoutStyle on the three existing categories.
 *
 * TARGETED and non-destructive: it only patches the `layoutStyle` field on the
 * three known category docs, so it can NEVER touch the articles, sections, home
 * or settings the client has edited in the Studio. (The full migrate.js also now
 * carries these values, but must not be re-run against live content because it
 * createOrReplaces everything — this script is the safe way to backfill.)
 *
 * Idempotent: re-running just re-sets the same field. Safe any number of times.
 *
 * Token: uses SANITY_WRITE_TOKEN if set, else the Sanity CLI login token
 * (~/.config/sanity/config.json) — so `sanity login` is enough to run it.
 *
 * Usage:
 *   node scripts/set-category-layouts.js            # write
 *   node scripts/set-category-layouts.js --dry-run  # print, don't write
 */

import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DRY_RUN = process.argv.includes('--dry-run')

function resolveToken() {
  if (process.env.SANITY_WRITE_TOKEN) return process.env.SANITY_WRITE_TOKEN
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config', 'sanity', 'config.json'), 'utf8'))
    if (cfg.authToken) return cfg.authToken
  } catch {
    /* fall through */
  }
  return null
}

const token = resolveToken()
if (!token && !DRY_RUN) {
  console.error('\n✖ No write token. Run `sanity login` or set SANITY_WRITE_TOKEN.\n')
  process.exit(1)
}

const client = createClient({
  projectId: 'b5jktpaj',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

// category _id (as created by migrate.js: `category-<slug>`) -> layoutStyle
const LAYOUTS = {
  'category-fashion': 'fashion',
  'category-lifestyle': 'lifestyle',
  'category-entertainment': 'entertainment',
}

async function run() {
  console.log(`\nSetting layoutStyle on ${Object.keys(LAYOUTS).length} categories${DRY_RUN ? ' (dry run)' : ''}…\n`)
  for (const [id, layoutStyle] of Object.entries(LAYOUTS)) {
    if (DRY_RUN) {
      console.log(`  • ${id} → ${layoutStyle}`)
      continue
    }
    // setIfMissing would skip already-set docs; we want the three known ones to
    // be authoritative, so `set` — but ONLY the single layoutStyle field.
    await client.patch(id).set({ layoutStyle }).commit()
    console.log(`  ✓ ${id} → ${layoutStyle}`)
  }
  console.log('\nDone.\n')
}

run().catch((err) => {
  console.error('\n✖ Failed:', err.message, '\n')
  process.exit(1)
})
