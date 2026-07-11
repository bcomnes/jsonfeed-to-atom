---
name: migrate-jsonfeed-to-atom
description: Migrate applications from jsonfeed-to-atom 1.x to the ESM-only 2.x release that requires JSON Feed 1.1. Use when a project has CommonJS imports, JSON Feed 1.0 producers or fixtures, direct object-helper imports, old xmlbuilder-shaped Atom access, schema-type deep imports, affected snapshots, or Node and CI requirements below 20.19.
---

# Migrate jsonfeed-to-atom

Upgrade the consumer without broad, unrelated module-system changes.
Treat its feed producers, fixtures, imports, types, and snapshots as the migration boundary.

## Inspect the consumer

1. Read the package manifest, lockfile, Node engine, and CI runtime configuration.
2. Read `MIGRATION.md` from the installed package or checked-out source when available.
3. Find package imports, type imports, feed builders, JSON fixtures, intermediate-object access, and related snapshots.
4. Determine whether the consumer is ESM, CommonJS, or mixed before editing module metadata.

Start with:

```console
rg "jsonfeed-to-atom|jsonfeed.org/version/1|feed_url|authors?|atom\.feed|\['@|\['#text'\]" .
```

Exclude dependency folders, generated coverage, and archived data when broad searches become noisy.

## Establish the runtime boundary

- Raise development, CI, and production to Node.js 20.19 or newer.
- Use `import jsonfeedToAtom from 'jsonfeed-to-atom'` in ESM consumers.
- Use `await import('jsonfeed-to-atom')` at a narrow asynchronous boundary when the application must remain CommonJS.
- Convert the whole application to ESM only when that broader migration is explicitly in scope.
- Do not add `"type": "module"` without checking every `.js` entry point, test, and configuration file.

## Update the feed contract

1. Change feed versions to exactly `https://jsonfeed.org/version/1.1`.
2. Ensure every converted feed includes `title`, `items`, and `feed_url`.
3. Convert feed-level and item-level `author` objects to `authors` arrays when the producer is under the user's control.
4. Preserve singular `author` only when compatibility with other readers requires it.
5. Preserve extension keys, item IDs, and downstream fields unrelated to conversion.
6. Keep both content fields when other readers need them, but expect Atom conversion to prefer `content_html` over `content_text`.

Do not replace version strings in rejection tests, historical documentation, changelogs, or fixtures intentionally covering JSON Feed 1.0.

## Update public types

Import generated schema types from the package root:

```ts
import type {
  AtomFeed,
  JSONFeed,
  JsonfeedToAtomOptions
} from 'jsonfeed-to-atom'
```

- Treat `JSONFeed.version` as the exact JSON Feed 1.1 literal.
- Populate `feed_url`; the public type and runtime both require it.
- Replace direct imports from generated `lib/*-types` files with package-root type imports when practical.
- Keep raw schema imports only when the consumer genuinely needs JSON Schema at runtime.

The package intentionally has no export map, so published files remain open to deep imports.
Prefer documented public paths over relying on internal `lib/` files.

## Update intermediate object consumers

Use the documented open subpath:

```js
import jsonfeedToAtomObject from 'jsonfeed-to-atom/object.js'
```

Adapt old XML-builder-shaped access to the canonical Atom model:

- `atom.feed.id` becomes `atom.id`.
- `atom.feed.title` becomes `atom.title.value`.
- `atom.feed.entry` becomes `atom.entry`.
- XML-style keys such as `@href`, `@rel`, and `#text` become `href`, `rel`, and `value`.
- Feed and entry authors are arrays.
- Entry content is one object rather than an array of XML nodes.

Search for bracket access to `@` or `#` keys near Atom usage to find indirect dependencies on the old shape.

## Review serializer changes

Expect `application/feed+json`, `xml:lang`, WebSub hub links, multiple Atom authors, enclosure titles, integer enclosure lengths, and HTML preference when both content forms exist.
Expect XML formatting changes from `xmlbuilder2`, including attribute ordering, empty elements, and CDATA layout.
Authors without a name are omitted because Atom person constructs require one.

Review semantic snapshot differences before regenerating expected output.

## Validate the migration

1. Install with the package manager selected by the lockfile.
2. Run focused feed tests, the full suite, type checking, and the production build.
3. Exercise HTML content, text content, author arrays, attachments, language, hubs, and custom URL mapping when the consumer uses them.
4. Confirm the root type imports and `jsonfeed-to-atom/object.js` resolve from the installed package.
5. Confirm remaining JSON Feed 1.0 strings, CommonJS imports, and internal deep imports are intentional.
6. Report any choice that expands beyond this dependency migration.

## Hand off

Summarize:

- the ESM or dynamic-import strategy;
- runtime and CI changes;
- feed, author, and type-contract changes;
- intermediate-object migrations;
- snapshots intentionally refreshed;
- checks run and remaining blockers.
