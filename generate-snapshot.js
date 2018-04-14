var fs = require('fs')
var jsonfeedToAtom = require('./')
var testFeed = require('./test-feed.json')

const atomFeed = jsonfeedToAtom(testFeed)

fs.writeFileSync('snapshot.xml', atomFeed)

console.log('update snapshot snapshot.xml')
