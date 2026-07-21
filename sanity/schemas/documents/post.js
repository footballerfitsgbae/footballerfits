import {defineType, defineField} from 'sanity'

/**
 * post — an article / blog post. Covers every field the current site reads off a
 * story: card title, category tag, cover image, excerpt, standfirst, the full
 * mixed words-and-photos body, author byline, publish date and read time, plus
 * the layout hints (ratio, featured) the components use. Every image field that
 * can hold more than one photo is an array, and every link is optional.
 */
export default defineType({
  name: 'post',
  title: 'Article',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media', title: 'Media'},
    {name: 'meta', title: 'Details'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'The headline shown on cards and at the top of the article.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      description: 'The URL for this article. Generate it from the title.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'content',
      description: 'The tag shown on the card (e.g. Culture, Style).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Short summary shown on article cards and previews.',
    }),
    defineField({
      name: 'standfirst',
      title: 'Standfirst / intro',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'The larger intro line under the headline on the article page.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
      description: 'The article itself — mix paragraphs, images, galleries and embeds.',
    }),

    // ── Media ──────────────────────────────────────────────────────────────
    defineField({
      name: 'heroImage',
      title: 'Hero / cover image',
      type: 'figureImage',
      group: 'media',
      description: 'The main image — used as the card image and the article hero.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Additional images',
      type: 'imageGallery',
      group: 'media',
      description: 'Optional extra images for this story (one or many).',
    }),

    // ── Details ────────────────────────────────────────────────────────────
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      group: 'meta',
      description: 'Optional byline.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published date & time',
      type: 'datetime',
      group: 'meta',
      description: 'Drives the live "X hours ago" label and ordering.',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'readMinutes',
      title: 'Read time (minutes)',
      type: 'number',
      group: 'meta',
      description: 'e.g. 5 → "5 min read".',
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'meta',
      description: 'Highlight this story (e.g. eligible for the home hero).',
      initialValue: false,
    }),
    defineField({
      name: 'ratio',
      title: 'Card shape',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          {title: 'Portrait', value: 'portrait'},
          {title: 'Tall', value: 'tall'},
        ],
        layout: 'radio',
      },
      description: 'Optional layout hint for how the card image is cropped.',
      initialValue: 'portrait',
    }),
    defineField({
      name: 'externalLink',
      title: 'External link',
      type: 'url',
      group: 'meta',
      description: 'Optional — if this card should link out instead of to the article.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),

    // ── SEO ────────────────────────────────────────────────────────────────
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo', group: 'seo'}),
  ],
  orderings: [
    {
      title: 'Published, newest first',
      name: 'publishedDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', category: 'category.title', media: 'heroImage.image', date: 'publishedAt'},
    prepare({title, category, media, date}) {
      const when = date ? new Date(date).toLocaleDateString() : 'No date'
      return {title, subtitle: [category, when].filter(Boolean).join(' · '), media}
    },
  },
})
