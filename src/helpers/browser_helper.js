module.exports = {
  isChrome() {
    return navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  },

  isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  }
};