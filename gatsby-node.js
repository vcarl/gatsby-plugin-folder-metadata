const path = require("path");

const stringify = (x) => JSON.stringify(x, null, 2);
const log = (...args) =>
  console.log("[folder-metadata]", ...args.map(stringify));
const warn = (...args) =>
  console.warn("[folder-metadata]", ...args.map(stringify));
const error = (...args) =>
  console.error("[folder-metadata]", ...args.map(stringify));

// The metadata is keyed off the relative path of the containing folder. Its
// contents are the complete contents of `metadata.json`, plus a `parent` key
// that contains any content from 1 folder up.
const metadataLookup = {};

const isParentFolder = (folder, maybeParent) =>
  path.relative(folder, maybeParent) === "..";

const buildMetadata = ({ file, instance, metadata }) => {
  // The find will get a [path, data] tuple or null
  const parent = Object.entries(metadataLookup[instance]).find(([path]) =>
    isParentFolder(file.relativeDirectory, path),
  ) || [null, null];
  return {
    data: metadata,
    parent: parent[1],
  };
};

const noteFileExists = ({ file, instance }) =>
  buildMetadata({ file, instance, metadata: null });

const fillChildMetadata = ({ path, instance, metadata }) => {
  Object.entries(metadataLookup[instance]).forEach(([maybeChild, data]) => {
    if (isParentFolder(maybeChild, path) && !data.parent) {
      data.parent = metadata;
    }
  });
};

const defaultIgnoredTypes = ["Directory"];

exports.onCreateNode = ({ node, actions }, options = {}) => {
  const ignoredNodeTypes = options.ignore || defaultIgnoredTypes;
  if (ignoredNodeTypes.includes(node.internal.type)) return;

  // We need the absolute path so we can correctly `require()` these json
  // files, and the relative directory so we can compare their locations sans
  // details like .cache/ or the filename.
  const {
    absolutePath,
    relativeDirectory,
    sourceInstanceName: instance,
    base,
  } = node;
  const dir = `./${relativeDirectory}`;
  if (absolutePath === undefined || relativeDirectory === undefined) {
    return;
  }
  if (!metadataLookup[instance]) {
    metadataLookup[instance] = {};
  }

  const metadataFilename = options.metadataFilename || "metadata.json";

  if (base === metadataFilename) {
    const json = require(absolutePath);
    const metadata = buildMetadata({ file: node, instance, metadata: json });
    // Nodes aren't added strictly from child -> parent, so we need to backfill
    // any child folders that have already been processed.
    fillChildMetadata({ path: dir, instance, metadata });
    metadataLookup[instance][dir] = {
      ...metadataLookup[instance][dir],
      ...metadata,
    };
    // log("building", { instance, dir, metadata, base });
    return;
  }

  const foundMetadata = metadataLookup[instance][dir];
  if (foundMetadata) {
    log("adding metadata to ", { instance, dir, base });
    actions.createNodeField({
      node,
      name: "metadata",
      value: foundMetadata,
    });
  } else {
    const newMetadata = buildMetadata({ file: node, instance, metadata: null });
    metadataLookup[instance][dir] = newMetadata;
    actions.createNodeField({
      node,
      name: "metadata",
      value: newMetadata,
    });
  }
};
