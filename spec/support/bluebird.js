const {Promise} = global;
const Bluebird = require('bluebird');
const {default: defaultPromise} = require('babel-runtime/core-js/promise');

beforeAll(() => {
  Bluebird.config({
    warnings: false,
    longStackTraces: true,
    monitoring: true
  });
  global.Promise = Bluebird;
  require('babel-runtime/core-js/promise').default = Bluebird;
});

afterAll(() => {
  global.Promise = Promise;
  require('babel-runtime/core-js/promise').default = defaultPromise;
  delete require.cache[require.resolve(__filename)];
});