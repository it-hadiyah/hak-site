/* ==========================================================================
   Products slider
   - Tabs support: latest / gifts
   - Native horizontal scrolling with snap + prev/next controls
   - Mouse drag support
   - Language-aware links to the online store
   - Resilient product images (webp / png / jpg / jpeg)
   - Autoplay support
========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('products');
    if (!section) return;

    const tabs = Array.from(section.querySelectorAll('.products-tab'));
    const panes = Array.from(section.querySelectorAll('.products-pane'));
    const tracks = Array.from(section.querySelectorAll('[data-products-track]'));

    if (!tracks.length) {
        const fallbackTrack = document.getElementById('productsTrack');
        if (fallbackTrack) tracks.push(fallbackTrack);
    }

    const prevBtn = document.getElementById('productsPrev');
    const nextBtn = document.getElementById('productsNext');
    const storeLink = document.getElementById('productsStoreLink');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let autoplayTimer = null;
    let autoplayResumeTimeout = null;

    /* ------------------------------------------------------------------
       1. Update links according to the active website language.
    ------------------------------------------------------------------ */
    const updateStoreLinks = () => {
        const storeLang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

        section.querySelectorAll('[data-product-slug]').forEach((link) => {
            link.href = `https://store.hak.com.sa/${storeLang}/${link.dataset.productSlug}`;
        });

        if (storeLink) {
            storeLink.href = `https://store.hak.com.sa/${storeLang}`;
        }
    };

    updateStoreLinks();
    document.addEventListener('languageChanged', updateStoreLinks);

    /* ------------------------------------------------------------------
       2. Product images fallback
    ------------------------------------------------------------------ */
    const imageExtensions = ['png', 'jpg', 'webp', 'jpeg'];

    section.querySelectorAll('img[data-product-image-base]').forEach((img) => {
        const basePath = img.dataset.productImageBase;
        let extensionIndex = 0;

        const tryNextImage = () => {
            if (extensionIndex >= imageExtensions.length) {
                img.style.display = 'none';
                return;
            }

            img.src = `${basePath}.${imageExtensions[extensionIndex]}`;
            extensionIndex += 1;
        };

        img.addEventListener('load', () => img.classList.add('is-loaded'));
        img.addEventListener('error', tryNextImage);

        tryNextImage();
    });

    /* ------------------------------------------------------------------
       3. Active pane / track
    ------------------------------------------------------------------ */
    const getActivePane = () => {
        return section.querySelector('.products-pane.is-active') || null;
    };

    const getActiveTrack = () => {
        return (
            section.querySelector('.products-pane.is-active [data-products-track]') ||
            tracks[0] ||
            document.getElementById('productsTrack') ||
            null
        );
    };

    /* ------------------------------------------------------------------
       4. Navigation state
    ------------------------------------------------------------------ */
    const updateNavState = () => {
        if (!prevBtn || !nextBtn) return;

        const track = getActiveTrack();

        if (!track) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        const position = Math.abs(track.scrollLeft);

        const atStart = position <= 2;
        const atEnd = position >= maxScroll - 2;

        prevBtn.disabled = atStart;
        nextBtn.disabled = atEnd;
    };

    /* ------------------------------------------------------------------
       5. Slider calculations
    ------------------------------------------------------------------ */
    const getGap = (track) => {
        const styles = getComputedStyle(track);
        return parseFloat(styles.columnGap) || parseFloat(styles.gap) || 0;
    };

    const getStep = (track) => {
        const card = track.querySelector('.product-card');
        return card ? card.getBoundingClientRect().width + getGap(track) : 0;
    };

    const getCardsPerView = (track) => {
        const step = getStep(track);

        if (!step) return 1;

        return Math.max(1, Math.round((track.clientWidth + getGap(track)) / step));
    };

    const scrollPage = (direction, behavior = 'smooth') => {
        const track = getActiveTrack();
        if (!track) return;

        const step = getStep(track);
        if (!step) return;

        const sign = getComputedStyle(track).direction === 'rtl' ? -1 : 1;

        track.scrollBy({
            left: sign * direction * step * getCardsPerView(track),
            behavior,
        });
    };

    const scrollToStart = (track, behavior = 'smooth') => {
        track.scrollTo({
            left: 0,
            behavior,
        });
    };

    /* ------------------------------------------------------------------
       6. Autoplay
    ------------------------------------------------------------------ */
    const isAutoplayAllowedBySection = () => {
        return section.dataset.autoplay !== 'false';
    };

    const isAutoplayAllowedByPane = () => {
        const activePane = getActivePane();

        if (!activePane) return true;

        return activePane.dataset.autoplay !== 'false';
    };

    const isAutoplayAllowedBySystem = () => {
        return !reducedMotion.matches && document.visibilityState === 'visible';
    };

    const isInteracting = () => {
        return (
            section.matches(':hover') ||
            section.contains(document.activeElement) ||
            !!section.querySelector('.products-track.is-dragging')
        );
    };

    const canAutoplay = () => {
        return (
            isAutoplayAllowedBySection() &&
            isAutoplayAllowedByPane() &&
            isAutoplayAllowedBySystem() &&
            !isInteracting()
        );
    };

    const stopAutoplay = () => {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }

        if (autoplayResumeTimeout) {
            clearTimeout(autoplayResumeTimeout);
            autoplayResumeTimeout = null;
        }
    };

    const startAutoplay = () => {
        stopAutoplay();

        if (!canAutoplay()) return;

        const interval = Number(section.dataset.autoplayInterval || 4500);

        if (!Number.isFinite(interval) || interval < 1000) return;

        autoplayTimer = setInterval(() => {
            if (!canAutoplay()) return;

            const track = getActiveTrack();
            if (!track) return;

            const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

            if (maxScroll <= 2) return;

            const position = Math.abs(track.scrollLeft);

            if (position >= maxScroll - 2) {
                scrollToStart(track);
                return;
            }

            scrollPage(1);
        }, interval);
    };

    const restartAutoplay = () => {
        stopAutoplay();
        startAutoplay();
    };

    const pauseAutoplayTemporarily = (delay = 2500) => {
        stopAutoplay();

        autoplayResumeTimeout = setTimeout(() => {
            startAutoplay();
        }, delay);
    };

    /* ------------------------------------------------------------------
       7. Tabs
    ------------------------------------------------------------------ */
    const activateTab = (tab) => {
        const targetPane = tab.dataset.tab;

        tabs.forEach((item) => {
            const isActive = item === tab;

            item.classList.toggle('is-active', isActive);
            item.setAttribute('aria-selected', String(isActive));
        });

        panes.forEach((pane) => {
            const isActive = pane.dataset.pane === targetPane;

            pane.classList.toggle('is-active', isActive);
            pane.hidden = !isActive;
        });

        requestAnimationFrame(() => {
            updateNavState();
            restartAutoplay();
        });
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => activateTab(tab));
    });

    /* ------------------------------------------------------------------
       8. Prev / Next buttons
    ------------------------------------------------------------------ */
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            scrollPage(-1);
            restartAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            scrollPage(1);
            restartAutoplay();
        });
    }

    /* ------------------------------------------------------------------
       9. Track behaviour: scroll, drag, wheel, touch
    ------------------------------------------------------------------ */
    tracks.forEach((track) => {
        let scrollFrame = null;

        track.addEventListener(
            'scroll',
            () => {
                if (scrollFrame) cancelAnimationFrame(scrollFrame);
                scrollFrame = requestAnimationFrame(updateNavState);
            },
            { passive: true }
        );

        track.addEventListener(
            'wheel',
            () => {
                pauseAutoplayTemporarily();
            },
            { passive: true }
        );

        track.addEventListener(
            'touchmove',
            () => {
                pauseAutoplayTemporarily();
            },
            { passive: true }
        );

        let isDragging = false;
        let didDrag = false;
        let suppressClick = false;
        let startX = 0;
        let startScrollLeft = 0;

        track.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'mouse' || event.button !== 0) return;

            isDragging = true;
            didDrag = false;
            suppressClick = false;

            startX = event.clientX;
            startScrollLeft = track.scrollLeft;

            stopAutoplay();
        });

        window.addEventListener('pointermove', (event) => {
            if (!isDragging) return;

            const deltaX = event.clientX - startX;

            if (Math.abs(deltaX) > 5) {
                didDrag = true;
                track.classList.add('is-dragging');
            }

            if (didDrag) {
                event.preventDefault();
                track.scrollLeft = startScrollLeft - deltaX;
            }
        });

        window.addEventListener('pointerup', () => {
            if (!isDragging) return;

            isDragging = false;
            suppressClick = didDrag;
            track.classList.remove('is-dragging');

            restartAutoplay();
        });

        track.addEventListener(
            'click',
            (event) => {
                if (!suppressClick) return;

                event.preventDefault();
                event.stopPropagation();
                suppressClick = false;
            },
            true
        );
    });

    /* ------------------------------------------------------------------
       10. Autoplay events
    ------------------------------------------------------------------ */
    section.addEventListener('mouseenter', stopAutoplay);
    section.addEventListener('mouseleave', startAutoplay);

    section.addEventListener('focusin', stopAutoplay);
    section.addEventListener('focusout', () => {
        setTimeout(startAutoplay, 0);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            startAutoplay();
        } else {
            stopAutoplay();
        }
    });

    if ('addEventListener' in reducedMotion) {
        reducedMotion.addEventListener('change', restartAutoplay);
    }

    window.addEventListener('resize', () => {
        updateNavState();
        restartAutoplay();
    });

    /* ------------------------------------------------------------------
       11. Init
    ------------------------------------------------------------------ */
    const initSlider = () => {
        updateNavState();
        startAutoplay();
    };

    if (document.readyState === 'complete') {
        requestAnimationFrame(initSlider);
    } else {
        window.addEventListener('load', () => {
            requestAnimationFrame(initSlider);
        });
    }

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(() => {
            updateNavState();
        });

        tracks.forEach((track) => resizeObserver.observe(track));
    }
});