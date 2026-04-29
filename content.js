(function () {
  if (window.__pdpComparatorInjected) return;
  window.__pdpComparatorInjected = true;

  // Mobile UA override - inject via src to avoid CSP inline block
  chrome.storage.local.get('mobileMode', (data) => {
    if (data.mobileMode) {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('mobile-override.js');
      (document.documentElement || document.head || document.body).prepend(script);
    }
  });

  // Role detection via parent postMessage (frameElement is cross-origin)
  let myRole = null;
  let scrollTimer = null;

  window.addEventListener('message', (e) => {
    if (!e.data) return;

    // Parent tells us our role
    if (e.data.type === 'SET_ROLE') {
      myRole = e.data.role;
      return;
    }

    // Scroll sync
    if (e.data.type === 'SCROLL_TO_RATIO') {
      window.scrollTo({ top: e.data.ratio * (document.documentElement.scrollHeight - window.innerHeight), behavior: 'instant' });
    }

    // DOM extract
    if (e.data.type === 'DOM_EXTRACT_REQUEST') {
      const result = {};
      e.data.selectors.forEach(({ key, selector, all, textFilter }) => {
        try {
          if (textFilter) {
            // Find element whose text matches the filter pattern
            const els = document.querySelectorAll(selector);
            const re = new RegExp(textFilter, 'i');
            let found = null;
            els.forEach(el => {
              if (!found && re.test(el.textContent)) found = (el.innerText || el.textContent || '').trim();
            });
            result[key] = found;
          } else if (all) {
            // Get all matching elements, join with separator
            const els = document.querySelectorAll(selector);
            result[key] = els.length
              ? Array.from(els).map(el => (el.innerText || el.textContent || '').trim()).filter(Boolean).join(' | ')
              : null;
          } else {
            const el = document.querySelector(selector);
            result[key] = el ? (el.innerText || el.textContent || el.value || '').trim() : null;
          }
        } catch { result[key] = null; }
      });
      window.parent.postMessage({ type: 'DOM_EXTRACT_RESULT', role: myRole, reqId: e.data.reqId, result }, '*');
    }
  });

  // Scroll event - send ratio to parent
  window.addEventListener('scroll', () => {
    if (!myRole) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const ratio = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
      window.parent.postMessage({ type: 'SCROLL_FROM_IFRAME', role: myRole, scrollRatio: ratio }, '*');
    }, 16);
  }, { passive: true });

  // Performance metrics collection
  let perfLCP = 0, perfCLS = 0, perfFCP = 0;

  try {
    // LCP observer
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) perfLCP = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS observer
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) perfCLS += entry.value;
      });
    }).observe({ type: 'layout-shift', buffered: true });

    // FCP from paint entries
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.name === 'first-contentful-paint') perfFCP = entry.startTime;
      });
    }).observe({ type: 'paint', buffered: true });
  } catch (e) {}

  function collectPerf() {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const resources = performance.getEntriesByType('resource') || [];

    let jsSize = 0, cssSize = 0, imgSize = 0, totalSize = 0;
    let jsCount = 0, cssCount = 0, imgCount = 0;
    resources.forEach(r => {
      const size = r.transferSize || 0;
      totalSize += size;
      if (r.initiatorType === 'script' || r.name.match(/\.js(\?|$)/i)) { jsSize += size; jsCount++; }
      else if (r.initiatorType === 'css' || r.initiatorType === 'link' && r.name.match(/\.css/i)) { cssSize += size; cssCount++; }
      else if (r.initiatorType === 'img' || r.name.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)/i)) { imgSize += size; imgCount++; }
    });

    return {
      // Web Vitals
      ttfb: Math.round(nav.responseStart - nav.requestStart) || 0,
      fcp: Math.round(perfFCP),
      lcp: Math.round(perfLCP),
      cls: Math.round(perfCLS * 1000) / 1000,
      domLoad: Math.round(nav.domContentLoadedEventEnd - nav.startTime) || 0,
      pageLoad: Math.round(nav.loadEventEnd - nav.startTime) || 0,
      // Resources
      totalRequests: resources.length,
      totalSize: totalSize,
      jsCount: jsCount,
      jsSize: jsSize,
      cssCount: cssCount,
      cssSize: cssSize,
      imgCount: imgCount,
      imgSize: imgSize,
      // DOM complexity
      domNodes: document.querySelectorAll('*').length,
    };
  }

  // Send perf data after page fully loads
  function sendPerf() {
    if (!myRole) { setTimeout(sendPerf, 500); return; }
    // Wait a bit more for LCP to finalize
    setTimeout(() => {
      window.parent.postMessage({ type: 'PERF_DATA', role: myRole, data: collectPerf() }, '*');
    }, 2000);
  }
  if (document.readyState === 'complete') sendPerf();
  else window.addEventListener('load', sendPerf);

  // Fetch intercept for API capture
  const _fetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    const res = await _fetch(...args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      if (url && (url.includes('pdpapisvc') || url.includes('pdp-api') || url.includes('/pdp/')))
        res.clone().json().then(data => window.parent.postMessage({ type: 'API_CAPTURED', url, data }, '*')).catch(() => {});
    } catch (e) {}
    return res;
  };
})();
