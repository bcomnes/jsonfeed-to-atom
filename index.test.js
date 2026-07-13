/** @import { JSONFeed, Item } from './lib/json-feed-types.js' */

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import jsonfeedToAtom from './index.js'
import jsonfeedToAtomObject from './jsonfeed-to-atom-object.js'
import generateTitle from './lib/generate-title.js'

const testFeed = asJSONFeed(JSON.parse(
  await readFile(new URL('test-feed.json', import.meta.url), 'utf8')
))

test('requires a JSON Feed 1.1 document', () => {
  assert.throws(() => jsonfeedToAtom(asJSONFeed({
    version: 'https://jsonfeed.org/version/1.1',
    feed_url: 'https://jsonfeed.org/feed.json',
    items: []
  })), /missing title/)

  for (const version of [
    'https://jsonfeed.org/version/1',
    'https://jsonfeed.org/version/2'
  ]) {
    assert.throws(() => jsonfeedToAtom(asJSONFeed({
      version,
      feed_url: 'https://jsonfeed.org/feed.json',
      title: 'A feed title',
      items: []
    })), /version 1\.1 required/)
  }

  assert.throws(() => jsonfeedToAtom(asJSONFeed({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed title',
    items: []
  })), /missing feed_url/)

  assert.throws(() => jsonfeedToAtom(asJSONFeed({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed title',
    feed_url: 'not an absolute URL',
    items: []
  })), /invalid feed_url; absolute IRI required/)

  assert.throws(() => jsonfeedToAtom(asJSONFeed({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed title',
    feed_url: 'https://jsonfeed.org/feed.json'
  })), /missing items/)
})

test('generates a title from the best available item field', () => {
  const simpleTitle = 'Hey this is a title'
  assert.equal(generateTitle(/** @type {Item} */ ({ id: '1', title: simpleTitle, content_text: 'body' })), simpleTitle)

  assert.equal(generateTitle(/** @type {Item} */ ({
    id: '2',
    summary: 'This is a summary',
    content_text: 'This is some text',
    content_html: '<p>yo</p>  '
  })), 'This is a summary')

  assert.equal(generateTitle(/** @type {Item} */ ({
    id: '3',
    content_text: 'This is some text',
    content_html: '<p>yo</p>  '
  })), 'This is some text')

  assert.equal(generateTitle(/** @type {Item} */ ({
    id: '4',
    content_html: '<p>yo</p>  '
  })), 'yo')

  assert.throws(
    () => generateTitle(/** @type {Item} */ ({ id: '5' })),
    /can't generate a title/
  )
})

test('object conversion matches the snapshot', async () => {
  const expected = JSON.parse(await readFile(new URL('snapshot.json', import.meta.url), 'utf8'))
  assert.deepEqual(jsonfeedToAtomObject(testFeed), expected)
})

test('XML conversion matches the snapshot', async () => {
  const expected = await readFile(new URL('snapshot.xml', import.meta.url), 'utf8')
  assert.equal(jsonfeedToAtom(testFeed), expected)
})

test('maps JSON Feed 1.1 authors, language, hubs, and content', () => {
  const atom = jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    language: 'en-US',
    authors: [
      { name: 'Feed Author', url: 'https://example.com/about' },
      { name: 'Coauthor' }
    ],
    hubs: [{ type: 'WebSub', url: 'https://example.com/hub' }],
    items: [{
      id: 'entry',
      title: 'Entry',
      content_html: '<p>HTML</p>',
      content_text: 'Plain text',
      language: 'fr',
      authors: [{ name: 'Entry Author' }],
      attachments: [{
        url: 'https://example.com/audio.mp3',
        mime_type: 'audio/mpeg',
        title: 'Audio',
        size_in_bytes: 123
      }]
    }]
  })

  assert.deepEqual(atom.author, [
    { name: 'Feed Author', uri: 'https://example.com/about' },
    { name: 'Coauthor' }
  ])
  assert.equal(atom.language, 'en-US')
  assert.deepEqual(atom.link?.at(-1), {
    rel: 'hub',
    href: 'https://example.com/hub'
  })
  assert.deepEqual(atom.entry?.[0]?.author, [{ name: 'Entry Author' }])
  assert.equal(atom.entry?.[0]?.language, 'fr')
  assert.deepEqual(atom.entry?.[0]?.content, { type: 'html', value: '<p>HTML</p>' })
  assert.deepEqual(atom.entry?.[0]?.link?.at(-1), {
    rel: 'enclosure',
    type: 'audio/mpeg',
    href: 'https://example.com/audio.mp3',
    title: 'Audio',
    length: 123
  })
})

test('supports deprecated singular authors in JSON Feed 1.1', () => {
  const atom = jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    author: { name: 'Feed Author' },
    items: [{
      id: 'entry',
      content_text: 'Body',
      author: { name: 'Entry Author' }
    }]
  })

  assert.deepEqual(atom.author, [{ name: 'Feed Author' }])
  assert.deepEqual(atom.entry?.[0]?.author, [{ name: 'Entry Author' }])
})

test('requires enough named authors for a valid Atom feed', () => {
  assert.throws(() => jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    items: [{
      id: 'entry',
      content_text: 'Body'
    }]
  }), /Atom requires a named feed author or named authors on every item/)

  const atom = jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    items: [{
      id: 'entry',
      content_text: 'Body',
      authors: [{ name: 'Entry Author' }]
    }]
  })

  assert.equal(atom.author, undefined)
  assert.deepEqual(atom.entry?.[0]?.author, [{ name: 'Entry Author' }])
})

test('maps arbitrary JSON Feed item IDs to stable Atom IRIs', () => {
  const atom = jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    authors: [{ name: 'Feed Author' }],
    items: [
      {
        id: 'entry 1',
        content_text: 'Body'
      },
      {
        id: 'https://example.com/entries/2',
        content_text: 'Body'
      }
    ]
  })

  assert.equal(atom.entry?.[0]?.id, 'https://example.com/feed.json#jsonfeed-id=entry%201')
  assert.equal(atom.entry?.[1]?.id, 'https://example.com/entries/2')
})

test('normalizes item dates for Atom', () => {
  const atom = jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    authors: [{ name: 'Feed Author' }],
    items: [{
      id: 'entry',
      content_text: 'Body',
      date_published: '2026-01-01T01:00:00+01:00',
      date_modified: '2026-01-02T02:30:00+02:30'
    }]
  })

  assert.equal(atom.updated, '2026-01-02T00:00:00.000Z')
  assert.equal(atom.entry?.[0]?.published, '2026-01-01T00:00:00.000Z')
  assert.equal(atom.entry?.[0]?.updated, '2026-01-02T00:00:00.000Z')

  const leapSecond = jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    authors: [{ name: 'Feed Author' }],
    items: [{
      id: 'entry',
      content_text: 'Body',
      date_published: '2016-12-31T23:59:60Z'
    }]
  })

  assert.equal(leapSecond.entry?.[0]?.published, '2017-01-01T00:00:00.000Z')

  assert.throws(() => jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    authors: [{ name: 'Feed Author' }],
    items: [{
      id: 'entry',
      content_text: 'Body',
      date_published: 'not a date'
    }]
  }), /invalid date_published/)

  assert.throws(() => jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/feed.json',
    authors: [{ name: 'Feed Author' }],
    items: [{
      id: 'entry',
      content_text: 'Body',
      date_published: '2026-02-30T00:00:00Z'
    }]
  }), /invalid date_published/)
})

test('uses the custom URL mapper for the current and next feeds', () => {
  const atom = jsonfeedToAtomObject({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A feed',
    feed_url: 'https://example.com/current',
    next_url: 'https://example.com/next',
    items: []
  }, {
    feedURLFn: feedURL => `${feedURL}.atom`
  })

  assert.equal(atom.id, 'https://example.com/current.atom')
  assert.deepEqual(atom.link?.find(link => link.rel === 'next'), {
    rel: 'next',
    href: 'https://example.com/next.atom'
  })
})

test('drops invalid XML characters', () => {
  const xml = jsonfeedToAtom({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'A\u0000 feed',
    feed_url: 'https://example.com/feed.json',
    items: []
  })

  assert.match(xml, /<title>A feed<\/title>/)
})

/**
 * @param {unknown} value
 * @returns {JSONFeed}
 */
function asJSONFeed (value) {
  return /** @type {JSONFeed} */ (value)
}
