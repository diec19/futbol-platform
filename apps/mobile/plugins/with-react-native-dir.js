// Config plugin: inyecta REACT_NATIVE_NODE_MODULES_DIR en app/build.gradle
// para que los modulos nativos (react-native-screens) encuentren react-native
// hoisted en la raiz del monorepo (node_modules/react-native), no en apps/mobile.
const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withReactNativeNodeModulesDir(config) {
  return withAppBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults.contents;

    // react-native-screens usa REACT_NATIVE_NODE_MODULES_DIR como la ruta
    // DIRECTA al directorio de react-native y luego hace
    // file("$value/ReactAndroid/gradle.properties"). En el monorepo,
    // react-native esta hoisted en la raiz:
    // apps/mobile/android/app -> ../../../node_modules/react-native
    const injection = `\n// (config-plugin) Monorepo: react-native hoisted en la raiz\next.REACT_NATIVE_NODE_MODULES_DIR = rootProject.file("../../../node_modules/react-native");\n`;

    if (!gradle.includes('REACT_NATIVE_NODE_MODULES_DIR')) {
      cfg.modResults.contents = gradle.replace(
        /^android\s*\{/m,
        injection + 'android {'
      );
    }

    return cfg;
  });
};
