// Verifica que el package-lock.json tenga resueltas TODAS las dependencias
// transitivas del monorepo. Evita desplegar un lockfile incompleto que
// crashea el server con MODULE_NOT_FOUND (problema recurrente en Railway).
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const p = lock.packages || {};

const missing = [];
Object.keys(p).forEach((k) => {
  const v = p[k];
  if (!v) return;
  const deps = { ...(v.dependencies || {}), ...(v.optionalDependencies || {}) };
  Object.keys(deps).forEach((d) => {
    const has = Object.keys(p).some(
      (pk) => pk === 'node_modules/' + d || pk.endsWith('/node_modules/' + d)
    );
    if (!has) missing.push(`${k} -> ${d}`);
  });
});

// Bins de plataforma (swc, esbuild, etc.) son opcionales y dependen del OS
const platformOnly = /^(@next\/swc-|@esbuild\/|lightningcss-|@turbo\/|fsevents$|esbuild$)/;
const real = missing.filter((m) => !platformOnly.test(m.split(' -> ')[1]));

if (real.length > 0) {
  console.error('LOCKFILE INCOMPLETO — faltan dependencias transitivas:');
  real.forEach((m) => console.error('  ' + m));
  console.error('Regenerá el lockfile: rm -rf node_modules package-lock.json && npm install');
  process.exit(1);
}
console.log('Lockfile OK: todas las dependencias transitivas resueltas');
