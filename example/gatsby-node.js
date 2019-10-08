const { SOURCES } = require("./sources")

const assert = (message, predicate) => {
  if (!predicate()) throw new Error(``)
}

const getFilesBySource = (graphql, source) =>
  graphql(`
    {
      allFile({filter: {sourceInstanceName: {eq: "${source}"}}}) {
        edges {
          node {
            relativeDirectory
            fields {
              metadata {
                parent {
                  data {
                    id
                    title
                  }
                }
                data {
                  title
                  id
                }
              }
            }
          }
        }
      }
    }
  `)

// const testCompleteMetadata = complete => {
//   const root = complete.find(m => m.relativeDirectory)
// }

exports.createPages = ({ graphql, actions }) => {
  return Promise.all([
    getFilesBySource(graphql, SOURCES.childOnly),
    getFilesBySource(graphql, SOURCES.parentOnly),
    getFilesBySource(graphql, SOURCES.completeMetadata),
  ]).then(([childOnly, parentOnly, completeMetadata]) => {})
}
