const { description } = require("./package.json")
const { SOURCES } = require("./sources")

const fileSource = name => ({
  resolve: "gatsby-source-filesystem",
  options: {
    name: name,
    path: `${__dirname}/src/${name}`,
  },
})

module.exports = {
  siteMetadata: {
    title: "test project",
    description,
    author: "@vcarl_",
  },
  plugins: [
    {
      resolve: "gatsby-plugin-folder-metadata",
      options: { logLevel: "verbose" },
    },
    fileSource(SOURCES.childOnly),
    fileSource(SOURCES.parentOnly),
    fileSource(SOURCES.completeMetadata),
  ],
}
