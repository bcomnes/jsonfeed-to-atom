/** @import { AtomFeed, AtomEntry, AtomPerson, Author, JSONFeed, Item, JsonfeedToAtomOptions } from './types.js' */

import { createRequire } from 'node:module'
import generateTitle from './lib/generate-title.js'

const JSON_FEED_VERSION = 'https://jsonfeed.org/version/1.1'
const ATOM_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-])(\d{2}):(\d{2}))$/
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

  assertAbsoluteIRI(feedURL, 'feed_url')

  const atomFeedURL = feedURLFn(feedURL, jsonfeed)
  assertAbsoluteIRI(atomFeedURL, 'mapped feed URL')
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

  if (authors.length > 0) atom.author = /** @type {[AtomPerson, ...AtomPerson[]]} */ (authors)
  if (jsonfeed.language) atom.language = jsonfeed.language
  if (jsonfeed.home_page_url) {
    atom.link?.push({
      rel: 'alternate',
      type: 'text/html',
      href: jsonfeed.home_page_url
    })
  }
  if (jsonfeed.next_url) {
    const nextURL = feedURLFn(jsonfeed.next_url, jsonfeed)
    assertAbsoluteIRI(nextURL, 'mapped next_url')
    atom.link?.push({ rel: 'next', href: nextURL })
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

  atom.entry = jsonfeed.items.map(item => atomEntry(item, jsonfeed, now))

  if (authors.length === 0 && atom.entry.some(entry => !entry.author?.length)) {
    throw new Error('jsonfeed-to-atom: Atom requires a named feed author or named authors on every item')
  }

  const [firstEntry, ...remainingEntries] = atom.entry
  if (firstEntry) {
    atom.updated = remainingEntries.reduce((latest, entry) => (
      Date.parse(entry.updated) > Date.parse(latest) ? entry.updated : latest
    ), firstEntry.updated)
  }
  return atom
}

/**
 * @param {Item} item
 * @param {JSONFeed} jsonfeed
 * @param {Date} now
 * @returns {AtomEntry}
 */
function atomEntry (item, jsonfeed, now) {
  const published = item.date_published
    ? atomDate(item.date_published, 'date_published')
    : undefined
  const updated = item.date_modified
    ? atomDate(item.date_modified, 'date_modified')
    : published ?? now.toISOString()

  /** @type {AtomEntry} */
  const entry = {
    id: atomID(item.id, jsonfeed.feed_url),
    title: { value: generateTitle(item), type: 'text' },
    updated,
    link: []
  }

  if (published) entry.published = published

  const authors = atomAuthors(item, jsonfeed)
  if (authors.length > 0) entry.author = /** @type {[AtomPerson, ...AtomPerson[]]} */ (authors)
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

/**
 * Preserves absolute JSON Feed item IDs and scopes arbitrary string IDs to the feed URL.
 *
 * @param {string} itemID
 * @param {string} feedURL
 * @returns {string}
 */
function atomID (itemID, feedURL) {
  try {
    // eslint-disable-next-line no-new
    new URL(itemID)
    return itemID
  } catch {
    const id = new URL(feedURL)
    id.hash = `jsonfeed-id=${encodeURIComponent(itemID)}`
    return id.href
  }
}

/**
 * Normalizes a JSON Feed ISO 8601 date to the RFC 3339 form required by Atom.
 *
 * @param {string} value
 * @param {string} field
 * @returns {string}
 */
function atomDate (value, field) {
  const match = ATOM_DATE_PATTERN.exec(value)
  if (!match) {
    throw new Error(`jsonfeed-to-atom: invalid ${field}`)
  }

  const [, year, month, day, hour, minute, second, fraction, offsetSign, offsetHour, offsetMinute] = match
  const yearNumber = Number(year)
  const monthNumber = Number(month)
  const dayNumber = Number(day)
  const hourNumber = Number(hour)
  const minuteNumber = Number(minute)
  const secondNumber = Number(second)
  const offsetHourNumber = Number(offsetHour ?? 0)
  const offsetMinuteNumber = Number(offsetMinute ?? 0)
  const calendar = new Date(0)
  calendar.setUTCFullYear(yearNumber, monthNumber, 0)

  if (
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > calendar.getUTCDate() ||
    hourNumber > 23 ||
    minuteNumber > 59 ||
    secondNumber > 60 ||
    offsetHourNumber > 23 ||
    offsetMinuteNumber > 59
  ) {
    throw new Error(`jsonfeed-to-atom: invalid ${field}`)
  }

  const millisecond = Number((fraction ?? '').padEnd(3, '0').slice(0, 3))
  const date = new Date(0)
  date.setUTCFullYear(yearNumber, monthNumber - 1, dayNumber)
  date.setUTCHours(hourNumber, minuteNumber, Math.min(secondNumber, 59), millisecond)

  const offset = (offsetHourNumber * 60 + offsetMinuteNumber) * 60 * 1000
  const signedOffset = offsetSign === '+' ? -offset : offsetSign === '-' ? offset : 0
  const leapSecond = secondNumber === 60 ? 1000 : 0
  return new Date(date.valueOf() + signedOffset + leapSecond).toISOString()
}

/**
 * @param {string} value
 * @param {string} field
 */
function assertAbsoluteIRI (value, field) {
  try {
    // eslint-disable-next-line no-new
    new URL(value)
  } catch {
    throw new Error(`jsonfeed-to-atom: invalid ${field}; absolute IRI required`)
  }
}
