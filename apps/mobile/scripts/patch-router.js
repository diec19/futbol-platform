const fs = require('fs');
const path = require('path');

const scriptDir = __dirname;
const appDir = path.resolve(scriptDir, '..');
const rootDir = path.resolve(appDir, '../..');

const ctxFiles = [
  '_ctx.android.js',
  '_ctx.ios.js',
  '_ctx.web.js',
  '_ctx.js',
  '_ctx-html.js',
];

// Possible locations for expo-router ctx files (npm hoisting)
const searchPaths = [
  path.join(appDir, 'node_modules', 'expo-router'),       // apps/mobile/node_modules/
  path.join(rootDir, 'node_modules', 'expo-router'),       // monorepo root node_modules/
  path.join(appDir, 'node_modules', '.pnpm'),              // pnpm (just in case)
];

// ── Ruta relativa correcta desde la ubicación real de expo-router hacia app/ ──
// Caso hoisted (raíz):      node_modules/expo-router -> ../../apps/mobile/app
// Caso local (apps/mobile): apps/mobile/node_modules/expo-router -> ../../app
function ctxReplacement(routerBaseDir) {
  const mobileAppDir = path.join(appDir, 'app');
  let rel = path.relative(routerBaseDir, mobileAppDir).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return `'${rel}'`;
}

function findCtxFile(filename) {
  for (const base of searchPaths) {
    const fp = path.join(base, filename);
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

ctxFiles.forEach((ctxFile) => {
  const filePath = findCtxFile(ctxFile);

  if (!filePath) {
    console.warn(`Skipping ${ctxFile}: not found in any node_modules`);
    return;
  }

  // routerBaseDir = directorio que contiene el _ctx (node_modules/expo-router)
  const routerBaseDir = path.dirname(filePath);
  const appRel = ctxReplacement(routerBaseDir);

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /process\.env\.EXPO_ROUTER_APP_ROOT/g,
    appRel
  );
  content = content.replace(
    /'\.\/app'/g,
    appRel
  );
  // Reemplaza también un patch viejo ('../../app') por la ruta relativa correcta.
  content = content.replace(
    /'\.\.\/\.\.\/app'/g,
    appRel
  );
  content = content.replace(
    /process\.env\.EXPO_ROUTER_IMPORT_MODE/g,
    "'sync'"
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched ${filePath} -> ${appRel}`);
  } else {
    console.log(`Already patched ${filePath} -> ${appRel}`);
  }
});
