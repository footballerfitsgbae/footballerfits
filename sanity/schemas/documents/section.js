import {defineType, defineField} from 'sanity'

/**
 * section — a top-level part of the site (Fashion, Lifestyle, Entertainment).
 * Holds every editable string and image for both where the section appears on
 * the home page (its heading block) AND its own dedicated page (hero cover,
 * intro copy, the spotlight article at the top). The client can add a whole new
 * section, rename it, re-order it, and repoint its cover without a developer.
 */
export default defineType({
  name: 'section',
  title: 'Section',
  type: 'document',
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'home', title: 'On the home page'},
    {name: 'page', title: 'Section page'},
    {name: 'content', title: 'Articles'},
  ],
  fields: [
    // ── Basics ─────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      group: 'basics',
      description: 'e.g. Fashion, Lifestyle, Entertainment.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basics',
      options: {source: 'title', maxLength: 96},
      description: 'Used in the URL (e.g. /fashion).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      group: 'basics',
      description: 'Controls the order sections appear in nav and on the home page.',
    }),
    defineField({
      name: 'shortLabel',
      title: 'Short label',
      type: 'string',
      group: 'basics',
      description: 'Tiny descriptor used on “keep exploring” cards (e.g. "Kits, collabs & drip").',
    }),
    defineField({
      name: 'theme',
      title: 'Colour theme',
      type: 'string',
      group: 'basics',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'light',
      description: 'Whether this section renders on a light or dark background.',
    }),

    // ── On the home page ───────────────────────────────────────────────────
    defineField({
      name: 'homeEyebrow',
      title: 'Home heading — eyebrow',
      type: 'string',
      group: 'home',
      description: 'Small label above the section title on the home page (e.g. "Latest Stories").',
    }),
    defineField({
      name: 'homeMeta',
      title: 'Home heading — meta',
      type: 'string',
      group: 'home',
      description: 'Small note beside the title on the home page (e.g. "Updated weekly").',
    }),

    // ── Section page ───────────────────────────────────────────────────────
    defineField({
      name: 'heroCover',
      title: 'Hero background image (auto-pulled from article if blank)',
      type: 'imageGallery',
      group: 'page',
      description:
        'Optional. Leave blank and the section hero uses the hero article’s image automatically. Set an image here only to override that backdrop.',
    }),
    defineField({
      name: 'heroTag',
      title: 'Section hero — tag',
      type: 'string',
      group: 'page',
      description: 'Label over the section hero (e.g. "Latest in Fashion").',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Section hero — headline',
      type: 'string',
      group: 'page',
      description:
        'Headline over the cover. Leave blank to use the spotlight article’s title.',
    }),
    defineField({
      name: 'spotlightPost',
      title: 'Hero article (defaults to latest — override here)',
      type: 'reference',
      to: [{type: 'post'}],
      group: 'page',
      description:
        'Leave blank and the section hero automatically shows the latest published article in this category. Pick an article here to feature a different one instead.',
    }),
    defineField({
      name: 'introTitle',
      title: 'Intro — title',
      type: 'string',
      group: 'page',
      description: 'The big line under the hero (e.g. "Worth getting dressed for.").',
    }),
    defineField({
      name: 'introCopy',
      title: 'Intro — copy',
      type: 'text',
      rows: 3,
      group: 'page',
      description: 'The supporting sentence under the intro title.',
    }),

    // ── Articles ───────────────────────────────────────────────────────────
    defineField({
      name: 'category',
      title: 'Pull articles from category',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'content',
      description: 'Optional — auto-fill this section with articles from a category.',
    }),
    defineField({
      name: 'featuredPosts',
      title: 'Hand-picked articles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'post'}]}],
      group: 'content',
      description: 'Optional — curate the exact articles (and order) shown in this section.',
    }),
  ],
  orderings: [
    {title: 'Display order', name: 'order', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', subtitle: 'shortLabel', media: 'heroCover.images.0'},
  },
})
