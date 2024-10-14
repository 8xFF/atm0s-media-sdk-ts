const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const {
    resolver: { sourceExts, assetExts },
  } = getDefaultConfig(__dirname);

const config = {
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
        // babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    // projectRoot: path.resolve(__dirname, '.'),
    watchFolders: [
        path.resolve(__dirname, '../../node_modules'),
        path.resolve(__dirname + '/../../node_modules/@atm0s-media-sdk/core'),
        path.resolve(__dirname + '/../../node_modules/@atm0s-media-sdk/react-hooks'),
        path.resolve(__dirname + '/../../node_modules/@atm0s-media-sdk/react-native-ui'),
    ],
    resolver: {
        // assetExts: assetExts.filter(ext => ext !== 'svg'),
        sourceExts: [...sourceExts, 'jsx', 'js', 'ts', 'tsx', 'cjs', 'json', 'd.ts', 'svg'],
        extraNodeModules: {
            "@atm0s-media-sdk/core": path.resolve(__dirname, '../../node_modules/@atm0s-media-sdk/core'),
            "@atm0s-media-sdk/react-hooks": path.resolve(__dirname, '../../node_modules/@atm0s-media-sdk/react-hooks'),
            "@atm0s-media-sdk/react-native-ui": path.resolve(__dirname, '../../node_modules/@atm0s-media-sdk/react-native-ui'),
        },
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
