const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const distDir = path.join(rootDir, "dist");
const runtimeDependencyNames = [
  "@inrupt/solid-client",
  "@inrupt/solid-client-authn-browser",
  "@inrupt/vocab-common-rdf",
  "@react-oauth/google",
  "react-router-dom",
  "recharts",
];
const runtimeDependencies = Object.fromEntries(
  runtimeDependencyNames
    .filter((name) => pkg.dependencies?.[name])
    .map((name) => [name, pkg.dependencies[name]])
);

const distPkg = {
  name: pkg.name,
  version: pkg.version,
  license: pkg.license,
  main: "./embed/index.cjs",
  module: "./embed/index.js",
  exports: {
    "./embed": {
      import: "./embed/index.js",
      require: "./embed/index.cjs",
    },
    "./embed.css": "./embed/embed.css",
  },
  dependencies: runtimeDependencies,
  peerDependencies: pkg.peerDependencies,
  sideEffects: pkg.sideEffects || ["**/*.css"],
  publishConfig: pkg.publishConfig,
};

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify(distPkg, null, 2) + "\n");
