const apiCache = new Map();
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const MOBILE_RULE_IDS = [9990, 9991, 9992, 9993, 9994, 9995];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'API_CAPTURED': {
      const { modelId, url, data } = msg;
      apiCache.set(modelId, { url, data, timestamp: Date.now() });
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => { if (tab.url && tab.url.includes('compare.html')) chrome.tabs.sendMessage(tab.id, { type: 'API_UPDATED', modelId, url, data }); });
      });
      break;
    }
    case 'GET_API_CACHE': { sendResponse(apiCache.get(msg.modelId) || null); return true; }
    case 'OPEN_COMPARE': { chrome.tabs.create({ url: chrome.runtime.getURL('compare.html') }); break; }
    case 'SET_MOBILE_UA': {
      chrome.storage.local.set({ mobileMode: msg.enabled });
      const allTypes = ['sub_frame', 'xmlhttprequest', 'script', 'stylesheet', 'image', 'font', 'other'];
      if (msg.enabled) {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: MOBILE_RULE_IDS,
          addRules: [
            {
              id: 9990, priority: 2,
              action: { type: 'modifyHeaders', requestHeaders: [
                { header: 'User-Agent', operation: 'set', value: MOBILE_UA }
              ]},
              condition: { urlFilter: '*', resourceTypes: allTypes }
            },
            {
              id: 9991, priority: 2,
              action: { type: 'modifyHeaders', requestHeaders: [
                { header: 'Sec-CH-UA-Mobile', operation: 'set', value: '?1' }
              ]},
              condition: { urlFilter: '*', resourceTypes: allTypes }
            },
            {
              id: 9992, priority: 2,
              action: { type: 'modifyHeaders', requestHeaders: [
                { header: 'Sec-CH-UA-Platform', operation: 'set', value: '"iOS"' }
              ]},
              condition: { urlFilter: '*', resourceTypes: allTypes }
            },
            {
              id: 9993, priority: 2,
              action: { type: 'modifyHeaders', requestHeaders: [
                { header: 'Sec-CH-UA', operation: 'set', value: '"Mobile Safari";v="17.0"' }
              ]},
              condition: { urlFilter: '*', resourceTypes: allTypes }
            },
            {
              id: 9994, priority: 2,
              action: { type: 'modifyHeaders', requestHeaders: [
                { header: 'Sec-CH-UA-Platform-Version', operation: 'set', value: '"17.0"' }
              ]},
              condition: { urlFilter: '*', resourceTypes: allTypes }
            },
            {
              id: 9995, priority: 2,
              action: { type: 'modifyHeaders', requestHeaders: [
                { header: 'Sec-CH-UA-Full-Version-List', operation: 'remove' }
              ]},
              condition: { urlFilter: '*', resourceTypes: allTypes }
            }
          ]
        }, () => sendResponse({ ok: true }));
      } else {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: MOBILE_RULE_IDS,
          addRules: []
        }, () => sendResponse({ ok: true }));
      }
      return true;
    }
  }
});
