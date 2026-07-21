import {
  CogIcon,
  HomeIcon,
  TagIcon,
  UsersIcon,
  DocumentTextIcon,
  ThLargeIcon,
  ControlsIcon,
} from '@sanity/icons'

/**
 * Studio desk structure for Footballer Fits.
 *
 * Three documents are SINGLETONS — there should only ever be one of each, so
 * they open straight into the editor instead of showing a list with a
 * "create new" button:
 *
 *   • siteSettings — logo, nav, socials, footer, contact
 *   • homePage     — hero, marquee, section order, featured index
 *   • microcopy    — all the small repeated button/heading labels
 *
 * Everything else (Articles, Sections, Categories, Authors) stays a normal
 * list the client can add to freely.
 *
 * Pair this with `singletonTypes` / `singletonActions` in sanity.config.js so
 * the singletons also can't be created, duplicated or deleted from anywhere
 * else in the Studio (see sanity.config.example.js).
 */

/** Document types that must only ever have one instance. */
export const singletonTypes = new Set(['siteSettings', 'homePage', 'microcopy'])

/** The only actions a singleton is allowed to use (no create / delete / duplicate). */
export const singletonActions = new Set(['publish', 'discardChanges', 'restore'])

/**
 * Builds a singleton list item that opens the one document directly.
 * The documentId is fixed to the type name, so there is exactly one.
 */
const singleton = (S, {type, title, icon}) =>
  S.listItem()
    .title(title)
    .id(type)
    .icon(icon)
    .child(S.document().schemaType(type).documentId(type).title(title))

export const structure = (S) =>
  S.list()
    .title('Footballer Fits')
    .items([
      // ── One-off pages & global settings ──────────────────────────────────
      singleton(S, {type: 'homePage', title: 'Home page', icon: HomeIcon}),
      singleton(S, {type: 'siteSettings', title: 'Site settings', icon: CogIcon}),
      singleton(S, {type: 'microcopy', title: 'Labels & microcopy', icon: ControlsIcon}),

      S.divider(),

      // ── Collections the client adds to ───────────────────────────────────
      S.documentTypeListItem('section').title('Sections').icon(ThLargeIcon),
      S.documentTypeListItem('post').title('Articles').icon(DocumentTextIcon),
      S.documentTypeListItem('category').title('Categories').icon(TagIcon),
      S.documentTypeListItem('author').title('Authors').icon(UsersIcon),
    ])

export default structure
