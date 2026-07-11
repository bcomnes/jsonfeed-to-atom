---
name: migrate-jsonfeed-to-atom
description: Migrate applications from jsonfeed-to-atom 1.x to the ESM-only JSON Feed 1.1 release. Use when a project imports jsonfeed-to-atom with CommonJS, emits JSON Feed 1.0 documents, accesses jsonfeed-to-atom-object directly, has snapshots affected by the new Atom serializer, or needs its Node and CI requirements updated for the new package.
---

# Migrate jsonfeed-to-atom

Upgrade a consuming project without broad, unrelated module-system changes.
Treat the consumer's tests and generated feed fixtures as the migration boundary.

## Inspect before editing

1. Read the package manifest, lockfile, Node engine, and CI runtime configuration.
2. Find every package import, intermediate-object import, feed builder, JSON fixture, and related snapshot.
3. Determine whether the project is already ESM, fully CommonJS, or mixed.
4. Read the package's `MIGRATION.md` when it is available in the checked-out source or installed package.

Start with searches like:

```console
rg "jsonfeed-to-atom|jsonfeed.org/version/1|feed_url|authors?" .
```

Exclude dependency folders, generated coverage, and unrelated archived data when broad matches become noisy.

## Choose the module boundary

- Use a static default import when the consumer is already ESM: `import jsonfeedToAtom from 'jsonfeed-to-atom'`.
- Use `await import('jsonfeed-to-atom')` at a narrow asynchronous boundary when the application must remain CommonJS.
- Convert the whole application to ESM only when that broader migration is explicitly in scope.
- Do not add `"type": "module"` without checking all `.js` entry points, tests, configuration files, and scripts.
- Raise the consumer and CI runtime to Node.js 20.19 or newer.

## Update the feed contract

1. Change feed versions to exactly `https://jsonfeed.org/version/1.1`.
2. Convert feed-level and item-level `author` objects to `authors` arrays where the producer is under the user's control.
3. Preserve singular `author` only when backward compatibility with other readers requires it; the new converter still accepts it.
4. Preserve extension keys and existing item IDs.
5. Ensure every feed has `title`, `items`, and `feed_url`; the converter requires `feed_url` to construct the Atom ID and self link.
6. Keep both `content_html` and `content_text` if downstream JSON Feed readers need them, but expect the Atom conversion to choose HTML.

Do not blindly replace version strings in rejection tests, historical documentation, changelogs, or fixtures intentionally covering JSON Feed 1.0.

## Update intermediate object consumers

Replace file-path imports with:

```js
import jsonfeedToAtomObject from 'jsonfeed-to-atom/object'
```

Adapt old XML-builder-shaped access to the canonical Atom model:

- `atom.feed.id` becomes `atom.id`.
- `atom.feed.title` becomes `atom.title.value`.
- `atom.feed.entry` becomes `atom.entry`.
- XML-style keys such as `@href`, `@rel`, and `#text` become `href`, `rel`, and `value`.
- Feed and entry authors are arrays.
- Entry content is one object rather than an array of XML nodes.

Search for bracket access to `@` or `#` keys near Atom object usage; those often reveal indirect dependencies on the old shape.

## Validate intentionally

1. Install with the package manager implied by the lockfile.
2. Run the consumer's focused feed tests, full test suite, type check, and production build when available.
3. Exercise at least one HTML item, text item, author array, attachment, and custom URL mapper when the project uses those paths.
4. Review XML and object snapshot diffs for semantic changes before regenerating expected files.
5. Confirm that remaining JSON Feed 1.0 strings and CommonJS imports are intentional.
6. Report any migration choice that expands beyond this package, especially a whole-project ESM conversion.

Expected serializer differences include `application/feed+json`, `xml:lang`, WebSub hub links, multiple Atom authors, enclosure titles, HTML preference when both content forms exist, and formatting changes from `xmlbuilder2`.
Authors without a `name` are omitted because an Atom person construct requires one.

## Hand off

Summarize:

- the chosen ESM or dynamic-import strategy;
- feed and author contract changes;
- intermediate object migrations;
- snapshots intentionally refreshed;
- checks run and any remaining blockers.
