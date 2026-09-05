import {defineType, defineField} from 'sanity'

/**
 * category — a TAG attached to articles (Music, Drops, News, Features…). Just a
 * label: no layout, no design, no section page. Sections (Fashion, Culture,
 * Interviews, Latest) own the page designs; categories are only the tags shown
 * on article cards. An article can carry several.
 */
export default defineType({
  name: 'category',
  title: 'Category (tag)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'The tag label shown on article cards, e.g. Music, Drops, News, Features.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      description: 'A URL-safe id for this tag. Click “Generate” from the name.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'slug.current'},
  },
})
