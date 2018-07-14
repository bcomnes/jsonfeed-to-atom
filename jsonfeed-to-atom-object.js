const packageInfo = require('./package.json')
const generateTitle = require('./lib/generate-title')

/**
 * Converts a JSON feed to an atom feed xmlbuilder object
 */
module.exports = function jsonfeedToAtomObject (jf, opts) {
  opts = Object.assign({
    feedURLFn: (feedURL, jf) => feedURL.replace(/\.json\b/, '.xml')
  }, opts)
  // JSON Feed to atom mapping based off of the atomenabled.org guidelines
  // https://web.archive.org/web/20160113103647/http://atomenabled.org/developers/syndication/#link
  const { title, version, feed_url: feedURL } = jf
  if (!title) throw new Error('jsonfeed-to-atom: missing title')
  if (version !== 'https://jsonfeed.org/version/1') throw new Error('jsonfeed-to-atom: JSON feed version 1 required')
  if (!feedURL) throw new Error('jsonfeed-to-atom: missing feed_url')
  const atomFeedURL = opts.feedURLFn(feedURL, jf)
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
  if (jf.icon) atom.feed.logo = jf.icon
  if (jf.author && jf.author.name) atom.feed.rights = `© ${now.getFullYear()} ${jf.author.name}`
  if (jf.description) atom.feed.subtitle = jf.description

  if (jf.items && jf.items.length > 0) {
    let mostRecentlyUpdated = '0'
    atom.feed.entry = []
    jf.items.forEach(item => {
      const entry = { // Required fields
        id: item.id,
        title: generateTitle(item),
        updated: item.date_modified || item.date_published || now.toISOString()
      }
      if (item.date_published) entry.published = item.date_published
      if (item.date_published && (item.date_published > mostRecentlyUpdated)) mostRecentlyUpdated = item.date_published
      if (item.date_modified && (item.date_modified > mostRecentlyUpdated)) mostRecentlyUpdated = item.date_modified

      if (item.author) {
        entry.author = {}
        if (item.author.name) entry.author.name = item.author.name
        if (item.author.url) entry.author.uri = item.author.url
      } else if (jf.author) {
        // Atom is supposed to support document scoped authors, but it does not in practice
        entry.author = {}
        if (jf.author.name) entry.author.name = jf.author.name
        if (jf.author.url) entry.author.uri = jf.author.url
      }

      entry.content = []

      if (item.content_html) {
        const htmlContent = {
          '@type': 'html',
          '#cdata': item.content_html
        }
        // Not sure if this is worth doing.  Please open an issue if you have understanding about this attribute
        // if (jf.home_page_url) htmlContent['@xml:base'] = jf.home_page_url
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
      if (item.url && item.external_url) {
        // In ideal world, url would always map to alternate
        // and external_url would always map to related
        // Feed readers do not work this way unfortunately
        entry.link.push({
          '@rel': 'alternate',
          '@href': item.external_url
        })

        entry.link.push({
          '@rel': 'related',
          '@href': item.url
        })
      } else if (item.url) {
        entry.link.push({
          '@rel': 'alternate',
          '@href': item.url
        })
      } else if (item.external_url) {
        entry.link.push({
          '@rel': 'related',
          '@href': item.external_url
        })
      }

      if (item.attachments) {
        item.attachments.forEach(attachment => {
          const enclosure = { '@rel': 'enclosure' }
          enclosure['@type'] = attachment.mime_type
          enclosure['@href'] = attachment.url
          if (attachment.size_in_bytes) enclosure['@length'] = attachment.size_in_bytes
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
