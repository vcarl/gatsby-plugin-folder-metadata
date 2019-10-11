const path = require("path");

// The metadata is keyed off the relative path of the containing folder. Its
// contents are the complete contents of `metadata.json`, plus a `parent` key
// that contains any content from 1 folder up.
const rawMetadata = {};
const metadataLookup = {};
const allReferencedNodes = [];

const isParentFolder = (folder, maybeParent) =>
  path.relative(folder, maybeParent) === "..";

const buildMetadata = ({ node, instance, metadata }) => {
  const parent = Object.entries(metadataLookup[instance]).find(([directory]) =>
    isParentFolder(node.relativeDirectory, directory),
  ) || [null, null];
  return {
    data: metadata,
    parent: parent[1],
  };
};

const includeNodeTypes = ["File"];

exports.onCreateNode = ({ node, actions }, options = {}) => {
  const nodeTypes = options.includeNodeTypes || includeNodeTypes;
  if (!nodeTypes.includes(node.internal.type)) return;

  // We need the absolute path so we can correctly `require()` these json
  // files, and the relative directory so we can compare their locations sans
  // details like .cache/ or the filename.
  const {
    absolutePath,
    relativeDirectory,
    sourceInstanceName: instance,
    base,
  } = node;
  if (absolutePath === undefined || relativeDirectory === undefined) {
    return;
  }
  const dir = `./${relativeDirectory}`;

  if (!rawMetadata[instance]) {
    rawMetadata[instance] = {};
  }

  // Load all metadata. We don't need to add metadata to metadata files, so don't
  // add them to the list of file nodes.
  const metadataFilename = options.metadataFilename || "metadata.json";
  if (base === metadataFilename) {
    const json = require(absolutePath);
    rawMetadata[instance][dir] = json;
  }

  allReferencedNodes.push(node);
};

const getNodeInfo = ({ relativeDirectory, sourceInstanceName: instance }) => ({
  dir: `./${relativeDirectory}`,
  instance,
});

exports.createSchemaCustomization = ({ actions }) => {
  const sortedNodes = allReferencedNodes.sort((a, b) => {
    const aLength = a.absolutePath.split(path.sep).length;
    const bLength = b.absolutePath.split(path.sep).length;
    return aLength - bLength;
  });
  sortedNodes.forEach((node) => {
    const { dir, instance } = getNodeInfo(node);
    if (!metadataLookup[instance]) {
      metadataLookup[instance] = {};
    }
    metadataLookup[instance][dir] = buildMetadata({
      node,
      instance,
      metadata: rawMetadata[instance][dir],
    });
  });
  sortedNodes.forEach((node) => {
    const { dir, instance } = getNodeInfo(node);

    actions.createNodeField({
      node,
      name: "metadata",
      value: buildMetadata({
        node,
        instance,
        metadata: rawMetadata[instance][dir],
      }),
    });
  });
};
