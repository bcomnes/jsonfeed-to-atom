
/**
 * Converts a parsed JSON feed to an atom feed document
 * @module jsonfeed-to-atom
 */

const builder = require('xmlbuilder')
const jsonfeedToAtomObject = require('./jsonfeed-to-atom-object')

/**
 * Convert a parsed JSON feed object into an atom xml document
 */
module.exports = function jsonfeedToAtom (jsonfeed) {
  const feedObj = jsonfeedToAtomObject(jsonfeed)
  const feed = builder.create(feedObj, { encoding: 'utf-8' })
  return feed.end({ pretty: true })
}
