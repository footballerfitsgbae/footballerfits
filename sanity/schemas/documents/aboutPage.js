import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * aboutPage — the About / mission page (singleton). A big statement, some body
 * paragraphs, the "what we cover" columns, and the call-to-action label.
 */
export default defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Small label above the statement (e.g. "About").',
    }),
    defineField({
      name: 'statement',
      title: 'Statement headline',
      type: 'text',
      rows: 3,
      description: 'The big opening line.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lead',
      title: 'Lead paragraph',
      type: 'text',
      rows: 3,
      description: 'The larger first paragraph of the body.',
    }),
    defineField({
      name: 'paragraphs',
      title: 'Body paragraphs',
      type: 'array',
      of: [{type: 'text', rows: 4}],
      description: 'The paragraphs after the lead.',
    }),
    defineField({
      name: 'columns',
      title: '"What we cover" columns',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        }),
      ],
    }),
    defineField({
      name: 'ctaLabel',
      title: 'Call-to-action label',
      type: 'string',
      description: 'The button that links to Contact (e.g. "Get in touch").',
    }),
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'About page'})},
})
