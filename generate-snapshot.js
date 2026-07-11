import { readFile, writeFile } from 'node:fs/promises'
import jsonfeedToAtom from './index.js'
import jsonfeedToAtomObject from './jsonfeed-to-atom-object.js'

/** @import { JSONFeed } from './lib/json-feed-types.js' */

const testFeed = /** @type {JSONFeed} */ (JSON.parse(
  await readFile(new URL('test-feed.json', import.meta.url), 'utf8')
))
const atomObject = jsonfeedToAtomObject(testFeed)
const atomFeed = jsonfeedToAtom(testFeed)

await Promise.all([
  writeFile(new URL('snapshot.xml', import.meta.url), atomFeed),
  writeFile(
    new URL('snapshot.json', import.meta.url),
    `${JSON.stringify(atomObject, null, 2)}\n`
  )
])

console.log('Updated snapshot.xml and snapshot.json')
