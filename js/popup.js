/* ==========================================================================
   Products Pop-up
   - Shows once every 24 hours (configurable)
   - Closes via X button, overlay click, or Escape key
   - Focus trap for accessibility
   - Language-aware store links
========================================================================== */

(function () {
    'use strict';

    const POPUP_KEY = 'hak_products_popup_last_shown';
    const POPUP_COOLDOWN_HOURS = 24; // Change to 0 to show every visit
    const POPUP_DELAY_MS = 1500;     // Delay before showing

    const overlay = document.getElementById('productsPopup');
    if (!overlay) return;

    const closeBtn = document.getElementById('popupClose');
    const laterBtn = document.getElementById('popupLater');
    const storeBtn = document.getElementById('popupStoreBtn');
    const container = overlay.querySelector('.popup-container');

    let lastFocusedElement = null;

    /* ------------------------------------------------------------------
       1. Should we show the popup?
    ------------------------------------------------------------------ */
    const shouldShowPopup = () => {
        if (POPUP_COOLDOWN_HOURS <= 0) return true;

        try {
            const lastShown = Number(localStorage.getItem(POPUP_KEY) || 0);
            const cooldownMs = POPUP_COOLDOWN_HOURS * 60 * 60 * 1000;
            return Date.now() - lastShown >= cooldownMs;
        } catch (e) {
            // localStorage unavailable (private mode, etc.)
            return true;
        }
    };

    const markAsShown = () => {
        try {
            localStorage.setItem(POPUP_KEY, String(Date.now()));
        } catch (e) {
            // Silently fail
        }
    };

    /* ------------------------------------------------------------------
       2. Open / Close
    ------------------------------------------------------------------ */
    const openPopup = () => {
        if (overlay.classList.contains('is-open')) return;

        lastFocusedElement = document.activeElement;

        overlay.hidden = false;
        // Force reflow so the transition runs
        void overlay.offsetWidth;
        overlay.classList.add('is-open');
        document.body.classList.add('popup-open');

        // Focus the close button for accessibility
        requestAnimationFrame(() => {
            closeBtn?.focus();
        });
    };

    const closePopup = () => {
        if (!overlay.classList.contains('is-open')) return;

        overlay.classList.remove('is-open');
        document.body.classList.remove('popup-open');

        markAsShown();

        // Wait for the fade-out transition, then hide
        window.setTimeout(() => {
            overlay.hidden = true;

            // Return focus to the element that was focused before opening
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        }, 350);
    };

    /* ------------------------------------------------------------------
       3. Event listeners
    ------------------------------------------------------------------ */
    closeBtn?.addEventListener('click', closePopup);
    laterBtn?.addEventListener('click', closePopup);

    // Close when clicking outside the container
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closePopup();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
            closePopup();
        }
    });

    /* ------------------------------------------------------------------
       4. Focus trap (accessibility)
    ------------------------------------------------------------------ */
    overlay.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab' || !overlay.classList.contains('is-open')) return;

        const focusable = container.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    /* ------------------------------------------------------------------
       5. Language-aware store links
    ------------------------------------------------------------------ */
    const updatePopupLinks = () => {
        const storeLang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

        overlay.querySelectorAll('[data-product-slug]').forEach((link) => {
            link.href = `https://store.hak.com.sa/${storeLang}/${link.dataset.productSlug}`;
        });

        if (storeBtn) {
            storeBtn.href = `https://store.hak.com.sa/${storeLang}`;
        }
    };

    updatePopupLinks();
    document.addEventListener('languageChanged', updatePopupLinks);

    /* ------------------------------------------------------------------
       6. Show after delay
    ------------------------------------------------------------------ */
    const schedulePopup = () => {
        if (!shouldShowPopup()) return;

        window.setTimeout(() => {
            // Only show if the user hasn't already interacted heavily
            if (document.visibilityState === 'visible') {
                openPopup();
            }
        }, POPUP_DELAY_MS);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', schedulePopup);
    } else {
        schedulePopup();
    }

    // Expose a small API for debugging / manual trigger
    window.HakPopup = {
        open: openPopup,
        close: closePopup,
        reset: () => localStorage.removeItem(POPUP_KEY)
    };
})();