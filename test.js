const jsonfeedToAtom = require('./')
const testFeed = require('./test-feed.json')
const test = require('tape')
const fs = require('fs')
const packageInfo = require('./package.json')

test('test-feed snapshot', t => {
  const atomObj = jsonfeedToAtom.jsonfeedToAtomObject(testFeed)

  const expect = {
    'feed': {
      '@xmlns': 'http://www.w3.org/2005/Atom',
      'title': 'bret.io log',
      'id': 'https://bret.io/feed.xml',
      'updated': '2018-04-07T22:06:43.000Z',
      'link': [
        {
          '@rel': 'self',
          '@type': 'application/atom+xml',
          '@href': 'https://bret.io/feed.xml'
        },
        {
          '@rel': 'alternate',
          '@type': 'application/json',
          '@href': 'https://bret.io/feed.json'
        },
        {
          '@rel': 'alternate',
          '@type': 'text/html',
          '@href': 'https://bret.io'
        },
        {
          '@rel': 'next',
          '@href': 'https://bret.io/2017.xml'
        }
      ],
      'author': {
        'name': 'Bret Comnes',
        'uri': 'https://bret.io'
      },
      'generator': {
        '@uri': 'https://github.com/bcomnes/jsonfeed-to-atom#readme',
        '@version': packageInfo.version,
        '#text': 'jsonfeed-to-atom'
      },
      'icon': 'https://bret.io/icon-512x512.png',
      'rights': '© 2018 Bret Comnes',
      'subtitle': 'A running log of announcements, projects and accomplishments.',
      'entry': [
        {
          'id': 'https://bret.io/my-text-post-2018-04-07T20:48:02.000Z',
          'title': 'Wee wooo this is some content.',
          'updated': '2018-04-07T20:48:02.000Z',
          'published': '2018-04-07T20:48:02.000Z',
          author: { name: 'Bret Comnes', uri: 'https://bret.io' },
          'content': [
            {
              '@type': 'text',
              '#text': 'Wee wooo this is some content. \n Maybe a new paragraph too'
            }
          ],
          'link': [
            {
              '@rel': 'alternate',
              '@href': 'https://bret.io/my-text-post'
            }
          ]
        },
        {
          'id': 'https://bret.io/my-blog-post-2018-04-07T22:06:43.000Z',
          'title': 'This is a blog title',
          'updated': '2018-04-07T22:06:43.000Z',
          'published': '2018-04-07T22:06:43.000Z',
          author: { name: 'Bret Comnes', uri: 'https://bret.io' },
          'content': [
            {
              '@type': 'html',
              '#cdata': '<p>Hello, world!</p>'
            }
          ],
          'link': [
            {
              '@rel': 'alternate',
              '@href': 'https://example.com/some-external-link'
            },
            {
              '@rel': 'related',
              '@href': 'https://bret.io/my-blog-post'
            }
          ]
        }
      ]
    }
  }

  t.deepEqual(atomObj, expect, 'js transform is expected')
  t.end()
})

test('full integration snapshot', t => {
  const atomFeed = jsonfeedToAtom(testFeed)
  const expect = fs.readFileSync('snapshot.xml', 'utf8')
  t.equal(atomFeed, expect, 'xml output snapshot is the same')
  t.end()
})
