// ==UserScript==
// @name         YT History Delete BTN
// @namespace    https://github.com/st0rmr3v3ng3/YoutubeHistoryDeleteButton/
// @version      0.6
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
  
  // Define exact SVG icon data for the "Remove" trash can icon for the "Remove from watch history"
  const removeIconPath = "M19 3h-4V2a1 1 0 00-1-1h-4a1 1 0 00-1 1v1H5a2 2 0 00-2 2h18a2 2 0 00-2-2ZM6 19V7H4v12a4 4 0 004 4h8a4 4 0 004-4V7h-2v12a2 2 0 01-2 2H8a2 2 0 01-2-2Zm4-11a1 1 0 00-1 1v8a1 1 0 102 0V9a1 1 0 00-1-1Zm4 0a1 1 0 00-1 1v8a1 1 0 002 0V9a1 1 0 00-1-1Z";

  function isHistoryPage() {
    return location.pathname.startsWith('/feed/history');
  }

  function addButtons() {
    if (!isHistoryPage()) return;

    const entries = document.querySelectorAll(
      'yt-lockup-view-model.ytLockupViewModelWrapper:not([data-bigdelete-added])' 
    );

    entries.forEach(entry => {
      entry.setAttribute('data-bigdelete-added', '1');
      const container = entry.firstElementChild;
      if (!container) return;

      const btn = document.createElement('div');
      btn.textContent = '✖';
      btn.className = 'yt-big-delete';
      container.appendChild(btn);

      btn.addEventListener('click', async e => {
        e.stopPropagation();
        e.preventDefault();

        const moreBtn = entry.querySelector('.ytLockupMetadataViewModelMenuButton button');
        if (!moreBtn){
          console.log('ytLockupMetadataViewModelMenuButton not found (structure)');
          return;
        };

        // make popup temporarily invisible and click-through
        const popup = document.querySelector('tp-yt-iron-dropdown:has(yt-sheet-view-model.ytSheetViewModelContextual)');
        if (popup) {
          popup.style.pointerEvents = 'none';
          popup.style.opacity = '0';
        }

        // open menu (needed for Polymer to attach the remove item)
        moreBtn.click();
        await new Promise(res => setTimeout(res, 50));

        const popupNow = document.querySelector('ytd-popup-container');
        const items = [...popupNow.querySelectorAll('yt-list-item-view-model')];
        const removeItem = items.find(el => {
          return el.querySelector(`path[d="${removeIconPath}"]`); // remove button detection should be more robust now, based on the SVG
        });

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
