# Migrating from 1.x to 2.x

The next major release modernizes `jsonfeed-to-atom` around ESM, JSON Feed 1.1, and generated TypeScript declarations.
This guide covers the changes an existing consumer may need to make.

## What changes

| Area | 1.x | 2.x |
| --- | --- | --- |
| Node.js | Older Node.js releases | Node.js 20.19 or newer |
| Module format | CommonJS | ESM-only |
| Feed input | JSON Feed 1.0 and compatible objects | JSON Feed 1.1 only |
| Feed version | `https://jsonfeed.org/version/1` | `https://jsonfeed.org/version/1.1` |
| Feed URL | Used when available | Required |
| Authors | Singular `author` was common | Plural `authors` is preferred |
| Atom authors | Missing authors were passed through | A named feed author or named authors on every item are required |
| Item IDs | Copied directly | Non-IRI strings become stable feed-scoped Atom IRIs |
| Item dates | Copied directly | Normalized to RFC 3339 UTC timestamps |
| Public types | No supported generated schema types | JSON Feed and Atom types exported from the package root |
| Atom object helper | Internal file-shaped object | Canonical Atom model from `jsonfeed-to-atom/object.js` |
| XML generation | `xmlbuilder` | `xmlbuilder2` |

The default export still accepts a parsed JSON object and returns an Atom XML string.

## Upgrade the runtime first

Update local development, production, and CI to Node.js 20.19 or newer.
The package also declares npm 10 or newer.

Upgrade the runtime before changing imports so module-loading failures are easier to diagnose.

## Move to an ESM import

Replace the CommonJS import:

```js
const jsonfeedToAtom = require('jsonfeed-to-atom')
```

with an ESM import:

```js
import jsonfeedToAtom from 'jsonfeed-to-atom'
```

If the application must remain CommonJS, load the package at a narrow asynchronous boundary:

```js
async function convertFeed (jsonFeed) {
  const { default: jsonfeedToAtom } = await import('jsonfeed-to-atom')
  return jsonfeedToAtom(jsonFeed)
}
```

Do not add `"type": "module"` to an existing application without checking its other JavaScript files, tests, and configuration first.
That setting changes how every `.js` file in the package is interpreted.

## Require JSON Feed 1.1

The converter now rejects a missing version, JSON Feed 1.0, and every version other than the exact JSON Feed 1.1 URL.
Every converted feed must also contain `title`, `items`, and `feed_url`.

Update feed producers and fixtures like this:

```diff
 {
-  "version": "https://jsonfeed.org/version/1",
+  "version": "https://jsonfeed.org/version/1.1",
   "title": "Example feed",
   "feed_url": "https://example.com/feed.json",
-  "author": {
-    "name": "Example Author"
-  },
+  "authors": [
+    {
+      "name": "Example Author"
+    }
+  ],
   "items": []
 }
```

Apply the same `author` to `authors` conversion to individual items when you control the producer.
The singular `author` property is deprecated but remains accepted because it is still valid in JSON Feed 1.1.
Atom requires a named feed author unless every entry has a named author.
The converter now rejects feeds that cannot satisfy that requirement without inventing author data.

JSON Feed 1.1 `language` values become Atom `xml:lang` attributes.
[WebSub](https://www.w3.org/TR/2026/REC-websub-20260602/) entries in `hubs` become Atom links with `rel="hub"`.

## Review IDs and dates

JSON Feed permits arbitrary strings for item IDs, while Atom requires absolute IRIs.
The converter preserves absolute IDs and maps other strings to stable fragments scoped to `feed_url`:

```text
entry 1 -> https://example.com/feed.json#jsonfeed-id=entry%201
```

Update snapshots or downstream object-model assertions that expected the original relative ID.

JSON Feed item dates are normalized to RFC 3339 UTC timestamps before they are emitted as Atom dates:

```text
2026-01-01T01:00:00+01:00 -> 2026-01-01T00:00:00.000Z
```

The converter rejects dates that cannot be parsed rather than emitting invalid Atom.

## Use the generated public types

The package now uses `json-schema-to-typescript` to generate its JSON Feed input types and Atom object-model types.
Its `types.ts` declaration source re-exports those generated types as the supported public type surface.
Consumers can import those types from the package root:

```ts
import type {
  AtomEntry,
  AtomFeed,
  JSONFeed,
  JsonfeedToAtomOptions
} from 'jsonfeed-to-atom'
```

The public `JSONFeed` type pins `version` to the JSON Feed 1.1 URL and requires `feed_url` because the converter needs it at runtime.
The default export and `feedURLFn` callback both use that generated input type.

The package does not use an export map.
Published files and schemas therefore remain available through open subpaths, while the package root remains the supported place to import public types.

For example, a tool that needs the JSON Schema itself can import the published wrapper schema:

```js
import jsonFeedSchema from 'jsonfeed-to-atom/schemas/json-feed-1.1.json' with { type: 'json' }
```

Treat files under `lib/` as implementation details even though open package exports make deep imports possible.

## Update intermediate object consumers

Consumers that only call the default export still receive an Atom XML string.

Import the intermediate object helper from its documented open subpath:

```js
import jsonfeedToAtomObject from 'jsonfeed-to-atom/object.js'
```

The helper now returns a canonical Atom model rather than an object shaped for the old XML builder.

| 1.x object | 2.x Atom model |
| --- | --- |
| `atom.feed.id` | `atom.id` |
| `atom.feed.title` | `atom.title.value` |
| `atom.feed.updated` | `atom.updated` |
| `atom.feed.entry` | `atom.entry` |
| `link['@href']` | `link.href` |
| `link['@rel']` | `link.rel` |
| `author.name` | `author[0].name` |
| `content[0]['#text']` | `content.value` |

Code that imported `jsonfeed-to-atom-object.js` directly should move to `jsonfeed-to-atom/object.js`.

## Review Atom output changes

The generated Atom remains semantically equivalent, but serialized XML and object snapshots may change.

- The JSON Feed alternate link uses `application/feed+json`.
- Feed and item languages are serialized as `xml:lang`.
- Multiple JSON Feed authors become multiple Atom author elements.
- Authors without a `name` are omitted because Atom person constructs require a name.
- A feed without a named author is rejected unless every item has a named author.
- Relative or otherwise non-IRI item IDs become stable feed-scoped IRIs.
- Item dates are normalized to RFC 3339 UTC timestamps.
- WebSub hubs become Atom hub links.
- Enclosure titles are preserved.
- Integer attachment sizes become Atom `length` attributes.
- When an item supplies both `content_html` and `content_text`, the HTML content is used because Atom permits one content element per entry.
- XML attribute ordering, empty-element formatting, and CDATA formatting may differ after the move to `xmlbuilder2`.

Review snapshot diffs for semantic changes before regenerating expected files.

## Check custom URL mapping

The `feedURLFn` option still customizes the Atom feed URL and now also handles `next_url` consistently:

```js
const atomFeed = jsonfeedToAtom(jsonFeed, {
  feedURLFn: feedURL => `${feedURL}.atom`
})
```

The default mapper changes a `.json` suffix to `.xml` and leaves URLs without that suffix unchanged.

## Migration checklist

1. Upgrade development, CI, and production to Node.js 20.19 or newer.
2. Replace `require()` with a static ESM import or a narrow dynamic import.
3. Change feed version URLs to exactly `https://jsonfeed.org/version/1.1`.
4. Ensure every converted feed includes `title`, `items`, and `feed_url`.
5. Replace singular author properties with author arrays where practical.
6. Ensure the feed has a named author or every item has a named author.
7. Review non-IRI item IDs and date strings for normalized output.
8. Import public types from the package root.
9. Move intermediate-object consumers to `jsonfeed-to-atom/object.js` and update their property access.
10. Run focused feed tests, the full test suite, type checking, and the production build.
11. Review XML and object snapshot changes before accepting them.

These searches catch the most common remaining migration work:

```console
rg "require\(['\"]jsonfeed-to-atom|jsonfeed-to-atom-object|jsonfeed-to-atom/object"
rg "https://jsonfeed.org/version/1['\"]"
rg "atom\.feed|\['@|\['#text'\]"
```
