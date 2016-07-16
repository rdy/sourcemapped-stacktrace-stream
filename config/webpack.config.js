module.exports = (env, options = {}) => {
  let envConfig = {};
  try {
    envConfig = require(`./${env}`);
  } catch(e) {

  }
  const baseConfig = require('./base');
  return {
    ...baseConfig,
    ...envConfig,
    ...options
  };
};
