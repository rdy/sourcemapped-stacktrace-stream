require('isomorphic-fetch');

function checkStatus(response) {
  if (response.status >= 200 && response.status < 400) return response;
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function fetchScript(url) {
  return fetch(url, {credentials: 'same-origin', headers: {accept: 'text/javascript', 'Content-Type': 'text/javascript'}})
    .then(checkStatus);
}

module.exports = {fetchScript};