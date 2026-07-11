/** @import { AtomFeed, AtomEntry, Author, JSONFeed, Item, JsonfeedToAtomOptions } from './types.js' */

import { createRequire } from 'node:module'
import generateTitle from './lib/generate-title.js'

const JSON_FEED_VERSION = 'https://jsonfeed.org/version/1.1'
const require = createRequire(import.meta.url)
const packageInfo = /** @type {{ homepage: string, name: string, version: string }} */ (require('./package.json'))

/**
 * Converts a JSON Feed 1.1 document to a serializable Atom feed model.
 *
 * @param {JSONFeed} jsonfeed
 * @param {JsonfeedToAtomOptions} [options]
 * @returns {AtomFeed}
 */
export default function jsonfeedToAtomObject (jsonfeed, options = {}) {
  const feedURLFn = options.feedURLFn ?? defaultFeedURL
  const { title, version, feed_url: feedURL } = jsonfeed

  if (!title) throw new Error('jsonfeed-to-atom: missing title')
  if (version !== JSON_FEED_VERSION) {
    throw new Error('jsonfeed-to-atom: JSON Feed version 1.1 required')
  }
  if (!feedURL) throw new Error('jsonfeed-to-atom: missing feed_url')
  if (!Array.isArray(jsonfeed.items)) throw new Error('jsonfeed-to-atom: missing items')

  const atomFeedURL = feedURLFn(feedURL, jsonfeed)
  const now = new Date()
  const authors = atomAuthors(jsonfeed)

  /** @type {AtomFeed} */
  const atom = {
    id: atomFeedURL,
    title: { value: title, type: 'text' },
    updated: now.toISOString(),
    link: [
      { rel: 'self', type: 'application/atom+xml', href: atomFeedURL },
      { rel: 'alternate', type: 'application/feed+json', href: feedURL }
    ],
    generator: {
      uri: packageInfo.homepage,
      version: packageInfo.version,
      value: packageInfo.name
    }
  }

  if (authors.length > 0) atom.author = authors
  if (jsonfeed.language) atom.language = jsonfeed.language
  if (jsonfeed.home_page_url) {
    atom.link?.push({
      rel: 'alternate',
      type: 'text/html',
      href: jsonfeed.home_page_url
    })
  }
  if (jsonfeed.next_url) {
    atom.link?.push({ rel: 'next', href: feedURLFn(jsonfeed.next_url, jsonfeed) })
  }
  for (const hub of jsonfeed.hubs ?? []) {
    if (hub.type.toLowerCase() === 'websub') {
      atom.link?.push({ rel: 'hub', href: hub.url })
    }
  }

  const icon = jsonfeed.favicon || jsonfeed.icon
  if (icon !== undefined) atom.icon = icon
  if (jsonfeed.icon) atom.logo = jsonfeed.icon
  if (authors[0]?.name) atom.rights = `© ${now.getFullYear()} ${authors[0].name}`
  if (jsonfeed.description) atom.subtitle = jsonfeed.description

  let latestTimestamp = Number.NEGATIVE_INFINITY
  let latestDate
  atom.entry = jsonfeed.items.map(item => {
    const entry = atomEntry(item, jsonfeed, now)

    for (const date of [item.date_published, item.date_modified]) {
      if (!date) continue
      const timestamp = Date.parse(date)
      if (timestamp > latestTimestamp) {
        latestTimestamp = timestamp
        latestDate = date
      }
    }

    return entry
  })

  if (latestDate !== undefined) atom.updated = latestDate
  return atom
}

/**
 * @param {Item} item
 * @param {JSONFeed} jsonfeed
 * @param {Date} now
 * @returns {AtomEntry}
 */
function atomEntry (item, jsonfeed, now) {
  /** @type {AtomEntry} */
  const entry = {
    id: item.id,
    title: { value: generateTitle(item), type: 'text' },
    updated: item.date_modified || item.date_published || now.toISOString(),
    link: []
  }

  if (item.date_published) entry.published = item.date_published

  const authors = atomAuthors(item, jsonfeed)
  if (authors.length > 0) entry.author = authors
  if (item.language) entry.language = item.language

  if (item.content_html !== undefined) {
    entry.content = { type: 'html', value: item.content_html }
  } else if (item.content_text !== undefined) {
    entry.content = { type: 'text', value: item.content_text }
  }

  if (item.url && item.external_url) {
    entry.link?.push({ rel: 'alternate', href: item.external_url })
    entry.link?.push({ rel: 'related', href: item.url })
  } else if (item.url) {
    entry.link?.push({ rel: 'alternate', href: item.url })
  } else if (item.external_url) {
    entry.link?.push({ rel: 'related', href: item.external_url })
  }

  for (const attachment of item.attachments ?? []) {
    const enclosure = {
      rel: 'enclosure',
      type: attachment.mime_type,
      href: attachment.url,
      ...(attachment.title ? { title: attachment.title } : {}),
      ...(Number.isInteger(attachment.size_in_bytes)
        ? { length: attachment.size_in_bytes }
        : {})
    }
    entry.link?.push(enclosure)
  }

  if (item.summary) entry.summary = { type: 'text', value: item.summary }
  if (item.tags) entry.category = item.tags.map(term => ({ term }))

  return entry
}

/**
 * Converts JSON Feed authors to valid Atom person constructs.
 * Atom requires a name, so authors that only contain a URL or avatar are omitted.
 *
 * @param {{ authors?: Author[], author?: Author }} source
 * @param {{ authors?: Author[], author?: Author }} [fallback]
 */
function atomAuthors (source, fallback) {
  const jsonAuthors = Array.isArray(source.authors)
    ? source.authors
    : source.author
      ? [source.author]
      : fallback
        ? Array.isArray(fallback.authors)
          ? fallback.authors
          : fallback.author
            ? [fallback.author]
            : []
        : []

  return jsonAuthors.flatMap(author => author.name
    ? [{
        name: author.name,
        ...(author.url ? { uri: author.url } : {})
      }]
    : [])
}

/**
 * @param {string} feedURL
 */
function defaultFeedURL (feedURL) {
  return feedURL.replace(/\.json\b/, '.xml')
}
