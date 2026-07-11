# Vendored schemas

`feed.json` and `feed-1` come from SchemaStore commit `2bddc5b460260b841408495fbcb31a267d1bbeb1`.

The files are distributed under the Apache License 2.0 in this directory.
They are modified only with `tsType` hints so `json-schema-to-typescript` represents extension keys as `unknown` instead of applying the extension-object type to every standard property.
