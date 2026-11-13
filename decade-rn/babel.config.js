module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo adds the Reanimated / Worklets plugin automatically when it is installed
  return { presets: ['babel-preset-expo'] };
};
