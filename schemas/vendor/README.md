# Vendored schemas

`feed.json` and `feed-1` come from SchemaStore commit `01e00802b38350cb7ec257b11c456639a5cd0acf`.

The files are distributed under the Apache License 2.0 in this directory.
They are modified only with `tsType` hints so `json-schema-to-typescript` represents extension keys as `unknown` instead of applying the extension-object type to every standard property.
