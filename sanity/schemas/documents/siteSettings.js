import {defineType, defineField} from 'sanity'

/**
 * siteSettings — a single (singleton) document for the site-wide chrome that
 * appears on every page: logo, monogram, nav links, social links, the footer
 * (wordmark, contact email + button, copyright) and default SEO. Nothing in the
 * header or footer is hardcoded — the client owns all of it.
 */
export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    {name: 'brand', title: 'Brand', default: true},
    {name: 'nav', title: 'Navigation & social'},
    {name: 'footer', title: 'Footer & contact'},
    {name: 'seo', title: 'SEO defaults'},
  ],
  fields: [
    // ── Brand ──────────────────────────────────────────────────────────────
    defineField({
      name: 'siteTitle',
      title: 'Site title',
      type: 'string',
      group: 'brand',
      description: 'e.g. "Footballer Fits". Used in the browser tab and SEO.',
    }),
    defineField({
      name: 'logo',
      title: 'Nav logo',
      type: 'image',
      group: 'brand',
      description: 'The logo in the centre of the top navigation.',
    }),
    defineField({
      name: 'wordmark',
      title: 'Footer wordmark',
      type: 'image',
      group: 'brand',
      description: 'The large wordmark image in the footer.',
    }),
    defineField({
      name: 'monogram',
      title: 'Monogram',
      type: 'string',
      group: 'brand',
      description: 'The short mark used in stamps (e.g. "FF").',
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      group: 'brand',
      description: 'Optional browser-tab icon.',
    }),

    // ── Navigation & social ────────────────────────────────────────────────
    defineField({
      name: 'navLinks',
      title: 'Navigation links',
      type: 'array',
      of: [{type: 'navItem'}],
      group: 'nav',
      description: 'The menu items (Home, Fashion, Lifestyle, Entertainment…).',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      of: [{type: 'socialLink'}],
      group: 'nav',
      description: 'The social icons in the nav, menu and footer.',
    }),

    // ── Footer & contact ───────────────────────────────────────────────────
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      group: 'footer',
      description: 'The email shown in the footer (e.g. sayhi@footballerfits.co.uk).',
    }),
    defineField({
      name: 'contactCtaLabel',
      title: 'Contact button label',
      type: 'string',
      group: 'footer',
      description: 'e.g. "Contact Now".',
    }),
    defineField({
      name: 'contactCtaUrl',
      title: 'Contact button link',
      type: 'url',
      group: 'footer',
      description: 'Optional — where the contact button points (defaults to the email).',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https', 'mailto']}),
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright text',
      type: 'string',
      group: 'footer',
      description: 'e.g. "© 2026".',
    }),

    // ── SEO defaults ───────────────────────────────────────────────────────
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'seo',
      group: 'seo',
      description: 'Fallback title / description / share image for the whole site.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site settings'}
    },
  },
})
