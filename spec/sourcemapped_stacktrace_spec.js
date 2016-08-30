require('./spec_helper');

describe('SourcemappedStacktrace', () => {
  let BrowserHelper, SourcemappedStacktrace, through;
  beforeEach(() => {
    through = require('through2').obj;
    BrowserHelper = require('../src/helpers/browser_helper');
    SourcemappedStacktrace = require('../src/sourcemapped_stacktrace');
  });

  describe('#mapStacktrace', () => {
    const stacktrace = require('./fixtures/stacktrace');
    let result, stream;
    beforeEach(() => {
      result = [];
    });

    afterEach(() => {
      if (stream) stream.destroy();
    });

    describe('when the browser is not chrome or firefox', () => {
      beforeEach(() => {
        spyOn(BrowserHelper, 'isChrome').and.returnValue(false);
        spyOn(BrowserHelper, 'isFirefox').and.returnValue(false);
      });

      it('throws an error', () => {
        expect(() => {
          stream = SourcemappedStacktrace.mapStacktraces([stacktrace]).pipe(through((d, enc, next) => next(null, d)));
          MockNextTick.next();
        }).toThrowError('unknown browser :(');
      });
    });

    describe('when the browser is chrome or firefox', () => {
      let onStacktraceSpy;
      beforeEach(() => {
        spyOn(BrowserHelper, 'isChrome').and.returnValue(true);
        spyOn(BrowserHelper, 'isFirefox').and.returnValue(false);

        onStacktraceSpy = jasmine.createSpy('onStacktrace');
        stream = SourcemappedStacktrace.mapStacktraces([stacktrace], {onStacktrace: onStacktraceSpy}).pipe(through((d, enc, next) => next(null, result.push(d))));
        MockNextTick.next();
      });

      it('makes a unique ajax request for each script', () => {
        expect(jasmine.Ajax.requests.filter(/.*/).map(req => req.url)).toEqual([
          'http://localhost:8888/', 'http://localhost:8888/spec.js'
        ]);
      });

      describe('when the ajax requests are successful', () => {
        let request;
        const sourcemappedStacktrace = require('./fixtures/sourcemapped_stacktrace');
        beforeEach(() => {
          jasmine.Ajax.requests.filter(/.*/).forEach(r => {
            r.respondWith({status: 200, responseText: '//# sourceMappingURL=spec.js.map'});
          });
          jasmine.Ajax.requests.reset();
          MockPromises.tick(5);
          MockNextTick.next();
          request = jasmine.Ajax.requests.mostRecent();
        });

        it('makes an ajax request for the source map', () => {
          expect(jasmine.Ajax.requests.count()).toBe(1);
          expect(request.url).toEqual('http://localhost:8888/spec.js.map');
        });

        describe('when the ajax request is successful', () => {
          const sourcemap = require('./fixtures/sourcemap.map.json');
          beforeEach(() => {
            request.respondWith({status: 200, responseText: JSON.stringify(sourcemap)});
            MockPromises.tick(7);
          });

          it('returns the sourcemapped stacktrace as a stream', () => {
            expect(result).not.toBeEmpty();
            expect(result[0]).toEqual({stacktrace, sourcemappedStacktrace});
          });

          it('calls the onStacktrace callback with the sourcemapped stacktrace', () => {
            expect(onStacktraceSpy.calls.count()).toBe(1);
            expect(onStacktraceSpy).toHaveBeenCalledWith({stacktrace, sourcemappedStacktrace}, 0, jasmine.any(Array));
          });
        });
      });
    });
  });
});