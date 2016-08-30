const through = require('through');
const from = require('from');

function slice(string, start, size) {
  return string.slice(start < 0 ? 0 :start, start + size);
}

const StreamHelper = {
  textToStream(text, matcher = /\r?\n/, {find, highWaterMark = 1024, reverse} = {}) {
    let buffer = '';
    let start = reverse ? text.length - 1 : 0;

    const sliced = reverse ?
      (buffer, start, highWaterMark) => slice(text, start, highWaterMark) + buffer :
      (buffer, start, highWaterMark) => buffer + text.slice(start, start + highWaterMark);
    const increment = reverse ? start => start - highWaterMark : start => start + highWaterMark;
    const split = reverse ? (buffer, matcher) => buffer.split(matcher).reverse() : (buffer, matcher) => buffer.split(matcher);
    const queue = typeof find === 'function' ? data => {
      if (find(data)) {
        stream.emit('data', data);
        stream.emit('end');
        return true;
      }
    } : data => (stream.emit('data', data), false);

    const stream = from(function(count, next) {
      buffer = sliced(buffer, start, highWaterMark);
      let chunks = split(buffer, matcher);
      if (chunks.slice(0, -1).find(queue)) return;
      buffer = chunks.slice(-1)[0];
      start = increment(start);
      if (count * highWaterMark < text.length) return setImmediate(next);
      if (queue(buffer)) return;
      this.emit('end');
    });
    return stream;
  },

  unique(mapper) {
    const set = new Set();
    return through(function(data) {
      const obj = mapper ? mapper(data) : data;
      if (set.has(obj)) return;
      set.add(obj);
      this.queue(data);
    }, function() {
      set.clear();
      this.queue(null);
    });
  }
};

module.exports = StreamHelper;