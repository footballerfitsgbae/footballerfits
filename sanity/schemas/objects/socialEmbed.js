import {defineType, defineField} from 'sanity'

/**
 * socialEmbed — an embedded social post (Instagram, X, TikTok, YouTube).
 * Matches the Instagram embed already used inside article bodies. The URL is the
 * only thing the client pastes in; the site renders the preview from it.
 */
export default defineType({
  name: 'socialEmbed',
  title: 'Social embed',
  type: 'object',
  fields: [
    defineField({
      name: 'provider',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          {title: 'Instagram', value: 'instagram'},
          {title: 'X (Twitter)', value: 'twitter'},
          {title: 'TikTok', value: 'tiktok'},
          {title: 'YouTube', value: 'youtube'},
        ],
        layout: 'radio',
      },
      initialValue: 'instagram',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Post URL',
      type: 'url',
      description: 'Paste the full link to the post (e.g. an Instagram post URL).',
      validation: (Rule) => Rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption shown under the embed.',
    }),
  ],
  preview: {
    select: {provider: 'provider', url: 'url', caption: 'caption'},
    prepare({provider, url, caption}) {
      return {title: caption || `${provider} embed`, subtitle: url}
    },
  },
})
