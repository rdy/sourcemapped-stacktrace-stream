require('babel-polyfill');
require('jasmine-ajax');
require('./support/bluebird');
const JasmineAsync = require('jasmine-async-suite');
const MockNextTick = require('./support/mock_next_tick');
const MockFetch = require('./support/mock_fetch');
const MockPromises = require('mock-promises');

JasmineAsync.install();
MockNextTick.install();
MockFetch.install();

const globals = {
  MockNextTick,
  MockPromises
};

Object.assign(global, globals);

beforeEach(() => {
  jasmine.clock().install();
  jasmine.Ajax.install();
  MockPromises.install(Promise);

  jasmine.addMatchers({
    toBeEmpty() {
      return {
        compare(actual) {
          const pass = Array.isArray(actual) ? !actual.length : !Object.keys(actual).length;
          return {pass};
        }
      };
    }
  });
});

afterEach(() => {
  MockPromises.contracts.reset();
  MockNextTick.next();
  jasmine.clock().uninstall();
  jasmine.Ajax.uninstall();
});

afterAll(() => {
  Object.keys(globals).forEach(key => delete global[key]);
  JasmineAsync.uninstall();
  MockNextTick.uninstall();
  MockFetch.uninstall();
  MockPromises.uninstall();
});