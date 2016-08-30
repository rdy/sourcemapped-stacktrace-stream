require('../spec_helper');

describe('StreamHelpers', () => {
  let from, subject, through;
  beforeEach(() => {
    from = require('from');
    through = require('through');
    subject = require('../../src/helpers/stream_helper');
  });

  describe('#textToStream', () => {
    describe('when the chunks are smaller than the high water mark', () => {
      it('returns a stream broken up by newlines', () => {
        const chunks = ['the', 'quick', 'brown', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog'];
        const result = [];
        const stream = subject.textToStream(chunks.join('\n'), undefined, {highWaterMark: 5});
        stream.pipe(through(data => result.push(data)));
        MockNextTick.next();
        expect(result).toEqual(chunks);
        stream.destroy();
      });

      describe('when find option is a function', () => {
        it('returns a stream that matches the first occurence of find', () => {
          const chunks = ['the', 'quick', 'brown', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog'];
          const result = [];
          const stream = subject.textToStream(chunks.join('\n'), undefined, {highWaterMark: 5, find(d) { return d === 'quick'; }});
          stream.pipe(through(data => result.push(data)));
          MockNextTick.next();
          expect(result).toEqual(['quick']);
          stream.destroy();
        });
      });

      describe('when the reverse option is true', () => {
        it('returns a revered stream broken up by newlines', () => {
          const chunks = ['the', 'quick', 'brown', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog'];
          const result = [];
          const stream = subject.textToStream(chunks.join('\n'), undefined, {reverse: true, highWaterMark: 5});
          stream.pipe(through(data => result.push(data)));
          MockNextTick.next();
          expect(result).toEqual([...chunks].reverse());
          stream.destroy();
        });
      });
    });

    describe('when the chunks are larger than the high water mark', () => {
      describe('when there is only 1 chunk', () => {
        it('returns a stream broken up by newlines', () => {
          const chunk = 'the quick brown fox jumped over the lazy dog';
          const result = [];
          const stream = subject.textToStream(chunk, undefined, {highWaterMark: 5});
          stream.pipe(through(data => result.push(data)));
          MockNextTick.next();
          expect(result).toEqual([chunk]);
          stream.destroy();
        });
      });

      describe('when there is more than 1 chunk', () => {
        it('returns a stream broken up by newlines', () => {
          const chunks = ['the quick brown fox', 'jumped over the lazy dog'];
          const result = [];
          const stream = subject.textToStream(chunks.join('\n'), undefined, {highWaterMark: 5});
          stream.pipe(through(data => result.push(data)));
          MockNextTick.next();
          expect(result).toEqual(chunks);
          stream.destroy();
        });

        describe('when the reverse option is true', () => {
          it('returns a revered stream broken up by newlines', () => {
            const chunks = ['the quick brown fox', 'jumped over the lazy dog'];
            const result = [];
            const stream = subject.textToStream(chunks.join('\n'), undefined, {reverse: true, highWaterMark: 5});
            stream.pipe(through(data => result.push(data)));
            MockNextTick.next();
            expect(result).toEqual([...chunks].reverse());
            stream.destroy();
          });
        });
      });
    });
  });

  describe('#unique', () => {
    it('returns a stream with unique data', () => {
      const chunks = ['one', 'two', 'one', 'two', 'three', 'four'];
      const result = [];
      const stream = from(chunks);
      stream.pipe(subject.unique()).pipe(through(data => result.push(data)));
      MockNextTick.next();
      expect(result).toEqual(['one', 'two', 'three', 'four']);
      stream.destroy();
    });

    describe('when given a mapping function', () => {
      it('returns a stream with unique data using that mapping function', () => {
        const chunks = [{one: 'one'}, {one: 'one'}, {two: 'two'}];
        const result = [];
        const stream = from(chunks);
        stream.pipe(subject.unique(JSON.stringify)).pipe(through(data => result.push(data)));
        MockNextTick.next();
        expect(result).toEqual([{one: 'one'}, {two: 'two'}]);
        stream.destroy();
      });
    });
  });
});