const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const target = path.join(rootDir, "src", "version.ts");

fs.writeFileSync(target, `export const appVersion = "${pkg.version}";\n`);
