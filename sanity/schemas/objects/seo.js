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
      description: 'Overrides the browser tab / search title. Falls back to the page title.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 2,
      description: 'The blurb shown in search results and link previews.',
    }),
    defineField({
      name: 'shareImage',
      title: 'Share image',
      type: 'image',
      description: 'Optional image used when the page is shared on social media.',
    }),
  ],
})
