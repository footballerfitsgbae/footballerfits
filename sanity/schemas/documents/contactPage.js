import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * contactPage — the Contact page (singleton). Heading + intro, then the enquiry
 * rows (each a label, blurb and email). The social icons come from Site settings.
 */
export default defineType({
  name: 'contactPage',
  title: 'Contact page',
  type: 'document',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Small label above the title (e.g. "Contact").',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "Get in touch".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lead',
      title: 'Intro',
      type: 'text',
      rows: 2,
      description: 'The line under the title.',
    }),
    defineField({
      name: 'rows',
      title: 'Enquiry rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. "General", "Editorial & Press".'}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
            defineField({name: 'email', title: 'Email', type: 'string'}),
          ],
          preview: {select: {title: 'label', subtitle: 'email'}},
        }),
      ],
    }),
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Contact page'})},
})
