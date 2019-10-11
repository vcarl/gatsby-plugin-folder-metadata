# gatsby-plugin-folder-metadata

While building a large and complex website, I ran into a situation where I
wanted to be able to have metadata that applied to every file within a folder.
This plugin reads in `metadata.json` files and adds them to the `metadata.data`
field on Gatsby `File` nodes.

If a parent folder has metadata, it's included under the `metadata.parent`
field. This allows a single node to respond to all metadata that may be
relevant. For instance, this allows metadata to be used to assign a different
path to be used when generating pages from a folder's contents.

For instance, for `.mdx` files, you can query the metadata generated by this
plugin with

```graphql
query YourQuery {
  allMdx {
    edges {
      node {
        parent {
          ... on File {
            fields {
              metadata {
                data {
                  your
                  json
                  keys
                }
              }
            }
          }
        }
      }
    }
  }
}
```

It's verbose and a little awkward, but it means that the only requirement for
using this plugin is using source plugins that generate `File` nodes. This lets
it compose well with other plugin without knowledge of them.