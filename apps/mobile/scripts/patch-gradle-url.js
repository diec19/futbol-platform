// Parchea gradle-wrapper.properties para que descargue Gradle desde el CDN
// oficial (gradle-dn.com) en vez de GitHub Releases. GitHub a veces devuelve
// 503 al descargar gradle-X-all.zip, lo que rompe el build de EAS.
const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '..');
const candidates = [
  path.join(appDir, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties'),
  path.join(appDir, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties.template'),
];

// CDN oficial de Gradle (evita la redireccion a github.com/gradle/gradle-distributions)
const CDN_BASE = 'https://downloads.gradle-dn.com/distributions';

for (const filePath of candidates) {
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Reemplaza cualquier distributionUrl que apunte a github/gradle-distributions
  content = content.replace(
    /distributionUrl=.*gradle-(.+?)-all\.zip/g,
    (match, version) => `distributionUrl=${CDN_BASE}/gradle-${version}-all.zip`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched gradle wrapper: ${filePath}`);
  } else {
    console.log(`Gradle wrapper already patched (or not found): ${filePath}`);
  }
}
