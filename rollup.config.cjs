const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const babel = require("@rollup/plugin-babel");
const postcss = require("rollup-plugin-postcss");

const extensions = [".js", ".jsx", ".ts", ".tsx"];
const external = (id) =>
  id === "react" ||
  id === "react-dom" ||
  id === "react-router-dom" ||
  id === "@react-oauth/google" ||
  id === "recharts" ||
  id.startsWith("@inrupt/") ||
  id.startsWith("@mui/") ||
  id.startsWith("@emotion/");

module.exports = {
  input: "src/embed/index.ts",
  output: [
    {
      file: "dist/embed/index.js",
      format: "es",
      sourcemap: true,
    },
    {
      file: "dist/embed/index.cjs",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
  ],
  external,
  plugins: [
    resolve({ extensions }),
    postcss({
      extract: "embed.css",
      minimize: false,
    }),
    babel({
      babelHelpers: "bundled",
      extensions,
      presets: [
        ["@babel/preset-env", { targets: { esmodules: true } }],
        ["@babel/preset-react", { runtime: "classic" }],
        "@babel/preset-typescript",
      ],
    }),
    commonjs({ include: /node_modules/ }),
  ],
};
