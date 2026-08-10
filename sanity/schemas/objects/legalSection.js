import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * legalSection — one titled section of a legal page (Privacy / Terms).
 * Its body is a list of paragraphs and bullet lists, in any order, so the client
 * can write a section exactly like a document.
 */
export default defineType({
  name: 'legalSection',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Section heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Section body',
      type: 'array',
      description: 'Add paragraphs and bullet lists in the order they should read.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'legalText',
          title: 'Paragraph',
          fields: [defineField({name: 'text', title: 'Text', type: 'text', rows: 4})],
          preview: {select: {title: 'text'}, prepare: ({title}) => ({title: title || 'Paragraph'})},
        }),
        defineArrayMember({
          type: 'object',
          name: 'legalBullets',
          title: 'Bullet list',
          fields: [
            defineField({name: 'items', title: 'Items', type: 'array', of: [{type: 'string'}]}),
          ],
          preview: {
            select: {items: 'items'},
            prepare: ({items = []}) => ({title: `Bullet list (${items.length})`, subtitle: items[0]}),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading', body: 'body'},
    prepare: ({title, body = []}) => ({title, subtitle: `${body.length} block${body.length === 1 ? '' : 's'}`}),
  },
})
