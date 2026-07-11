/** @import { Item } from './json-feed-types.js' */

import striptags from 'striptags'

/**
 * Generates the required Atom title for a JSON Feed item.
 *
 * @param {Item} item
 * @returns {string}
 */
export default function generateTitle (item) {
  if (item.title) return item.title
  if (item.summary) return truncate(cleanWhitespace(item.summary))
  if (item.content_text) return truncate(cleanWhitespace(item.content_text))
  if (item.content_html) return truncate(cleanWhitespace(striptags(item.content_html)))
  throw new Error(`jsonfeed-to-atom: can't generate a title for entry ${item.id}`)
}

/**
 * @param {string} string
 */
function cleanWhitespace (string) {
  return string.split('\n')[0]?.trim() ?? ''
}

/**
 * @param {string} string
 */
function truncate (string) {
  return string.length > 100 ? `${string.slice(0, 100)}…` : string
}
