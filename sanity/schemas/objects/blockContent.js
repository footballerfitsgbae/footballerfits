import {defineType, defineArrayMember} from 'sanity'

/**
 * blockContent — the rich body of an article. A composable, Portable-Text array
 * that mixes words and media exactly like the current article page: paragraphs,
 * headings, quotes, single images, multi-image galleries and social embeds, in
 * any order. Add or remove any block freely — the layout never breaks or looks
 * empty, so a story can be all text, all photos, or any mix.
 */
export default defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    // Text: paragraphs, headings, quotes, lists, and inline links.
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading', value: 'h2'},
        {title: 'Subheading', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              {
                name: 'href',
                title: 'URL',
                type: 'url',
                // Optional — links are never required.
                validation: (Rule) =>
                  Rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
              },
              {
                name: 'openInNewTab',
                title: 'Open in new tab',
                type: 'boolean',
                initialValue: true,
              },
            ],
          },
        ],
      },
    }),
    // A single image.
    defineArrayMember({type: 'figureImage'}),
    // One-to-many images tiled together.
    defineArrayMember({type: 'imageGallery'}),
    // An embedded social post.
    defineArrayMember({type: 'socialEmbed'}),
  ],
})
