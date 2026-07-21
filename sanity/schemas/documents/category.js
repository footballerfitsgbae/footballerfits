import {defineType, defineField} from 'sanity'

/**
 * category — the tag shown on every article card (Culture, Editorial, Style,
 * Archive… in the current site). A standalone document so the client can add,
 * rename or remove categories at will without touching code.
 */
export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'e.g. Culture, Editorial, Style, Archive.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      description: 'Used in the URL. Click “Generate” from the name.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Optional short description of what belongs in this category.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'figureImage',
      description: 'Optional image used when the category is featured.',
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first where categories are listed.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description', media: 'coverImage.image'},
  },
})
