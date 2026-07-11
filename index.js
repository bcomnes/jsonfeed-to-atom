/** @import { AtomFeed, AtomEntry, JSONFeed, JsonfeedToAtomOptions } from './types.js' */
/** @import { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js' */

import { create } from 'xmlbuilder2'
import jsonfeedToAtomObject from './jsonfeed-to-atom-object.js'

/**
 * Converts a parsed JSON Feed 1.1 object into an Atom XML document.
 *
 * @param {JSONFeed} jsonfeed
 * @param {JsonfeedToAtomOptions} [options]
 * @returns {string}
 */
export default function jsonfeedToAtom (jsonfeed, options) {
  return serializeAtom(jsonfeedToAtomObject(jsonfeed, options))
}

/**
 * @param {AtomFeed} atom
 * @returns {string}
 */
function serializeAtom (atom) {
  const doc = create({
    version: '1.0',
    encoding: 'utf-8',
    invalidCharReplacement: ''
  })
  const feed = doc.ele('http://www.w3.org/2005/Atom', 'feed')

  if (atom.language) feed.att('xml:lang', atom.language)
  addText(feed, 'title', atom.title.value)
  addText(feed, 'id', atom.id)
  addText(feed, 'updated', atom.updated)
  for (const link of atom.link ?? []) addLink(feed, link)
  for (const author of atom.author ?? []) addAuthor(feed, author)

  if (atom.generator) {
    const generator = feed.ele('generator')
    if (atom.generator.uri) generator.att('uri', atom.generator.uri)
    if (atom.generator.version) generator.att('version', atom.generator.version)
    if (atom.generator.value) generator.txt(atom.generator.value)
  }
  if (atom.icon) addText(feed, 'icon', atom.icon)
  if (atom.logo) addText(feed, 'logo', atom.logo)
  if (atom.rights) addText(feed, 'rights', atom.rights)
  if (atom.subtitle) addText(feed, 'subtitle', atom.subtitle)

  for (const entry of atom.entry ?? []) addEntry(feed, entry)
  return doc.end({ prettyPrint: true })
}

/**
 * @param {XMLBuilder} parent
 * @param {AtomEntry} entry
 */
function addEntry (parent, entry) {
  const element = parent.ele('entry')
  if (entry.language) element.att('xml:lang', entry.language)
  addText(element, 'id', entry.id)
  addText(element, 'title', entry.title.value)
  addText(element, 'updated', entry.updated)
  if (entry.published) addText(element, 'published', entry.published)
  for (const author of entry.author ?? []) addAuthor(element, author)

  if (entry.content) {
    const content = element.ele('content')
    if (entry.content.type) content.att('type', entry.content.type)
    if (entry.content.src) content.att('src', entry.content.src)
    if (entry.content.value !== undefined) {
      if (entry.content.type === 'html') content.dat(entry.content.value)
      else content.txt(entry.content.value)
    }
  }

  for (const link of entry.link ?? []) addLink(element, link)
  if (entry.summary?.value !== undefined) {
    const summary = element.ele('summary')
    if (entry.summary.type) summary.att('type', entry.summary.type)
    summary.txt(entry.summary.value)
  }
  for (const category of entry.category ?? []) {
    const categoryElement = parentElement(element, 'category', { term: category.term })
    if (category.scheme) categoryElement.att('scheme', category.scheme)
    if (category.label) categoryElement.att('label', category.label)
  }
}

/**
 * @param {XMLBuilder} parent
 * @param {{ name: string, email?: string, uri?: string }} author
 */
function addAuthor (parent, author) {
  const element = parent.ele('author')
  addText(element, 'name', author.name)
  if (author.email) addText(element, 'email', author.email)
  if (author.uri) addText(element, 'uri', author.uri)
}

/**
 * @param {XMLBuilder} parent
 * @param {{ href: string, rel?: string, type?: string, hreflang?: string, title?: string, length?: number }} link
 */
function addLink (parent, link) {
  parentElement(parent, 'link', {
    href: link.href,
    rel: link.rel,
    type: link.type,
    hreflang: link.hreflang,
    title: link.title,
    length: link.length
  })
}

/**
 * @param {XMLBuilder} parent
 * @param {string} name
 * @param {string} value
 */
function addText (parent, name, value) {
  parent.ele(name).txt(value)
}

/**
 * @param {XMLBuilder} parent
 * @param {string} name
 * @param {Record<string, string | number | undefined>} attributes
 */
function parentElement (parent, name, attributes) {
  const element = parent.ele(name)
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) element.att(key, String(value))
  }
  return element
}
