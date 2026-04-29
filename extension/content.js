/**
 * content.js — injected into https://calendar.google.com/*
 *
 * Watches for Google Calendar's toolbar to render, then injects a
 * "✦ New Smart Meeting" button next to the existing "+ New" button.
 * Uses a debounced MutationObserver so it survives GCal SPA re-renders.
 */

(function () {
  'use strict';

  const BUTTON_ID = 'mim-smart-meeting-btn';
  const BUTTON_LABEL = '✦ New Smart Meeting';

  // Google Calendar renders different toolbar structures across views.
  // These selectors cover month, week, day, and agenda views.
  const TOOLBAR_SELECTORS = [
    // Primary "+ New" button in most views
    '[data-view-source-id="create_button"]',
    // Fallback: the top-left create button container
    'div[jsname="V68bde"]',
    // Broader fallback
    '[aria-label="Create"]',
  ];

  let injected = false;
  let debounceTimer = null;

  function findToolbar() {
    for (const sel of TOOLBAR_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function readSelectedDateTime() {
    // Attempt to read the focused/selected date from GCal's URL hash or
    // from the aria-label on the selected day column header.
    try {
      // Week/day view: look for the selected day chip
      const selectedDay = document.querySelector('[data-datekey]');
      if (selectedDay) {
        const key = selectedDay.getAttribute('data-datekey'); // YYYYMMDD
        if (key && /^\d{8}$/.test(key)) {
          const y = key.slice(0, 4);
          const m = key.slice(4, 6);
          const d = key.slice(6, 8);
          return { date: `${y}-${m}-${d}`, time: '10:00' };
        }
      }
    } catch (_) {
      // ignore
    }
    return null;
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.textContent = BUTTON_LABEL;
    btn.setAttribute('aria-label', 'Create a Smart Meeting via Meet is Murder');
    btn.setAttribute('title', 'Interrogate this meeting before it exists');

    Object.assign(btn.style, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginLeft: '8px',
      padding: '8px 14px',
      background: '#f2c94c',
      color: '#000',
      border: '2px solid #000',
      boxShadow: '3px 3px 0px #000',
      fontFamily: '"Space Grotesk", "Google Sans", sans-serif',
      fontWeight: '700',
      fontSize: '13px',
      letterSpacing: '-0.01em',
      cursor: 'pointer',
      borderRadius: '2px',
      transition: 'box-shadow 80ms ease, transform 80ms ease',
      whiteSpace: 'nowrap',
      zIndex: '1000',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.boxShadow = '4px 4px 0px #000';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.boxShadow = '3px 3px 0px #000';
    });
    btn.addEventListener('mousedown', () => {
      btn.style.boxShadow = '1px 1px 0px #000';
      btn.style.transform = 'translate(2px, 2px)';
    });
    btn.addEventListener('mouseup', () => {
      btn.style.boxShadow = '3px 3px 0px #000';
      btn.style.transform = '';
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const context = readSelectedDateTime();
      chrome.runtime.sendMessage({ type: 'OPEN_PANEL', context });
    });

    return btn;
  }

  function tryInject() {
    if (document.getElementById(BUTTON_ID)) {
      injected = true;
      return;
    }

    const anchor = findToolbar();
    if (!anchor) {
      injected = false;
      return;
    }

    // Insert our button after the anchor element
    const btn = createButton();
    const parent = anchor.parentElement;
    if (parent) {
      anchor.insertAdjacentElement('afterend', btn);
    } else {
      anchor.appendChild(btn);
    }
    injected = true;
  }

  function scheduleInject() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!document.getElementById(BUTTON_ID)) {
        injected = false;
      }
      if (!injected) tryInject();
    }, 400);
  }

  // Initial attempt
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    scheduleInject();
  } else {
    document.addEventListener('DOMContentLoaded', scheduleInject);
  }

  // Watch for SPA re-renders
  const observer = new MutationObserver(() => scheduleInject());
  observer.observe(document.body, { childList: true, subtree: true });
})();
