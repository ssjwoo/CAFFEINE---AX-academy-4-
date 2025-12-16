module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-syntax-flow',
      '@babel/plugin-transform-flow-strip-types',
      // Commented out due to worklets plugin issue
      // 'react-native-reanimated/plugin'
    ]
  };
};
