
/**
 * Converts a parsed JSON feed to an atom feed document
 * @module jsonfeed-to-atom
 */
/* eslint-enable require-jsdoc valid-jsdoc */
/* eslint valid-jsdoc: "error" */
/* eslint require-jsdoc: "error" */

const builder = require('xmlbuilder')
const jsonfeedToAtomObject = require('./jsonfeed-to-atom-object')

/**
 * A number, or a string containing a number.
 * @typedef {Object} jsonFeed
 * @property {string} version - Required JSON feed version
 * @property {string} title - Required title of the feed
 * @property {Object[]} [items=[]] - The array of JSON feed items
 */

/**
 * Convert a parsed JSON feed object into an atom xml document
 * @param {jsonFeed} jsonfeed The parsed JSON feed object
 * @returns {string} The atom xml document derived from the JSON feed
 */
module.exports = function jsonfeedToAtom (jsonfeed) {
  const feedObj = jsonfeedToAtomObject(jsonfeed)
  const feed = builder.create(feedObj, { encoding: 'utf-8' })
  return feed.end({ pretty: true })
}
