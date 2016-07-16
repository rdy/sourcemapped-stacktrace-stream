const compact = require('lodash.compact');
const {Readable} = require('stream');
const {fetchScript} = require('./fetch_helper');
const {map, merge, readArray, split, through} = require('event-stream');

function getSourcemapMeta() {
  if (SourcemappedStacktrace.isChrome()) {
    return {
      regex: /^ +at.+\((.*):([0-9]+):([0-9]+)/,
      expectedFields: 4,
      skipLines: 1
    };
  }
  if (SourcemappedStacktrace.isFirefox()) {
    return {
      regex: /@(.*):([0-9]+):([0-9]+)/,
      expectedFields: 4,
      skipLines: 0
    };
  }
}

function toText({promise, uri}) {
  return promise
    .then(response => (response.status === 200 || uri.slice(0, 7) === 'file://' && !response.status) && response.text());
}

function uniqUri(result) {
  return Object.values(result.reduce((memo, i) => (!memo[i.uri] && (memo[i.uri] = i), memo), {}));
}

const SourcemappedStacktrace = {
  isChrome() {
    return navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  },

  isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  },

  mapStacktraces(stacktraces) {
    const meta = getSourcemapMeta();
    if (!meta) throw new Error('unknown browser :(');
    const {regex, expectedFields, skipLines} = meta;

    const sources = new Map();
    return new Readable({objectMode: true}).wrap(readArray(stacktraces))
      .pipe(through(async function(data) {
        const result = data.split('\n').slice(skipLines).reduce((memo, line) => {
          const fields = line.match(regex);
          if  (!fields || fields.length !== expectedFields) return memo;
          const uri = fields[1];
          if (uri.match(/<anonymous>/)) return memo;
          if (!sources.has(uri)) sources.set(uri, fetchScript(uri));
          memo.push({uri, promise: sources.get(uri), line});
          return memo;
        }, []);
        this.pause();
        try {
          // merge(compact(await Promise.all(uniqUri(result).map(toText))))
          //   .pipe(map(data => {
          //     console.log(data);
          //   }));
        } finally {
          this.resume();
        }
        const lines = result.map(i => i.line);
        if (lines.length) this.queue(lines.join('\n'));
      }));
  }
};

module.exports = SourcemappedStacktrace;