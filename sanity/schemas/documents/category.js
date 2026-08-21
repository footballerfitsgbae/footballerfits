import {defineType, defineField} from 'sanity'

/**
 * category — the tag shown on every article card (Culture, Editorial, Style,
 * Archive… in the current site). A standalone document so the client can add,
 * rename or remove categories at will without touching code.
 */
export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'e.g. Culture, Editorial, Style, Archive.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      description: 'Used in the URL. Click “Generate” from the name.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'layoutStyle',
      title: 'Layout style',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {
            title: 'Fashion — light editorial grid · best with 7+ articles (1 hero + 6 grid)',
            value: 'fashion',
          },
          {
            title: 'Lifestyle — dark card grid + marquee · best with 9+ articles (1 hero + 8 grid)',
            value: 'lifestyle',
          },
          {
            title: 'Entertainment — light parallax columns · best with 9+ articles (1 hero + 8 grid)',
            value: 'entertainment',
          },
        ],
      },
      // Studio pre-selects Fashion for new categories; the site also treats an
      // empty value as Fashion, so a page always has a valid design.
      initialValue: 'fashion',
      description:
        'Which bespoke section-page design this category uses on the site.\n' +
        '• Fashion — a light editorial grid. Works best with at least 7 articles (1 hero + 6 in the grid).\n' +
        '• Lifestyle — a dark card grid with a scrolling marquee. Works best with at least 9 articles (1 hero + 8 in the grid).\n' +
        '• Entertainment — light parallax columns. Works best with at least 9 articles (1 hero + 8 in the grid).\n' +
        'Defaults to Fashion if left unset.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Optional short description of what belongs in this category.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'figureImage',
      description: 'Optional image used when the category is featured.',
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first where categories are listed.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description', media: 'coverImage.image'},
  },
})
