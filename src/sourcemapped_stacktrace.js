const {fetchText} = require('./helpers/fetch_helper');
const from = require('from');
const {textToStream, unique} = require('./helpers/stream_helper');
const through = require('through');
const flatMap = require('flat-map');
const reduce = require('stream-reduce');
const {formatOriginalPosition, originalName, getSourcemapMeta, toSourceMap} = require('./helpers/source_map_helper');
const {SourceMapConsumer} = require('source-map');

function processSourceMap(data, stacktraces, skipLines) {
  return stacktraces.map(stacktrace => {
    if (!data.has(stacktrace)) return {stacktrace, sourcemappedStacktrace: null};
    const sourceMapForRow = data.get(stacktrace);
    const sourcemappedStacktrace = stacktrace.split('\n').slice(skipLines).map(row => {
      if (!sourceMapForRow.has(row)) return row;
      const {sourceMap, fields: [,, line, column], uri} = sourceMapForRow.get(row);
      if (!sourceMap) return formatOriginalPosition(uri, line, column, originalName(row));
      const originalPosition = sourceMap.originalPositionFor({line: +line, column: +column});
      return formatOriginalPosition(originalPosition.source,
        originalPosition.line || line, originalPosition.column || column, originalPosition.name || originalName(row));
    }).join('\n');
    return {stacktrace, sourcemappedStacktrace};
  });
}

const SourcemappedStacktrace = {
  mapStacktraces(stacktraces, {onStacktrace} = {}) {
    const meta = getSourcemapMeta();
    if (!meta) throw new Error('unknown browser :(');
    const {regex, expectedFields, skipLines} = meta;

    const cache = new Map();

    return from(stacktraces)
      .pipe(flatMap((stacktrace, next) => next(null, stacktrace.split('\n').slice(skipLines).map(line => ({line, stacktrace})))))
      .pipe(through(function({line, stacktrace}) {
        const fields = line.match(regex) || [];
        if (!fields || fields.length !== expectedFields) return;
        const uri = fields[1];
        if (!uri.match(/<anonymous>/)) this.queue({line, fields, stacktrace, uri});
      }))
      .pipe(unique(JSON.stringify))
      .pipe(flatMap(({uri, ...rest}, next) => next(null, fetchText(uri, {cache}).then(text => ({...rest, text, uri})))))
      .pipe(flatMap(({text, ...rest}, next) => {
        textToStream(text, undefined, {reverse: true, find(data) {
          const [, mapUri] = data.match('//# [s]ourceMappingURL=(.*)[\\s]*$', 'm') || [];
          if (mapUri) return (next(null, {...rest, mapUri}), true);
        }});
      }))
      .pipe(flatMap((data, next) => next(null, toSourceMap(data, {cache}).then(sourceMap => ({...data, sourceMap})))))
      .pipe(reduce((memo, {stacktrace, line, sourceMap, ...rest}) => {
        sourceMap = new SourceMapConsumer(JSON.parse(sourceMap));
        memo.get(stacktrace).set(line, {...rest, sourceMap});
        return memo;
      }, new Map(stacktraces.map(stacktrace => [stacktrace, new Map()]))))
      .pipe(flatMap((data, next) => {
        const sourcemappedStacktraces = processSourceMap(data, stacktraces, skipLines);
        if (onStacktrace) sourcemappedStacktraces.forEach(onStacktrace);
        next(null, sourcemappedStacktraces);
      }))
      .pipe(through(function(data) {
        this.queue(data);
      }, function() {
        this.queue(null);
        cache.clear();
      }));
  }
};

module.exports = SourcemappedStacktrace;