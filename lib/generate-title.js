const striptags = require('striptags')

/**
 *  Generate the required atom title for a JSON feed item
 */
module.exports = function generateTitle (item) {
  // A fairly arbitrary attempt at generating titles.
  // Ideally your JSON feed includes a title for every post. Most UI's will look strange without it
  if (item.title) return item.title
  if (item.summary) return truncate(cleanWhitespace(item.summary))
  if (item.content_text) return truncate(cleanWhitespace(item.content_text))
  if (item.content_html) return truncate(cleanWhitespace(striptags(item.content_html)))
  throw new Error('jsonfeed-to-atom: can\'t generate a title for entry ' + item.id)
}

/**
 * Removes title unfriendly whitespace
 */
function cleanWhitespace (str) {
  return str.split('\n')[0].trim()
}

/**
 * Truncate a string to 100 characters with an ellipsis
 */
function truncate (string) {
  return string.length > 100 ? string.slice(0, 100) + '…' : string
}
