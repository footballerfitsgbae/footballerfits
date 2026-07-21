import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * imageGallery — a group of images (1 to many). Renders gracefully whether it
 * holds a single image or several, so the client can drop in as many photos as
 * a story needs. Every image field on the site that can hold more than one photo
 * uses this so nothing is ever limited to a single hardcoded picture.
 */
export default defineType({
  name: 'imageGallery',
  title: 'Image gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      description: 'Add one or more images. They tile neatly however many you add.',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', title: 'Alt text', type: 'string'}),
            defineField({name: 'caption', title: 'Caption', type: 'string'}),
          ],
        }),
      ],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'caption',
      title: 'Gallery caption',
      type: 'string',
      description: 'Optional caption shown under the whole gallery.',
    }),
  ],
  preview: {
    select: {images: 'images', caption: 'caption'},
    prepare({images = [], caption}) {
      return {
        title: caption || 'Image gallery',
        subtitle: `${images.length} image${images.length === 1 ? '' : 's'}`,
        media: images[0],
      }
    },
  },
})
