import {defineType, defineField} from 'sanity'

/**
 * socialLink — one social profile link (used in the nav bar, menu and footer).
 * The URL is optional so a platform can be listed even before its link is ready.
 */
export default defineType({
  name: 'socialLink',
  title: 'Social link',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          {title: 'X (Twitter)', value: 'x'},
          {title: 'Instagram', value: 'instagram'},
          {title: 'TikTok', value: 'tiktok'},
          {title: 'Snapchat', value: 'snapchat'},
          {title: 'YouTube', value: 'youtube'},
          {title: 'Facebook', value: 'facebook'},
          {title: 'Threads', value: 'threads'},
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Optional — leave blank until the profile link is ready.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {title: 'platform', subtitle: 'url'},
  },
})
