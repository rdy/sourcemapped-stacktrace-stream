require('../spec_helper');

describe('SourcemappedStacktrace', () => {
  let SourcemappedStacktrace, map;
  beforeEach(() => {
    map = require('event-stream').map;
    SourcemappedStacktrace = require('../../src/index');
  });

  describe('#mapStacktrace', () => {
    const stacktrace = require('../fixtures/stacktrace');
    const sourcemappedStacktrace = require('../fixtures/sourcemapped_stacktrace');
    let data, stream;
    beforeEach(() => {
      data = [];
    });

    afterEach(() => {
      if (stream) stream.destroy();
    });

    describe('when the browser is not chrome or firefox', () => {
      beforeEach(() => {
        spyOn(SourcemappedStacktrace, 'isChrome').and.returnValue(false);
        spyOn(SourcemappedStacktrace, 'isFirefox').and.returnValue(false);
      });

      it('throws an error', () => {
        expect(() => {
          stream = SourcemappedStacktrace.mapStacktraces([stacktrace]).pipe(map(function(d, callback) {
            data.push(d);
            callback(null, d);
          }));
          MockNextTick.next();
        }).toThrowError('unknown browser :(');
      });
    });

    describe('when the browser is chrome or firefox', () => {
      beforeEach(() => {
        stream = SourcemappedStacktrace.mapStacktraces([stacktrace]).pipe(map(function(d, callback) {
          data.push(d);
          callback(null, d);
        }));
        MockNextTick.next();
      });

      it('makes a unique ajax request for each script', () => {
        expect(jasmine.Ajax.requests.filter(/.*/).map(req => req.url)).toEqual([
          'http://localhost:8888/', 'http://localhost:8888/spec.js'
        ]);
      });

      describe('when the ajax requests are successful', () => {
        beforeEach(() => {
          const times = require('lodash.times');
          jasmine.Ajax.requests.filter(/.*/).forEach(r => {
            r.respondWith({status: 200, responseText: times(8).map(() => 'some response').join('\n')});
          });
          MockPromises.tick(10);
        });

        it('works', () => {
          expect(data).not.toBeEmpty();
          expect(data).toEqual([sourcemappedStacktrace]);
        });
      });
    });
  });
});