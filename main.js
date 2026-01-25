// ==UserScript==
// @name         YT History Delete BTN
// @namespace    https://github.com/st0rmr3v3ng3/YoutubeHistoryDeleteButton/
// @version      0.5
// @description  Create "Remove from watch history" button beside each history item and style it as a big red square.
// @match        https://www.youtube.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const BTN_SIZE = 138; //px
  const ADD_DELAY = 500;

  const style = document.createElement('style');
  style.textContent = `
    .yt-big-delete {
      background: red !important;
      cursor: pointer;
      width: ${BTN_SIZE}px;
      height: ${BTN_SIZE}px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 20px;
      border-radius: 4px;
      transition: background 0.2s, opacity 0.2s;
      margin-left: 8px;
    }
    .yt-big-delete:hover {
      background: #b00000 !important;
    }
  `;
  document.head.appendChild(style);

  function isHistoryPage() {
    return location.pathname.startsWith('/feed/history');
  }

  function addButtons() {
    if (!isHistoryPage()) return;

    const entries = document.querySelectorAll(
      'yt-lockup-view-model.yt-lockup-view-model--wrapper:not([data-bigdelete-added])'
    );

    entries.forEach(entry => {
      entry.setAttribute('data-bigdelete-added', '1');
      const container = entry.querySelector('.yt-lockup-view-model');
      if (!container) return;

      const btn = document.createElement('div');
      btn.textContent = '✖';
      btn.className = 'yt-big-delete';
      container.appendChild(btn);

      btn.addEventListener('click', async e => {
        e.stopPropagation();
        e.preventDefault();

        const moreBtn = entry.querySelector('button[aria-label="More actions"]');
        if (!moreBtn) return;

        // make popup temporarily invisible and click-through
        const popup = document.querySelector('ytd-popup-container');
        if (popup) {
          popup.style.pointerEvents = 'none';
          popup.style.opacity = '0';
        }

        // open menu (needed for Polymer to attach the remove item)
        moreBtn.click();
        await new Promise(res => setTimeout(res, 50));

        const popupNow = document.querySelector('ytd-popup-container');
        const removeItem = popupNow
        ? [...popupNow.querySelectorAll('yt-list-item-view-model')]
        .find(el => el.textContent.toLowerCase().includes('remove from watch history'))
        : null;

        if (removeItem) {
          removeItem.click();
          entry.remove();
        }

        // restore popup visibility
        if (popupNow) {
          popupNow.style.opacity = '';
          popupNow.style.pointerEvents = '';
        }
      });
    });
  }

  // Observe DOM changes for new entries
  const observer = new MutationObserver(() => {
    if (isHistoryPage()) addButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also periodically recheck (YT lazy-load)
  setInterval(() => {
    if (isHistoryPage()) addButtons();
  }, ADD_DELAY);

  // Detect SPA navigation changes
  function onNavigationChange() {
    if (isHistoryPage()) {
      addButtons();
    } else {
      // Clean up any leftover buttons when leaving history
      document.querySelectorAll('.yt-big-delete').forEach(el => el.remove());
    }
  }

  window.addEventListener('yt-navigate-finish', onNavigationChange);
  window.addEventListener('yt-page-data-updated', onNavigationChange);

  // Initial run
  onNavigationChange();

  console.log('YT history delete mover loaded');
})();
