/**
 * Audit extraction functions — shared between extension (content.js) and CLI (audit-cli.js)
 * This file is injected into pages via Playwright's page.evaluate()
 */
function runAudit() {
  function auditSEO() {
    const title = document.title || null;
    const desc = document.querySelector('meta[name="description"]');
    const canon = document.querySelector('link[rel="canonical"]');
    const robots = document.querySelector('meta[name="robots"]');
    const favicon = document.querySelector('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]');
    const og = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(function(el) {
      og[el.getAttribute('property')] = el.getAttribute('content') || '';
    });
    const twitter = {};
    document.querySelectorAll('meta[name^="twitter:"]').forEach(function(el) {
      twitter[el.getAttribute('name')] = el.getAttribute('content') || '';
    });
    const hreflangs = [];
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function(el) {
      hreflangs.push({ lang: el.getAttribute('hreflang'), href: el.getAttribute('href') });
    });
    return {
      title: title, titleLength: title ? title.length : 0,
      metaDescription: desc ? desc.getAttribute('content') : null,
      metaDescLength: desc ? (desc.getAttribute('content') || '').length : 0,
      canonical: canon ? canon.getAttribute('href') : null,
      robots: robots ? robots.getAttribute('content') : null,
      og: og, twitter: twitter, hreflangs: hreflangs,
      favicon: favicon ? favicon.getAttribute('href') : null
    };
  }

  function auditJSONLD() {
    var items = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s) {
      try {
        var data = JSON.parse(s.textContent);
        if (data['@graph']) { data['@graph'].forEach(function(i) { items.push(parseLDItem(i)); }); }
        else if (Array.isArray(data)) { data.forEach(function(i) { items.push(parseLDItem(i)); }); }
        else { items.push(parseLDItem(data)); }
      } catch (e) {}
    });
    return items;
  }

  function parseLDItem(item) {
    var type = item['@type'];
    var r = { type: type };
    if (type === 'Product') {
      r.name = item.name || null;
      r.sku = item.sku || null;
      r.brand = (item.brand && item.brand.name) || item.brand || null;
      r.image = !!item.image;
      if (item.offers) {
        var o = Array.isArray(item.offers) ? item.offers[0] : item.offers;
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
      r.items = (item.itemListElement || []).map(function(i) { return i.name || (i.item && i.item.name) || ''; });
    }
    if (type === 'FAQPage') { r.questionCount = item.mainEntity ? item.mainEntity.length : 0; }
    if (type === 'Organization') { r.name = item.name || null; r.url = item.url || null; }
    return r;
  }

  function auditSections() {
    var secs = [], seen = {};
    var els = document.querySelectorAll(
      'section, .story-wrap, .component-wrap, [class*="story"], [class*="section_wrap"], ' +
      '[class*="marketing"], [id*="story"], .section, [class*="content_section"], ' +
      '[class*="benefit"], [class*="recommend"], [class*="buy-benefit"], ' +
      '[class*="purchase"], .accordion-wrap, [class*="accordion"], ' +
      '[class*="cart"], [class*="coupon"], [class*="delivery"]'
    );
    els.forEach(function(el) {
      var heading = el.querySelector('h1,h2,h3,h4,h5,.component-header__title,[class*="section_title"],[class*="story_title"],[class*="heading"]');
      var title = heading ? (heading.innerText || heading.textContent || '').trim().split('\n')[0].trim() : null;
      if (title && title.length > 80) title = title.substring(0, 80);
      var id = el.id || null;
      if (!title && !id) return;
      if (el.offsetHeight < 50) return;
      var key = (title || '') + '|' + (id || '');
      if (seen[key]) return;
      seen[key] = true;
      secs.push({ id: id, title: title, tag: el.tagName.toLowerCase(), imageCount: el.querySelectorAll('img').length });
    });
    return secs;
  }

  function auditMedia() {
    var imgs = document.querySelectorAll('img');
    var altMiss = 0, lazyCnt = 0;
    imgs.forEach(function(img) {
      var alt = img.getAttribute('alt');
      if (alt === null || alt === '') altMiss++;
      if (img.loading === 'lazy' || img.dataset.src) lazyCnt++;
    });
    var videos = document.querySelectorAll('video,iframe[src*="youtube"],iframe[src*="vimeo"]');
    return {
      totalImages: imgs.length, altMissing: altMiss,
      altMissingRate: imgs.length > 0 ? Math.round(altMiss / imgs.length * 1000) / 10 : 0,
      videoCount: videos.length,
      lazyLoadCount: lazyCnt,
      lazyLoadRate: imgs.length > 0 ? Math.round(lazyCnt / imgs.length * 1000) / 10 : 0
    };
  }

  function auditHeadings() {
    var nodes = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(function(el) {
      var text = (el.innerText || el.textContent || '').trim().split('\n')[0].trim();
      if (!text || el.offsetHeight === 0) return;
      nodes.push({ level: parseInt(el.tagName[1]), text: text.substring(0, 120), tag: el.tagName });
    });
    return nodes;
  }

  function specCleanText(el) {
    var clone = el.cloneNode(true);
    clone.querySelectorAll('.blind,.sr-only,.visually-hidden,[class*="blind"],[class*="sr-only"],span[class*="hidden"]').forEach(function(s) { s.remove(); });
    var text = (clone.innerText || clone.textContent || '').trim().replace(/\s+/g, ' ');
    text = text.replace(/\s*(있음|없음)$/g, '').trim();
    return text;
  }

  function auditSpecs() {
    var specs = {};
    document.querySelectorAll(
      '.spec-info-wrap table, .tbl-spec, .spec-area table, [class*="spec_table"] table, ' +
      '[class*="spec_list"] table, table.tbl-list, .spec-wrap table'
    ).forEach(function(tbl) {
      tbl.querySelectorAll('tr').forEach(function(tr) {
        var th = tr.querySelector('th, td:first-child');
        var td = tr.querySelector('td:last-child');
        if (th && td && th !== td) {
          var key = specCleanText(th);
          var val = specCleanText(td);
          if (key && val && key.length < 60) specs[key] = val;
        }
      });
    });
    return specs;
  }

  function auditTracking() {
    var dl = window.dataLayer || [];
    var eventTypes = [];
    var seen = {};
    dl.forEach(function(e) {
      if (typeof e === 'object' && e.event && !seen[e.event]) { eventTypes.push(e.event); seen[e.event] = true; }
    });
    var gtmIds = [], gaIds = [];
    document.querySelectorAll('script').forEach(function(s) {
      var text = s.src || s.textContent || '';
      var m1 = text.match(/GTM-[A-Z0-9]+/g);
      if (m1) m1.forEach(function(id) { if (gtmIds.indexOf(id) === -1) gtmIds.push(id); });
      var m2 = text.match(/G-[A-Z0-9]+/g);
      if (m2) m2.forEach(function(id) { if (gaIds.indexOf(id) === -1) gaIds.push(id); });
    });
    return { dataLayerCount: dl.length, eventTypes: eventTypes, gtmIds: gtmIds, gaIds: gaIds };
  }

  return {
    seo: auditSEO(), jsonld: auditJSONLD(), sections: auditSections(),
    media: auditMedia(), headings: auditHeadings(), specs: auditSpecs(),
    tracking: auditTracking()
  };
}
