document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('openBtn').addEventListener('click', () => {
    const url = chrome.runtime.getURL('compare.html');
    chrome.tabs.create({ url: url });
    window.close();
  });
});
