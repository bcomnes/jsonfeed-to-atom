import type { AtomFeed } from './lib/atom-feed-types.js'
import type { JSONFeed } from './lib/json-feed-types.js'

export type {
  Attachment,
  Attachments,
  Author,
  Hubs,
  Item,
  JSONFeed,
  JSONSchemaForTheJSONFeedFormat,
  Tags
} from './lib/json-feed-types.js'

export type {
  AtomCategory,
  AtomContent,
  AtomEntry,
  AtomFeed,
  AtomGenerator,
  AtomLink,
  AtomPerson,
  AtomTextConstruct
} from './lib/atom-feed-types.js'

export interface JsonfeedToAtomOptions {
  feedURLFn?: (feedURL: string, jsonfeed: JSONFeed) => string
}

export interface JsonfeedToAtom {
  (jsonfeed: JSONFeed, options?: JsonfeedToAtomOptions): string
}

export interface JsonfeedToAtomObject {
  (jsonfeed: JSONFeed, options?: JsonfeedToAtomOptions): AtomFeed
}

declare const jsonfeedToAtom: JsonfeedToAtom

export default jsonfeedToAtom
