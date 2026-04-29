// This file runs in MAIN world via <script src> to bypass CSP inline restriction
(function() {
  if (window.__pdpMobileApplied) return;
  window.__pdpMobileApplied = true;
  var MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  Object.defineProperty(navigator, 'userAgent', { get: function() { return MOBILE_UA; }, configurable: true });
  Object.defineProperty(navigator, 'platform', { get: function() { return 'iPhone'; }, configurable: true });
  Object.defineProperty(navigator, 'maxTouchPoints', { get: function() { return 5; }, configurable: true });
  Object.defineProperty(navigator, 'vendor', { get: function() { return 'Apple Computer, Inc.'; }, configurable: true });
  if (navigator.userAgentData) {
    Object.defineProperty(navigator, 'userAgentData', { get: function() {
      return { mobile: true, platform: 'iOS',
        brands: [{brand:'Mobile Safari',version:'17'}],
        getHighEntropyValues: function(){ return Promise.resolve({mobile:true,platform:'iOS',platformVersion:'17.0',uaFullVersion:'17.0'}); },
        toJSON: function(){ return {mobile:true,platform:'iOS',brands:[{brand:'Mobile Safari',version:'17'}]}; }
      };
    }, configurable: true });
  }
  var origMatch = window.matchMedia;
  window.matchMedia = function(q) {
    if (q.includes('pointer: coarse') || q.includes('pointer:coarse')) {
      return { matches: true, media: q, onchange: null, addListener: function(){}, removeListener: function(){}, addEventListener: function(){}, removeEventListener: function(){}, dispatchEvent: function(){} };
    }
    return origMatch.call(window, q);
  };
})();
