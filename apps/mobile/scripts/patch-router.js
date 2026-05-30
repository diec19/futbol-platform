const fs = require('fs');
const path = require('path');

const scriptDir = __dirname;
const appDir = path.resolve(scriptDir, '..');
const rootDir = path.resolve(appDir, '../..');

const platforms = ['android', 'ios', 'web'];

// Possible locations for expo-router ctx files (npm hoisting)
const searchPaths = [
  path.join(appDir, 'node_modules', 'expo-router'),       // apps/mobile/node_modules/
  path.join(rootDir, 'node_modules', 'expo-router'),       // monorepo root node_modules/
  path.join(appDir, 'node_modules', '.pnpm'),              // pnpm (just in case)
];

function findCtxFile(filename) {
  for (const base of searchPaths) {
    const fp = path.join(base, filename);
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

platforms.forEach((p) => {
  const ctxFile = `_ctx.${p}.js`;
  const filePath = findCtxFile(ctxFile);

  if (!filePath) {
    console.warn(`Skipping ${ctxFile}: not found in any node_modules`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /process\.env\.EXPO_ROUTER_APP_ROOT/g,
    "'./app'"
  );
  content = content.replace(
    /process\.env\.EXPO_ROUTER_IMPORT_MODE/g,
    "'sync'"
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched ${filePath}`);
  } else {
    console.log(`Already patched ${filePath}`);
  }
});
