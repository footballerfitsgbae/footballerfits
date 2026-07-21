import {defineType, defineField} from 'sanity'

/**
 * figureImage — a single image with alt text and an optional caption.
 * Used for standalone images inside article body content and anywhere a single
 * picture (with a caption) is needed.
 */
export default defineType({
  name: 'figureImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true}, // lets the client choose the focal point / crop
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the image for screen readers and SEO.',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption shown under the image.',
    }),
  ],
  preview: {
    select: {media: 'image', title: 'caption', subtitle: 'alt'},
    prepare({media, title, subtitle}) {
      return {media, title: title || 'Image', subtitle}
    },
  },
})
