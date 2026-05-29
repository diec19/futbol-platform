const fs = require('fs');
const path = require('path');

const platforms = ['android', 'ios', 'web'];

platforms.forEach((p) => {
  const filePath = path.join(
    __dirname,
    '..',
    'node_modules',
    'expo-router',
    `_ctx.${p}.js`
  );

  if (!fs.existsSync(filePath)) {
    console.warn(`Skipping ${filePath}: not found`);
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
    console.log(`Patched _ctx.${p}.js`);
  } else {
    console.log(`Already patched _ctx.${p}.js`);
  }
});
