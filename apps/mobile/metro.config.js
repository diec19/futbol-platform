const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {};

config.resolver.blockList = [/node_modules\/expo\/node_modules\/react-native\/.*/];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, moduleName, platform) => {
  if (moduleName.startsWith('expo-router/_ctx')) {
    return ctx.resolveRequest(ctx, path.join(projectRoot, 'router-ctx.android.js'), platform);
  }
  if (typeof originalResolveRequest === 'function') {
    return originalResolveRequest(ctx, moduleName, platform);
  }
  return ctx.resolveRequest(ctx, moduleName, platform);
};

module.exports = config;
