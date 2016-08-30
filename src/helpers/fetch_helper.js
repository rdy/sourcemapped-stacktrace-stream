require('isomorphic-fetch');

function checkStatus(response) {
  if (response.status >= 200 && response.status < 400) return response;
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

module.exports = {
  fetchText(url, {cache, ...options} = {}) {
    if (cache && cache.has(url)) return cache.get(url);
    const promise = fetch(url, {credentials: 'same-origin', ...options}).then(checkStatus).then(res => res.text());
    if (cache) cache.set(url, promise);
    return promise;
  }
};