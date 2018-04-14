const builder = require('xmlbuilder')
const packageInfo = require('./package.json')
const striptags = require('striptags')
const trimRight = require('trim-right')
const trimLeft = require('trim-left')

function jsonfeedToAtomObject (jf) {
  const { title, version, feed_url: feedURL } = jf
  if (!title) throw new Error('jsonfeed-to-atom: missing title')
  if (version !== 'https://jsonfeed.org/version/1') throw new Error('jsonfeed-to-atom: JSON feed version 1 required')
  if (!feedURL) throw new Error('jsonfeed-to-atom: missing feed_url')
  const atomFeedURL = feedURL.replace('json', 'xml')
  const now = new Date()
  const atom = {
    feed: { // Required items
      '@xmlns': 'http://www.w3.org/2005/Atom',
      title,
      id: atomFeedURL,
      updated: now.toISOString()
    }
  }

  atom.feed.link = [
    { '@rel': 'self', '@type': 'application/atom+xml', '@href': atomFeedURL },
    { '@rel': 'alternate', '@type': 'application/json', '@href': feedURL }
  ]
  if (jf.home_page_url) {
    atom.feed.link.push({'@rel': 'alternate', '@type': 'text/html', '@href': jf.home_page_url})
  }
  if (jf.next_url) {
    atom.feed.link.push({'@rel': 'next', '@href': jf.next_url.replace('json', 'xml')})
  }

  if (jf.author) {
    atom.feed.author = {}
    if (jf.author.name) atom.feed.author.name = jf.author.name
    if (jf.author.url) atom.feed.author.uri = jf.author.url
  }
  atom.feed.generator = {
    '@uri': packageInfo.homepage,
    '@version': packageInfo.version,
    '#text': packageInfo.name
  }
  if (jf.favicon || jf.icon) atom.feed.icon = jf.favicon || jf.icon
  if (jf.author && jf.author.name) atom.feed.rights = `© ${now.getFullYear()} ${jf.author.name}`
  if (jf.description) atom.feed.subtitle = jf.description

  if (jf.items && jf.items.length > 0) {
    let mostRecentlyUpdated = '0'
    atom.feed.entry = []
    jf.items.forEach(item => {
      const entry = { // Required fields
        id: item.id,
        title: generateRequiredTitle(item),
        updated: item.date_modified || item.date_published || now.toISOString()
      }
      if (item.date_published) entry.published = item.date_published
      if (item.date_published && (item.date_published > mostRecentlyUpdated)) mostRecentlyUpdated = item.date_published
      if (item.date_modified && (item.date_modified > mostRecentlyUpdated)) mostRecentlyUpdated = item.date_modified

      if (item.author) {
        entry.author = {}
        if (item.author.name) entry.author.name = item.name
        if (item.author.url) entry.author.uri = item.url
      }

      entry.content = []

      if (item.content_html) {
        const htmlContent = {
          '@type': 'html',
          '#cdata': item.content_html
        }
        entry.content.push(htmlContent)
      }

      if (item.content_text) {
        const textContent = {
          '@type': 'text',
          '#text': item.content_text
        }
        entry.content.push(textContent)
      }

      entry.link = []
      if (item.url) {
        entry.link.push({
          '@rel': 'alternate',
          '@href': item.url
        })
      }

      if (item.external_url) {
        entry.link.push({
          '@rel': 'related',
          '@href': item.external_url
        })
      }

      if (item.attachments) {
        item.attachments.forEach(attachment => {
          const enclosure = { '@rel': 'enclosure' }
          enclosure.type = attachment.mime_type
          enclosure.href = attachment.url
          if (attachment.size_in_bytes) enclosure.length = attachment.size_in_bytes
          entry.link.push(enclosure)
        })
      }

      if (item.summary) {
        entry.summary = item.summary
      }

      if (item.tags) {
        entry.category = item.tags.map(tag => ({ '@term': tag }))
      }

      atom.feed.entry.push(entry)
    })
    if (mostRecentlyUpdated > '0') atom.feed.updated = mostRecentlyUpdated
  }

  return atom
}

function generateRequiredTitle (item) {
  if (item.title) return item.title
  if (item.summary) return truncate(cleanWhitespace(item.summary))
  if (item.content_text) return truncate(cleanWhitespace(item.content_text))
  if (item.content_html) return truncate(cleanWhitespace(striptags(item.content_html)))
  throw new Error('jsonfeed-to-atom: can\'t generate a title for entry ' + item.id)
}

function cleanWhitespace (summary) {
  return trimLeft(trimRight(summary.split('\n')[0]))
}

function truncate (string) {
  return string.length > 100 ? string.slice(0, 100) + '…' : string
}

function jsonfeedToAtom (jsonfeed) {
  const feedObj = jsonfeedToAtomObject(jsonfeed)
  const feed = builder.create(feedObj, { encoding: 'utf-8' })
  return feed.end({ pretty: true })
}

module.exports = jsonfeedToAtom
module.exports.jsonfeedToAtomObject = jsonfeedToAtomObject
