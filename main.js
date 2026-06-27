// ==UserScript==
// @name         YT History Delete BTN
// @namespace    https://github.com/st0rmr3v3ng3/YoutubeHistoryDeleteButton/
// @version      0.9
// @description  Create "Remove from watch history" button beside each history item and style it as a big red square.
// @match        https://www.youtube.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // =======================================================================
  // ADAPTERS: Centralized YouTube DOM Configuration
  // =======================================================================
  const YTAdapter = {
    selectors: {
      entryUnprocessed: 'yt-lockup-view-model.ytLockupViewModelWrapper:not([data-bigdelete-added])',
      moreButton: '.ytLockupMetadataViewModelMenuButton button',
      popupToHide: 'tp-yt-iron-dropdown:has(yt-sheet-view-model.ytSheetViewModelContextual)',
      popupContainer: 'ytd-popup-container',
      menuItem: 'yt-list-item-view-model'
    },
    icons: {
      remove: "M19 3h-4V2a1 1 0 00-1-1h-4a1 1 0 00-1 1v1H5a2 2 0 00-2 2h18a2 2 0 00-2-2ZM6 19V7H4v12a4 4 0 004 4h8a4 4 0 004-4V7h-2v12a2 2 0 01-2 2H8a2 2 0 01-2-2Zm4-11a1 1 0 00-1 1v8a1 1 0 102 0V9a1 1 0 00-1-1Zm4 0a1 1 0 00-1 1v8a1 1 0 002 0V9a1 1 0 00-1-1Z"
    },

    isHistoryPage: () => location.pathname.startsWith('/feed/history'),
    getUnprocessedEntries: () => document.querySelectorAll(YTAdapter.selectors.entryUnprocessed),
    getContainer: (entry) => entry.firstElementChild,
    getMoreButton: (entry) => entry.querySelector(YTAdapter.selectors.moreButton),
    getPopupToHide: () => document.querySelector(YTAdapter.selectors.popupToHide),
    getPopupContainer: () => document.querySelector(YTAdapter.selectors.popupContainer),

    getRemoveItem: (popupContainer) => {
      if (!popupContainer) return null;
      const items = Array.from(popupContainer.querySelectorAll(YTAdapter.selectors.menuItem));
      return items.find(el => el.querySelector(`path[d="${YTAdapter.icons.remove}"]`));
    }
  };

  // =======================================================================
  // UTILITY: Browser View Anchor (Prevent DOM Rollercoasters)
  // =======================================================================
  const ViewAnchor = {
    isLocked: false,
    lockedY: 0,
    duration: 500, // Wait out the server network request

    // Store original browser functions
    origFocus: HTMLElement.prototype.focus,
    origScrollIntoView: Element.prototype.scrollIntoView,

    releaseLock() {
      if (!ViewAnchor.isLocked) return;
      ViewAnchor.isLocked = false;

      // Restore natural browser behavior
      document.documentElement.style.removeProperty('scroll-behavior');
      document.body.style.removeProperty('scroll-behavior');
      HTMLElement.prototype.focus = ViewAnchor.origFocus;
      Element.prototype.scrollIntoView = ViewAnchor.origScrollIntoView;

      // Remove manual override listeners
      window.removeEventListener('wheel', ViewAnchor.userInterrupt);
      window.removeEventListener('touchmove', ViewAnchor.userInterrupt);
    },

    userInterrupt(e) {
      // If the user physically scrolls, drop the lock immediately to prevent stutter
      if (e.isTrusted) {
        ViewAnchor.releaseLock();
      }
    },

    execute(actionFn) {
      if (this.isLocked) return;
      this.isLocked = true;
      this.lockedY = window.scrollY;

      // 1. Kill CSS smooth scrolling globally
      document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
      document.body.style.setProperty('scroll-behavior', 'auto', 'important');

      // 2. Neuter YouTube's accessibility focus routing
      HTMLElement.prototype.focus = function(options) {
        return ViewAnchor.origFocus.call(this, { ...options, preventScroll: true });
      };

      // 3. Neuter scrollIntoView completely
      Element.prototype.scrollIntoView = function() {};

      // 4. Aggressive Frame-by-Frame Pinning
      const pinScroll = () => {
        if (!this.isLocked) return;
        if (window.scrollY !== this.lockedY) {
          window.scrollTo({ left: 0, top: this.lockedY, behavior: 'instant' });
        }
        requestAnimationFrame(pinScroll);
      };
      requestAnimationFrame(pinScroll);

      // 5. Allow user to break the lock if they want to scroll away
      window.addEventListener('wheel', this.userInterrupt, { passive: true });
      window.addEventListener('touchmove', this.userInterrupt, { passive: true });

      // Execute the actual click
      actionFn();

      // Auto-release after the network request window safely closes
      setTimeout(() => this.releaseLock(), this.duration);
    }
  };

  // =======================================================================
  // CORE UI & LOGIC
  // =======================================================================
  const BTN_SIZE = 138;
  const ADD_DELAY = 500;

  function injectStyles() {
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
        flex-shrink: 0;
      }
      .yt-big-delete:hover {
        background: #b00000 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function addButtons() {
    if (!YTAdapter.isHistoryPage()) return;

    const entries = YTAdapter.getUnprocessedEntries();

    entries.forEach(entry => {
      entry.setAttribute('data-bigdelete-added', '1');

      const container = YTAdapter.getContainer(entry);
      if (!container) return;

      const btn = document.createElement('div');
      btn.textContent = '✖';
      btn.className = 'yt-big-delete';
      container.appendChild(btn);

      btn.addEventListener('click', async e => {
        e.stopPropagation();
        e.preventDefault();

        const moreBtn = YTAdapter.getMoreButton(entry);
        if (!moreBtn) return;

        const popup = YTAdapter.getPopupToHide();
        if (popup) {
          popup.style.pointerEvents = 'none';
          popup.style.opacity = '0';
        }

        moreBtn.click();
        await new Promise(res => setTimeout(res, 25));

        const popupNow = YTAdapter.getPopupContainer();
        const removeItem = YTAdapter.getRemoveItem(popupNow);

        if (removeItem) {
          ViewAnchor.execute(() => {
            removeItem.click();
            entry.style.opacity = '0.3'; // Visual feedback instead of instant removal
            entry.style.pointerEvents = 'none';
          });
        }

        if (popupNow) {
          popupNow.style.opacity = '';
          popupNow.style.pointerEvents = '';
        }
      });
    });
  }

  function onNavigationChange() {
    if (YTAdapter.isHistoryPage()) {
      addButtons();
    } else {
      document.querySelectorAll('.yt-big-delete').forEach(el => el.remove());
    }
  }

  // =======================================================================
  // INITIALIZATION
  // =======================================================================
  injectStyles();

  const observer = new MutationObserver(() => {
    if (YTAdapter.isHistoryPage()) addButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(() => {
    if (YTAdapter.isHistoryPage()) addButtons();
  }, ADD_DELAY);

  window.addEventListener('yt-navigate-finish', onNavigationChange);
  window.addEventListener('yt-page-data-updated', onNavigationChange);

  onNavigationChange();
})();
