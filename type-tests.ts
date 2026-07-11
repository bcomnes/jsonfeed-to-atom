import jsonfeedToAtom from './types.js'
import type {
  AtomFeed,
  JSONFeed,
  JsonfeedToAtomObject,
  JsonfeedToAtomOptions
} from './types.js'

const feed = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Example feed',
  feed_url: 'https://example.com/feed.json',
  items: []
} satisfies JSONFeed

const options = {
  feedURLFn: feedURL => `${feedURL}.atom`
} satisfies JsonfeedToAtomOptions

const atomXML: string = jsonfeedToAtom(feed, options)
const atomFeed = {} as AtomFeed
const jsonfeedToAtomObject = (() => atomFeed) satisfies JsonfeedToAtomObject

void atomXML
void atomFeed
void jsonfeedToAtomObject
