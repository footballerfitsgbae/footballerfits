import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './schemas'
import {structure, singletonTypes, singletonActions} from './structure'

/**
 * Example Sanity Studio config for Footballer Fits.
 *
 * ── How to use ────────────────────────────────────────────────────────────
 * 1. Scaffold a Studio (from the repo root):
 *      npm create sanity@latest -- --project <projectId> --dataset production
 * 2. Rename this file to `sanity.config.js` at the Studio root (or copy its
 *    contents into the generated one) and fill in projectId / dataset below.
 * 3. Run the Studio:  npm run dev  (inside the Studio folder)
 *
 * ── What this does ────────────────────────────────────────────────────────
 * • Loads every schema type from ./schemas
 * • Uses ./structure so Home page, Site settings and Labels & microcopy open
 *   as single documents (no list, no "create new")
 * • Blocks those three from being created / duplicated / deleted anywhere else
 *
 * If your Studio is on an older Sanity 3 release that predates
 * `sanity/structure`, swap the two lines marked below for:
 *      import {deskTool} from 'sanity/desk'
 *      deskTool({structure})
 */
export default defineConfig({
  name: 'default',
  title: 'Footballer Fits',

  projectId: 'YOUR_PROJECT_ID', // ← replace
  dataset: 'production',

  plugins: [
    structureTool({structure}), // ← swap for deskTool({structure}) on older v3
    visionTool(),
  ],

  schema: {
    types: schemaTypes,

    // Hide the singletons from the global "create new document" menu.
    templates: (prev) => prev.filter(({schemaType}) => !singletonTypes.has(schemaType)),
  },

  document: {
    // Strip create / duplicate / delete from the singleton documents.
    actions: (prev, {schemaType}) =>
      singletonTypes.has(schemaType)
        ? prev.filter(({action}) => action && singletonActions.has(action))
        : prev,
  },
})
