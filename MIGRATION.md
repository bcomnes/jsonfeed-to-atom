# Migrating from jsonfeed-to-atom 1.x

The next major release modernizes the package around ESM and JSON Feed 1.1.
This guide covers the changes an existing consumer may need to make.

## Requirements

- Use Node.js 20.19 or newer and npm 10 or newer.
- Pass feeds whose `version` is exactly `https://jsonfeed.org/version/1.1`.
- Keep `feed_url` populated because the converter uses it for the Atom feed ID and self link.
- Expect the package to be ESM-only.

## Update the import

Replace the CommonJS import:

```js
const jsonfeedToAtom = require('jsonfeed-to-atom')
```

with an ESM import:

```js
import jsonfeedToAtom from 'jsonfeed-to-atom'
```

If the rest of the application must remain CommonJS, load the package with a dynamic import:

```js
async function convertFeed (jsonFeed) {
  const { default: jsonfeedToAtom } = await import('jsonfeed-to-atom')
  return jsonfeedToAtom(jsonFeed)
}
```

Do not add `"type": "module"` to an application without checking its other JavaScript files first.
That setting changes how every `.js` file in the package is interpreted.

## Update feeds to JSON Feed 1.1

Change the version URL and prefer the plural `authors` property:

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

Apply the same `author` to `authors` conversion to individual items.
The singular property is deprecated but remains accepted because JSON Feed 1.1 still treats it as valid.

JSON Feed 1.1 also supports `language` on feeds and items and `hubs` for real-time notification endpoints.
WebSub hubs are emitted as Atom links with `rel="hub"`.

## Update intermediate object consumers

Consumers that only call the default export still receive an Atom XML string.

The intermediate object helper is available through an open package subpath:

```js
import jsonfeedToAtomObject from 'jsonfeed-to-atom/object.js'
```

It returns a typed Atom model rather than an object shaped for the old XML builder.

JSON Feed and Atom model types are available from the package root:

```ts
import type { AtomFeed, JSONFeed } from 'jsonfeed-to-atom'
```
The most common property changes are:

| 1.x object | New Atom model |
| --- | --- |
| `atom.feed.id` | `atom.id` |
| `atom.feed.title` | `atom.title.value` |
| `atom.feed.updated` | `atom.updated` |
| `atom.feed.entry` | `atom.entry` |
| `link['@href']` | `link.href` |
| `link['@rel']` | `link.rel` |
| `author.name` | `author[0].name` |
| `content[0]['#text']` | `content.value` |

Code that imported `jsonfeed-to-atom-object.js` by file path should move to the supported `jsonfeed-to-atom/object.js` subpath.

## Review output changes

The generated Atom remains semantically equivalent, but string snapshots may change.

- The JSON Feed alternate link now uses `application/feed+json`.
- Feed and item languages are serialized as `xml:lang`.
- Multiple JSON Feed authors become multiple Atom author elements.
- JSON Feed author objects without a `name` are omitted because Atom requires author names.
- WebSub hubs become Atom hub links.
- Enclosure titles are preserved and integer sizes become Atom `length` attributes.
- If an item contains both `content_html` and `content_text`, HTML is used because Atom permits one content element per entry.
- XML attribute ordering and CDATA formatting may differ after the move to `xmlbuilder2`.

Review snapshot changes before accepting them instead of updating snapshots blindly.

## Check custom URL mapping

The `feedURLFn` option still customizes the Atom feed URL and now also handles `next_url` consistently:

```js
const atomFeed = jsonfeedToAtom(jsonFeed, {
  feedURLFn: feedURL => `${feedURL}.atom`
})
```

The default mapper changes a `.json` suffix to `.xml` and leaves URLs without that suffix unchanged.

## Migration checklist

1. Upgrade the application runtime and CI matrix to Node.js 20.19 or newer.
2. Replace CommonJS imports or use a dynamic import boundary.
3. Change JSON Feed version URLs to the exact 1.1 URL.
4. Replace singular author properties with author arrays where practical.
5. Update direct intermediate-object consumers to the supported subpath and new model.
6. Run tests, type checking, and production builds.
7. Review and intentionally regenerate XML or object snapshots.

These searches catch the most common remaining migration work:

```console
rg "require\\(['\"]jsonfeed-to-atom|jsonfeed-to-atom-object"
rg "https://jsonfeed.org/version/1['\"]"
```
