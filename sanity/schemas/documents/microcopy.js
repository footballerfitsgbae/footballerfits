import {defineType, defineField} from 'sanity'

/**
 * microcopy — a single (singleton) document for the small, repeated interface
 * strings that aren't tied to one article or section: button labels, the
 * "keep exploring" / "read next" headings, breadcrumb text, etc. This exists so
 * that literally every visible word on the site is editable by the client.
 *
 * Where a value describes many sections it can include the placeholder {section}
 * — the site swaps in the section name (e.g. "See all {section}" → "See all Fashion").
 */
export default defineType({
  name: 'microcopy',
  title: 'Labels & microcopy',
  type: 'document',
  groups: [
    {name: 'buttons', title: 'Buttons', default: true},
    {name: 'article', title: 'Article page'},
    {name: 'cross', title: 'Cross-section & read next'},
  ],
  fields: [
    // ── Buttons / common ───────────────────────────────────────────────────
    defineField({
      name: 'seeMoreLabel',
      title: '“See More” label',
      type: 'string',
      group: 'buttons',
      description: 'Button under each home section (default: "See More").',
    }),
    defineField({
      name: 'readMoreLabel',
      title: '“Read more” label',
      type: 'string',
      group: 'buttons',
      description: 'Hero / cover read button (default: "Read more").',
    }),
    defineField({
      name: 'seeAllTemplate',
      title: '“See all …” template',
      type: 'string',
      group: 'buttons',
      description: 'Uses {section}. Default: "See all {section}".',
    }),
    defineField({
      name: 'latestArticleLabel',
      title: 'Home hero tag',
      type: 'string',
      group: 'buttons',
      description: 'Default: "Latest Article".',
    }),
    defineField({
      name: 'homeBreadcrumbLabel',
      title: 'Breadcrumb “Home” label',
      type: 'string',
      group: 'buttons',
      description: 'The first breadcrumb crumb (default: "Home").',
    }),

    // ── Article page ───────────────────────────────────────────────────────
    defineField({
      name: 'bylinePrefix',
      title: 'Byline prefix',
      type: 'string',
      group: 'article',
      description: 'Before the author name (default: "By").',
    }),
    defineField({
      name: 'readTimeSuffix',
      title: 'Read-time suffix',
      type: 'string',
      group: 'article',
      description: 'Default: "min read".',
    }),

    // ── Cross-section & read next ──────────────────────────────────────────
    defineField({
      name: 'sectionLatestPrefix',
      title: 'Section hero tag prefix',
      type: 'string',
      group: 'cross',
      description: 'Before the section name on its hero (default: "Latest in").',
    }),
    defineField({
      name: 'crossEyebrow',
      title: 'Cross-section eyebrow',
      type: 'string',
      group: 'cross',
      description: 'Default: "Keep going".',
    }),
    defineField({
      name: 'crossHeadingTemplate',
      title: 'Cross-section heading',
      type: 'string',
      group: 'cross',
      description: 'Uses {section}. Default: "There’s more to the fit than {section}."',
    }),
    defineField({
      name: 'crossReelTagPrefix',
      title: 'Cross-section reel tag prefix',
      type: 'string',
      group: 'cross',
      description: 'Before the reel section name (default: "From").',
    }),
    defineField({
      name: 'crossPairTagPrefix',
      title: 'Cross-section pair tag prefix',
      type: 'string',
      group: 'cross',
      description: 'Before the pair section name (default: "Also in").',
    }),
    defineField({
      name: 'crossPairTitle',
      title: 'Cross-section pair title',
      type: 'string',
      group: 'cross',
      description: 'Default: "Two you shouldn’t miss".',
    }),
    defineField({
      name: 'readNextEyebrow',
      title: 'Read-next eyebrow',
      type: 'string',
      group: 'cross',
      description: 'Default: "Keep reading".',
    }),
    defineField({
      name: 'readNextTitleTemplate',
      title: 'Read-next title',
      type: 'string',
      group: 'cross',
      description: 'Uses {section}. Default: "More in {section}".',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Labels & microcopy'}
    },
  },
})
