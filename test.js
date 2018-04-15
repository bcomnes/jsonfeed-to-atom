const jsonfeedToAtomObject = require('./jsonfeed-to-atom-object')
const testFeed = require('./test-feed.json')
const jsonfeedToAtom = require('./')
const test = require('tape')
const fs = require('fs')

test('missing property errors', t => {
  t.throws(() => {
    jsonfeedToAtom({
      version: 'https://jsonfeed.org/version/1',
      feed_url: 'https://jsonfeed.org/feed.json'
    })
  }, /missing title/, 'Missing titles throw')

  t.throws(() => {
    jsonfeedToAtom({
      feed_url: 'https://jsonfeed.org/feed.json',
      title: 'A feed title'
    })
  }, /version 1 required/, 'Missing version throw')

  t.throws(() => {
    jsonfeedToAtom({
      version: 'https://jsonfeed.org/version/1',
      title: 'A feed title'
    })
  }, /missing feed_url/, 'Missing version throw')

  t.end()
})

test('test-feed snapshot', t => {
  const atomObj = jsonfeedToAtomObject(testFeed)

  const expect = require('./snapshot.json')

  t.deepEqual(atomObj, expect, 'js transform is expected')
  t.end()
})

test('full integration snapshot', t => {
  const atomFeed = jsonfeedToAtom(testFeed)
  const expect = fs.readFileSync('snapshot.xml', 'utf8')
  t.equal(atomFeed, expect, 'xml output snapshot is the same')
  t.end()
})
