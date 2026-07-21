import {defineType, defineField} from 'sanity'

/**
 * navItem — one entry in the primary navigation / footer menu.
 * Can point at the home page, one of the site sections, or any external URL.
 * The client can rename labels and re-point links without a developer.
 */
export default defineType({
  name: 'navItem',
  title: 'Navigation item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'The text shown in the menu (e.g. "Home", "Fashion").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetType',
      title: 'Links to',
      type: 'string',
      options: {
        list: [
          {title: 'Home page', value: 'home'},
          {title: 'A section', value: 'section'},
          {title: 'External URL', value: 'external'},
        ],
        layout: 'radio',
      },
      initialValue: 'section',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'reference',
      to: [{type: 'section'}],
      description: 'Which section this links to.',
      hidden: ({parent}) => parent?.targetType !== 'section',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Optional external link.',
      hidden: ({parent}) => parent?.targetType !== 'external',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {title: 'label', targetType: 'targetType', section: 'section.title', url: 'externalUrl'},
    prepare({title, targetType, section, url}) {
      const subtitle =
        targetType === 'home' ? 'Home page' : targetType === 'section' ? section : url
      return {title, subtitle}
    },
  },
})
