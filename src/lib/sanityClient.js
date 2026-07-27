import { createClient } from '@sanity/client'

/**
 * Sanity client for the Footballer Fits site.
 *
 * `useCdn: true` serves content from Sanity's edge cache, which is what we want
 * for a public, read-only site: fast and cheap. Published content only.
 */
export const sanityClient = createClient({
  projectId: 'b5jktpaj',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
  perspective: 'published',
})

export default sanityClient
