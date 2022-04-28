const fs = require('fs')
const jsonfeedToAtom = require('./')
const jsonfeedToAtomObj = require('./jsonfeed-to-atom-object')
const testFeed = require('./test-feed.json')

const atomObj = jsonfeedToAtomObj(testFeed)
const atomFeed = jsonfeedToAtom(testFeed)

fs.writeFileSync('snapshot.xml', atomFeed)
fs.writeFileSync('snapshot.json', JSON.stringify(atomObj, null, ' '))

console.log('update snapshot snapshot.xml')
