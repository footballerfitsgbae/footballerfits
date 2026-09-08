import {defineType, defineField} from 'sanity'

/**
 * homePage — a single (singleton) document for everything editable on the home
 * page: the big hero, its side labels and copyright stamp, which sections show
 * and in what order, and the marquee band.
 */
export default defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'sections', title: 'Sections & marquee'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // ── Hero ───────────────────────────────────────────────────────────────
    defineField({
      name: 'heroBackground',
      title: 'Hero background image',
      type: 'imageGallery',
      group: 'hero',
      description: 'The full-bleed image behind the hero. Add one, or several to rotate.',
    }),
    defineField({
      name: 'heroTag',
      title: 'Hero tag',
      type: 'string',
      group: 'hero',
      description: 'Small label above the hero headline (e.g. "Latest Article").',
    }),
    defineField({
      name: 'featuredPost',
      title: 'Hero article',
      type: 'reference',
      to: [{type: 'post'}],
      group: 'hero',
      description: 'The article the hero features and links to.',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero headline (override)',
      type: 'string',
      group: 'hero',
      description: 'Optional — leave blank to use the featured article’s title.',
    }),
    defineField({
      name: 'heroCtaLabel',
      title: 'Hero button label',
      type: 'string',
      group: 'hero',
      description: 'e.g. "Read more".',
    }),
    defineField({
      name: 'heroSideLabels',
      title: 'Hero side labels',
      type: 'array',
      of: [{type: 'string'}],
      group: 'hero',
      description: 'The vertical list on the hero (e.g. Editorial, Culture, Style).',
    }),
    defineField({
      name: 'copyrightLabel',
      title: 'Copyright stamp',
      type: 'string',
      group: 'hero',
      description: 'The small mark on the hero/footer (e.g. "© 2026").',
    }),

    // ── Sections & marquee ─────────────────────────────────────────────────
    defineField({
      name: 'sections',
      title: 'Sections on the home page',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'section'}]}],
      group: 'sections',
      options: {disableNew: true},
      description:
        'Which sections show on the home page, in this order (e.g. Latest, Fashion, Culture, Interviews). ' +
        'Drag to reorder, add or remove. Leave empty to show every section automatically by its Display order.',
    }),
    defineField({
      name: 'marqueeItems',
      title: 'Marquee words / brands',
      type: 'array',
      of: [{type: 'string'}],
      group: 'sections',
      description: 'The scrolling band of words/brands (e.g. Editorial, Off-Pitch, Style…).',
    }),

    // ── SEO ────────────────────────────────────────────────────────────────
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo', group: 'seo'}),
  ],
  preview: {
    prepare() {
      return {title: 'Home page'}
    },
  },
})
