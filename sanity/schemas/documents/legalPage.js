import {defineType, defineField} from 'sanity'

/**
 * legalPage — a legal document page. There are exactly two: Terms & Conditions
 * and Privacy Policy (fixed ids `legal-terms` and `legal-privacy`, pinned in the
 * Studio structure). Same shape for both: a title, a "last updated" date, an
 * intro line, then titled sections of paragraphs and bullet lists.
 */
export default defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "Privacy Policy" or "Terms & Conditions".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'string',
      description: 'Shown under the title, e.g. "22 July 2026".',
    }),
    defineField({
      name: 'lead',
      title: 'Intro',
      type: 'text',
      rows: 3,
      description: 'The short paragraph under the title.',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [{type: 'legalSection'}],
    }),
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo'}),
  ],
  preview: {
    select: {title: 'title', sections: 'sections'},
    prepare: ({title, sections = []}) => ({title, subtitle: `${sections.length} sections`}),
  },
})
