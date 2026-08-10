/**
 * Sanity schema registry for Footballer Fits.
 *
 * Import this array into your Sanity config:
 *
 *   import {schemaTypes} from './sanity/schemas'
 *   export default defineConfig({
 *     // ...
 *     schema: {types: schemaTypes},
 *   })
 *
 * Singletons (create exactly one of each): siteSettings, homePage, microcopy.
 * Collections (create many): post, category, author, section.
 */

// Documents
import post from './documents/post'
import category from './documents/category'
import author from './documents/author'
import section from './documents/section'
import homePage from './documents/homePage'
import siteSettings from './documents/siteSettings'
import microcopy from './documents/microcopy'
import aboutPage from './documents/aboutPage'
import contactPage from './documents/contactPage'
import legalPage from './documents/legalPage'

// Objects (reusable field groups)
import blockContent from './objects/blockContent'
import figureImage from './objects/figureImage'
import imageGallery from './objects/imageGallery'
import socialEmbed from './objects/socialEmbed'
import navItem from './objects/navItem'
import socialLink from './objects/socialLink'
import seo from './objects/seo'
import legalSection from './objects/legalSection'

export const schemaTypes = [
  // Documents
  post,
  category,
  author,
  section,
  homePage,
  siteSettings,
  microcopy,
  aboutPage,
  contactPage,
  legalPage,
  // Objects
  blockContent,
  figureImage,
  imageGallery,
  socialEmbed,
  navItem,
  socialLink,
  seo,
  legalSection,
]

export default schemaTypes
