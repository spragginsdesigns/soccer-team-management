const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the parent directory for convex and lib folders
config.watchFolders = [workspaceRoot];

// Resolve modules from both the project and workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Allow importing from parent directory
config.resolver.extraNodeModules = {
  '@convex': path.resolve(workspaceRoot, 'convex'),
  '@lib': path.resolve(workspaceRoot, 'lib'),
};

module.exports = config;
