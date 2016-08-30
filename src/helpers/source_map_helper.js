const {atob} = require('Base64');
const BrowserHelper = require('./browser_helper');
const {fetchText} = require('./fetch_helper');

const absUrlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');

function toAbsoluteUri(mapUri, uri) {
  if (absUrlRegex.test(mapUri)) return mapUri;
  let origin;
  const lastSlash = uri.lastIndexOf('/');
  if (lastSlash !== -1) {
    origin = uri.slice(0, lastSlash + 1);
    return origin + mapUri;
    // note if lastSlash === -1, actual script uri has no slash
    // somehow, so no way to use it as a prefix... we give up and try
    // as absolute
  }
}

module.exports = {
  originalName(line) {
    const [,name] = String(line).match(BrowserHelper.isChrome() ? / +at +([^ ]*).*/ : /([^@]*)@.*/) || [];
    return name;
  },

  formatOriginalPosition(source, line, column, name) {
    // mimic chrome's format
    return `    at ${name ? name : '(unknown)'} (${source ? source : ''}:${line}:${column})`;
  },

  getSourcemapMeta() {
    if (BrowserHelper.isChrome()) {
      return {
        regex: /^ +at.+\((.*):([0-9]+):([0-9]+)/,
        expectedFields: 4,
        skipLines: 1
      };
    }
    if (BrowserHelper.isFirefox()) {
      return {
        regex: /@(.*):([0-9]+):([0-9]+)/,
        expectedFields: 4,
        skipLines: 0
      };
    }
  },

  toSourceMap({mapUri, uri}, options) {
    return new Promise((resolve, reject) => {
      const [,embeddedSourceMap] = mapUri.match('data:application/json;base64,(.*)') || [];
      if (embeddedSourceMap) return resolve(atob(embeddedSourceMap));
      mapUri = toAbsoluteUri(mapUri, uri);
      return fetchText(mapUri, options).then(resolve, reject);
    });
  }
};