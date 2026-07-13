# jsonfeed-to-atom

[![latest version](https://img.shields.io/npm/v/jsonfeed-to-atom.svg)](https://www.npmjs.com/package/jsonfeed-to-atom)
[![Actions Status](https://github.com/bcomnes/jsonfeed-to-atom/workflows/tests/badge.svg)](https://github.com/bcomnes/jsonfeed-to-atom/actions)

[![downloads](https://img.shields.io/npm/dm/jsonfeed-to-atom.svg)](https://npmtrends.com/jsonfeed-to-atom)
![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Socket Badge](https://socket.dev/api/badge/npm/package/jsonfeed-to-atom)](https://socket.dev/npm/package/jsonfeed-to-atom)

Convert a [JSON Feed 1.1](https://www.jsonfeed.org/version/1.1/) document to an [Atom 1.0](https://www.rfc-editor.org/rfc/rfc4287) XML document.

This package is ESM-only and requires Node.js 20.19 or newer.

Existing 1.x consumers should follow the [migration guide](./MIGRATION.md).

```console
npm install jsonfeed-to-atom
```

## Usage

```js
import jsonfeedToAtom from 'jsonfeed-to-atom'

const atomFeed = jsonfeedToAtom({
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Example feed',
  home_page_url: 'https://example.com',
  feed_url: 'https://example.com/feed.json',
  authors: [
    {
      name: 'Example Author',
      url: 'https://example.com/about'
    }
  ],
  items: [
    {
      id: 'https://example.com/posts/1',
      url: 'https://example.com/posts/1',
      title: 'Hello, world',
      content_html: '<p>Hello, world!</p>',
      date_published: '2026-01-01T00:00:00Z'
    }
  ]
})
```

The result is an Atom XML string:

```xml
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example feed</title>
  <id>https://example.com/feed.xml</id>
  <updated>2026-01-01T00:00:00Z</updated>
  <link href="https://example.com/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="https://example.com/feed.json" rel="alternate" type="application/feed+json"/>
  <link href="https://example.com" rel="alternate" type="text/html"/>
  <author>
    <name>Example Author</name>
    <uri>https://example.com/about</uri>
  </author>
  <!-- generator and entry elements omitted -->
</feed>
```

## API

### `jsonfeedToAtom(jsonFeed, options?)`

Converts a parsed JSON Feed 1.1 object into an Atom XML string.

The converter requires the exact version URL `https://jsonfeed.org/version/1.1` and a `feed_url`, which is used as the Atom feed ID and self link.

JSON Feed 1.1 `authors` arrays are mapped to Atom author elements.
The deprecated singular `author` property remains accepted because it is still valid in JSON Feed 1.1.
To satisfy Atom, a feed must have a named author or every item must have a named author.

Absolute JSON Feed item IDs are preserved.
Other string IDs are converted to stable absolute IRIs scoped to `feed_url`.

Item dates are normalized to RFC 3339 UTC timestamps, and unparseable dates are rejected.

When an item contains both `content_html` and `content_text`, the HTML content is used because Atom permits only one content element per entry.

JSON Feed [WebSub](https://www.w3.org/TR/2026/REC-websub-20260602/) hubs are emitted as Atom links with `rel="hub"`.

The default URL mapper replaces a `.json` suffix with `.xml`.
It can be customized for both the current feed and `next_url`:

```js
const atomFeed = jsonfeedToAtom(jsonFeed, {
  feedURLFn: (feedURL, jsonFeed) => `${feedURL}.atom`
})
```

### Atom object model

The intermediate Atom object model is available from the open `jsonfeed-to-atom/object.js` subpath:

```js
import jsonfeedToAtomObject from 'jsonfeed-to-atom/object.js'

const atom = jsonfeedToAtomObject(jsonFeed)
```

## Schemas and types

The JSON Feed input and Atom output types are generated with [`json-schema-to-typescript`](https://github.com/bcherny/json-schema-to-typescript).

The generated types are exported from the package root:

```ts
import type { AtomFeed, JSONFeed } from 'jsonfeed-to-atom'
```

The vendored JSON Feed schemas come from [SchemaStore](https://www.schemastore.org/json/), and the Atom model schema follows RFC 4287.
The upstream commit IDs are recorded in the wrapper schemas under [`schemas/`](./schemas/).

Regenerate the declaration sources after changing a schema:

```console
npm run build:schemas
```

## License

MIT
