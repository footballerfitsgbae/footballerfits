import {defineType, defineField} from 'sanity'

/**
 * seo — optional search / social sharing overrides. Attach to any page or post
 * so the client controls how a URL looks when shared and in search results.
 */
export default defineType({
  name: 'seo',
  title: 'SEO & sharing',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'Leave blank to auto-generate from the title and excerpt.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 2,
      description: 'Leave blank to auto-generate from the title and excerpt.',
    }),
    defineField({
      name: 'shareImage',
      title: 'Share image',
      type: 'image',
      description: 'Leave blank to auto-generate from the title and excerpt. Share image: 1200x630 recommended.',
    }),
  ],
})
