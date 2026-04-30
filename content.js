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

    // Full audit extract
    if (e.data.type === 'AUDIT_REQUEST') {
      const result = { seo: auditSEO(), jsonld: auditJSONLD(), sections: auditSections(), media: auditMedia(), headings: auditHeadings(), specs: auditSpecs(), sectionTexts: auditSectionTexts(), images: auditImages(), tracking: auditTracking(), scripts: auditScripts() };
      window.parent.postMessage({ type: 'AUDIT_RESULT', role: myRole, reqId: e.data.reqId, result }, '*');
      return;
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

  // ─── Audit extraction functions ───
  function auditSEO() {
    const title = document.title || null;
    const desc = document.querySelector('meta[name="description"]');
    const canon = document.querySelector('link[rel="canonical"]');
    const robots = document.querySelector('meta[name="robots"]');
    const favicon = document.querySelector('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]');
    const og = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(el => {
      og[el.getAttribute('property')] = el.getAttribute('content') || '';
    });
    const twitter = {};
    document.querySelectorAll('meta[name^="twitter:"]').forEach(el => {
      twitter[el.getAttribute('name')] = el.getAttribute('content') || '';
    });
    const hreflangs = [];
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => {
      hreflangs.push({ lang: el.getAttribute('hreflang'), href: el.getAttribute('href') });
    });
    return {
      title, titleLength: title ? title.length : 0,
      metaDescription: desc ? desc.getAttribute('content') : null,
      metaDescLength: desc ? (desc.getAttribute('content') || '').length : 0,
      canonical: canon ? canon.getAttribute('href') : null,
      robots: robots ? robots.getAttribute('content') : null,
      og, twitter, hreflangs,
      favicon: favicon ? favicon.getAttribute('href') : null
    };
  }

  function auditJSONLD() {
    const items = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        const data = JSON.parse(s.textContent);
        if (data['@graph']) data['@graph'].forEach(i => items.push(parseLDItem(i)));
        else if (Array.isArray(data)) data.forEach(i => items.push(parseLDItem(i)));
        else items.push(parseLDItem(data));
      } catch (e) {}
    });
    return items;
  }

  function parseLDItem(item) {
    const type = item['@type'];
    const r = { type };
    if (type === 'Product') {
      r.name = item.name || null;
      r.sku = item.sku || null;
      r.brand = (item.brand && item.brand.name) || item.brand || null;
      r.image = !!item.image;
      r.description = item.description ? item.description.substring(0, 80) : null;
      if (item.offers) {
        const o = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        r.offersPrice = o.price || o.lowPrice || null;
        r.offersCurrency = o.priceCurrency || null;
        r.offersAvailability = o.availability || null;
      }
      if (item.aggregateRating) {
        r.ratingValue = item.aggregateRating.ratingValue;
        r.reviewCount = item.aggregateRating.reviewCount;
      }
    }
    if (type === 'BreadcrumbList') {
      r.itemCount = item.itemListElement ? item.itemListElement.length : 0;
      r.items = (item.itemListElement || []).map(i => i.name || (i.item && i.item.name) || '');
    }
    if (type === 'FAQPage') {
      r.questionCount = item.mainEntity ? item.mainEntity.length : 0;
    }
    if (type === 'Organization') {
      r.name = item.name || null; r.url = item.url || null;
    }
    return r;
  }

  function auditSections() {
    const secs = [];
    const seen = new Set();
    const candidates = document.querySelectorAll(
      'section, .story-wrap, .component-wrap, [class*="story"], [class*="section_wrap"], ' +
      '[class*="marketing"], [id*="story"], .section, [class*="content_section"], ' +
      '[class*="product_detail"], [class*="spec_wrap"], [class*="review_wrap"]'
    );
    candidates.forEach(el => {
      const heading = el.querySelector(
        'h1,h2,h3,h4,.component-header__title,[class*="section_title"],[class*="story_title"],' +
        '[class*="tit"]:not(script):not(style),.title'
      );
      let title = heading ? (heading.innerText || heading.textContent || '').trim().split('\n')[0].trim() : null;
      if (title && title.length > 80) title = title.substring(0, 80) + '…';
      const id = el.id || null;
      // Skip tiny, empty, or duplicate
      if (!title && !id) return;
      if (el.offsetHeight < 50) return;
      const key = (title || '') + '|' + (id || '');
      if (seen.has(key)) return;
      seen.add(key);
      secs.push({
        id, title,
        tag: el.tagName.toLowerCase(),
        className: (typeof el.className === 'string' ? el.className : '').substring(0, 120),
        imageCount: el.querySelectorAll('img').length
      });
    });
    return secs;
  }

  function auditMedia() {
    const imgs = document.querySelectorAll('img');
    let altMiss = 0, lazyCnt = 0;
    imgs.forEach(img => {
      const alt = img.getAttribute('alt');
      if (alt === null || alt === '') altMiss++;
      if (img.loading === 'lazy' || img.dataset.src || img.dataset.lazySrc) lazyCnt++;
    });
    const videos = document.querySelectorAll('video,iframe[src*="youtube"],iframe[src*="vimeo"]');
    const gallery = document.querySelectorAll('[class*="gallery"] img,[class*="thumb"] img,.swiper-slide img');
    return {
      totalImages: imgs.length,
      altMissing: altMiss,
      altMissingRate: imgs.length > 0 ? Math.round(altMiss / imgs.length * 1000) / 10 : 0,
      videoCount: videos.length,
      galleryThumbnails: gallery.length,
      lazyLoadCount: lazyCnt,
      lazyLoadRate: imgs.length > 0 ? Math.round(lazyCnt / imgs.length * 1000) / 10 : 0
    };
  }

  function auditHeadings() {
    const nodes = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(el => {
      const text = (el.innerText || el.textContent || '').trim().split('\n')[0].trim();
      if (!text || el.offsetHeight === 0) return;
      nodes.push({ level: parseInt(el.tagName[1]), text: text.substring(0, 120), tag: el.tagName });
    });
    return nodes;
  }

  function auditSpecs() {
    const specs = {};
    // AS-IS: .spec-info-wrap table, .tbl-spec, .spec-area table
    // TO-BE: [class*="spec_table"], [class*="spec_list"]
    const tables = document.querySelectorAll(
      '.spec-info-wrap table, .tbl-spec, .spec-area table, [class*="spec_table"] table, ' +
      '[class*="spec_list"] table, table.tbl-list, .spec-wrap table, [class*="specification"] table'
    );
    tables.forEach(tbl => {
      tbl.querySelectorAll('tr').forEach(tr => {
        const th = tr.querySelector('th, td:first-child');
        const td = tr.querySelector('td:last-child');
        if (th && td && th !== td) {
          const key = (th.innerText || th.textContent || '').trim().replace(/\s+/g, ' ');
          const val = (td.innerText || td.textContent || '').trim().replace(/\s+/g, ' ');
          if (key && val && key.length < 60) specs[key] = val;
        }
      });
    });
    // Also try dl/dt/dd pattern
    document.querySelectorAll('.spec-info-wrap dl, [class*="spec"] dl').forEach(dl => {
      const dts = dl.querySelectorAll('dt');
      const dds = dl.querySelectorAll('dd');
      dts.forEach((dt, i) => {
        const key = (dt.innerText || dt.textContent || '').trim().replace(/\s+/g, ' ');
        const val = dds[i] ? (dds[i].innerText || dds[i].textContent || '').trim().replace(/\s+/g, ' ') : '';
        if (key && val && key.length < 60) specs[key] = val;
      });
    });
    return specs;
  }

  function auditSectionTexts() {
    const results = [];
    const candidates = document.querySelectorAll(
      'section, .story-wrap, .component-wrap, [class*="story"], [class*="section_wrap"], ' +
      '[class*="content_section"], [class*="marketing"]'
    );
    const seen = new Set();
    candidates.forEach(el => {
      const heading = el.querySelector('h1,h2,h3,h4,.component-header__title,[class*="section_title"]');
      let title = heading ? (heading.innerText || heading.textContent || '').trim().split('\n')[0].trim() : null;
      if (!title || el.offsetHeight < 50) return;
      if (title.length > 80) title = title.substring(0, 80);
      if (seen.has(title.toLowerCase())) return;
      seen.add(title.toLowerCase());
      // Get text content excluding scripts/styles, limit to 500 chars
      const clone = el.cloneNode(true);
      clone.querySelectorAll('script,style,noscript').forEach(s => s.remove());
      let text = (clone.innerText || clone.textContent || '').trim().replace(/\s+/g, ' ');
      if (text.length > 500) text = text.substring(0, 500);
      results.push({ title, text });
    });
    return results;
  }

  function auditImages() {
    const imgs = [];
    document.querySelectorAll('img').forEach((img, idx) => {
      const src = img.src || img.dataset.src || img.dataset.lazySrc || '';
      if (!src) return;
      // Normalize: strip domain, keep path
      const path = src.replace(/https?:\/\/[^/]+/, '').split('?')[0];
      const alt = img.getAttribute('alt');
      const section = closestSection(img);
      imgs.push({
        idx, path, src,
        alt: alt || null,
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
        loading: img.loading || 'eager',
        visible: img.offsetHeight > 0,
        section
      });
    });
    return imgs;
  }

  function closestSection(el) {
    let node = el;
    for (let i = 0; i < 10 && node; i++) {
      node = node.parentElement;
      if (!node) break;
      if (node.tagName === 'SECTION' || /story|component|section/i.test(node.className || '')) {
        const h = node.querySelector('h1,h2,h3,h4,.component-header__title,[class*="section_title"]');
        if (h) return (h.innerText || h.textContent || '').trim().split('\n')[0].substring(0, 60);
      }
    }
    return null;
  }

  function auditTracking() {
    // dataLayer
    const dl = window.dataLayer || [];
    const events = dl.map(e => {
      if (typeof e !== 'object') return null;
      return { event: e.event || null, keys: Object.keys(e).sort() };
    }).filter(Boolean);

    // Extract unique event types
    const eventTypes = [...new Set(events.map(e => e.event).filter(Boolean))];

    // GA4 view_item / page_view params
    const viewItem = dl.find(e => e.event === 'view_item') || null;
    const pageView = dl.find(e => e.event === 'page_view') || null;

    // GTM container IDs from script tags
    const gtmIds = [];
    document.querySelectorAll('script').forEach(s => {
      const text = s.src || s.textContent || '';
      const m = text.match(/GTM-[A-Z0-9]+/g);
      if (m) m.forEach(id => { if (!gtmIds.includes(id)) gtmIds.push(id); });
    });

    // GA4 measurement IDs
    const gaIds = [];
    document.querySelectorAll('script').forEach(s => {
      const text = s.src || s.textContent || '';
      const m = text.match(/G-[A-Z0-9]+/g);
      if (m) m.forEach(id => { if (!gaIds.includes(id)) gaIds.push(id); });
    });

    return {
      dataLayerCount: dl.length,
      eventTypes,
      viewItem: viewItem ? simplify(viewItem) : null,
      pageView: pageView ? simplify(pageView) : null,
      gtmIds,
      gaIds
    };
  }

  function simplify(obj) {
    // Flatten to key: value for display, max depth 2
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === null || v === undefined) continue;
      if (typeof v === 'object' && !Array.isArray(v)) {
        for (const [k2, v2] of Object.entries(v)) {
          result[k + '.' + k2] = typeof v2 === 'object' ? JSON.stringify(v2).substring(0, 100) : String(v2);
        }
      } else if (Array.isArray(v)) {
        result[k] = JSON.stringify(v).substring(0, 150);
      } else {
        result[k] = String(v);
      }
    }
    return result;
  }

  function auditScripts() {
    const own = location.hostname;
    const scripts = [];
    const seen = new Set();
    document.querySelectorAll('script[src]').forEach(s => {
      const src = s.src || '';
      if (!src) return;
      let host = '';
      try { host = new URL(src).hostname; } catch (e) { return; }
      const is3p = host && host !== own && !host.endsWith('.' + own);
      const path = src.replace(/https?:\/\/[^/]+/, '');
      const key = host + path.split('?')[0];
      if (seen.has(key)) return;
      seen.add(key);
      // Categorize
      let category = 'other';
      if (/google|gtag|gtm|ga\.js|analytics/i.test(src)) category = 'analytics';
      else if (/facebook|fbevents|fb\.js|meta\.com/i.test(src)) category = 'analytics';
      else if (/kakao/i.test(src)) category = 'social';
      else if (/naver|wcslog/i.test(src)) category = 'analytics';
      else if (/hotjar|clarity|heatmap|mouseflow/i.test(src)) category = 'ux';
      else if (/ad|doubleclick|adsense|criteo|taboola|outbrain/i.test(src)) category = 'ads';
      else if (/chat|zendesk|intercom|channel\.io/i.test(src)) category = 'chat';
      else if (/cdn|jquery|polyfill|lodash|moment|swiper|slick/i.test(src)) category = 'library';
      else if (/tag|pixel|beacon|tracker/i.test(src)) category = 'analytics';
      scripts.push({ src, host, path: path.split('?')[0], is3p, category, async: s.async, defer: s.defer });
    });
    return scripts;
  }

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
  const API_PATTERNS = [
    /\/ajax\//, /\/api\/v\d+\//, /pdpapisvc/, /pdp-api/, /\/pdp\//,
    /\/_next\/data\//, /\/model\?/, /\/product/, /\/subscription/,
    /\/purchase/, /\/price/, /\/review/, /\/recommend/, /\/benefit/,
    /\/spec/, /\/coupon/, /\/cart/, /\/option/, /\/delivery/
  ];
  const EXCLUDE_PATTERNS = [
    /\.(js|css|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ico)(\?|$)/i,
    /google|facebook|analytics|gtag|dataLayer|doubleclick|adsense/i,
    /fonts\.googleapis|cdn\./i
  ];
  window.fetch = async function (...args) {
    const res = await _fetch(...args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (url && API_PATTERNS.some(p => p.test(url)) && !EXCLUDE_PATTERNS.some(p => p.test(url))) {
        res.clone().json().then(data => {
          window.parent.postMessage({ type: 'API_CAPTURED', url, data, role: myRole }, '*');
        }).catch(() => {});
      }
    } catch (e) {}
    return res;
  };

  // XMLHttpRequest intercept (일부 레거시에서 사용)
  const _xhrOpen = XMLHttpRequest.prototype.open;
  const _xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._captureUrl = url;
    return _xhrOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        const url = this._captureUrl || '';
        if (API_PATTERNS.some(p => p.test(url)) && !EXCLUDE_PATTERNS.some(p => p.test(url))) {
          const data = JSON.parse(this.responseText);
          window.parent.postMessage({ type: 'API_CAPTURED', url, data, role: myRole }, '*');
        }
      } catch (e) {}
    });
    return _xhrSend.apply(this, args);
  };
})();
