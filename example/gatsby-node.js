const deepEqual = require("deep-equal")
const { SOURCES } = require("./sources")
const childFixture = require("./fixtures/child")
const parentFixture = require("./fixtures/parent")
const completeFixture = require("./fixtures/complete")

const errors = []

const assert = (condition, message) => {
  if (!condition) {
    errors.push(message)
  }
}

const getFilesBySource = (graphql, source) =>
  graphql(`
    {
      allFile(filter: {sourceInstanceName: {eq: "${source}"}}) {
        edges {
          node {
            base
            relativeDirectory
            fields {
              metadata {
                parent {
                  data {
                    id
                    title
                  }
                  parent {
                    data {
                      id
                      title
                    }
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

const stringify = x => JSON.stringify(x, null, 2)
exports.createPages = ({ graphql, actions }) => {
  return Promise.all([
    getFilesBySource(graphql, SOURCES.childOnly),
    getFilesBySource(graphql, SOURCES.parentOnly),
    getFilesBySource(graphql, SOURCES.completeMetadata),
  ]).then(([childOnly, parentOnly, completeMetadata]) => {
    assert(deepEqual(childOnly, childFixture), "child data must be deep equal")
    assert(
      deepEqual(parentOnly, parentFixture),
      "parent data must be deep equal"
    )
    assert(
      deepEqual(completeMetadata, completeFixture),
      "complete data must be deep equal"
    )

    if (errors.length > 0) {
      errors.forEach(x => console.error(x))
      throw new Error(
        `Some tests failed, output must exactly match fixture data`
      )
    }
  })
}
