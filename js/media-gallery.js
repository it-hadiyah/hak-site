document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('gallery');
    const dialog = document.getElementById('galleryDialog');
    const grid = document.getElementById('galleryGrid');
    const emptyMessage = document.getElementById('galleryEmpty');
    const viewer = dialog?.querySelector('[data-gallery-viewer]');
    const titleElement = document.getElementById('galleryDialogTitle');

    if (!section || !dialog || !grid || !emptyMessage || !viewer || !titleElement) return;

    const sourceItems = window.mediaGalleryItems;
    if (!Array.isArray(sourceItems)) {
        throw new Error('Media gallery data must be an array.');
    }

    const seenIds = new Set();
    const items = sourceItems.filter((item) => {
        const valid = item && typeof item.id === 'string' && !seenIds.has(item.id) &&
            (item.type === 'image' || item.type === 'video') &&
        typeof item.src === 'string' && typeof item.alt === 'object' &&
        (item.type !== 'video' || typeof item.poster === 'string' || typeof item.thumbnail === 'string');

        if (!valid) {
            console.error('Skipping invalid or duplicate media gallery item:', item);
            return false;
        }

        seenIds.add(item.id);
        return true;
    });

    const tabs = Array.from(section.querySelectorAll('[data-gallery-filter]'));
    const previousButton = dialog.querySelector('[data-gallery-previous]');
    const nextButton = dialog.querySelector('[data-gallery-next]');
    const closeButton = dialog.querySelector('[data-gallery-close]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeFilter = 'all';
    let activeItem = null;
    let focusedElementBeforeOpen = null;
    let intersectionObserver = null;

    const getLanguage = () => document.documentElement.lang || 'ar';
    const getTranslation = (key) => {
        return typeof translations !== 'undefined' ? translations[getLanguage()]?.[key] || '' : '';
    };
    const getLocalizedValue = (value) => {
        if (typeof value === 'string') return value;
        if (!value || typeof value !== 'object') return '';
        return value[getLanguage()] || value.en || value.ar || '';
    };

    const getFilteredItems = () => items.filter((item) => {
        return activeFilter === 'all' || item.type === activeFilter;
    });

    const getImageItems = () => getFilteredItems().filter((item) => item.type === 'image');

    const createPlayIcon = () => {
        const icon = document.createElement('span');
        icon.className = 'gallery-play-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '\u25B6';
        return icon;
    };

    const createCard = (item) => {
        const card = document.createElement('article');
        card.className = 'gallery-card';
        card.dataset.mediaId = item.id;

        const button = document.createElement('button');
        button.className = 'gallery-card-button';
        button.type = 'button';
        const label = getLocalizedValue(item.title) || getLocalizedValue(item.alt);
        button.setAttribute('aria-label', item.type === 'video'
            ? `${label} - ${getTranslation('gallery.play')}`
            : label);

        const media = document.createElement('span');
        media.className = 'gallery-card-media';

        const image = document.createElement('img');
        image.src = item.poster || item.thumbnail || item.src;
        image.alt = getLocalizedValue(item.alt);
        image.loading = 'lazy';
        image.decoding = 'async';
        image.width = Number(item.width) || 4;
        image.height = Number(item.height) || 3;
        media.append(image);

        if (item.type === 'video') media.append(createPlayIcon());

        const caption = document.createElement('span');
        caption.className = 'gallery-card-caption';
        caption.textContent = getLocalizedValue(item.title);
        button.append(media, caption);
        button.addEventListener('click', () => openItem(item));
        card.append(button);
        return card;
    };

    const render = () => {
        if (intersectionObserver) intersectionObserver.disconnect();
        intersectionObserver = 'IntersectionObserver' in window && !reducedMotion.matches
            ? new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.12 })
            : null;

        const filteredItems = getFilteredItems();
        grid.replaceChildren(...filteredItems.map(createCard));
        grid.querySelectorAll('.gallery-card').forEach((card, index) => {
            card.style.setProperty('--gallery-delay', `${Math.min(index, 6) * 55}ms`);
            if (intersectionObserver) intersectionObserver.observe(card);
            else card.classList.add('is-visible');
        });

        emptyMessage.hidden = filteredItems.length > 0;
        const emptyKey = activeFilter === 'image'
            ? 'gallery.emptyPhotos'
            : activeFilter === 'video'
                ? 'gallery.emptyVideos'
                : 'gallery.emptyAll';
        emptyMessage.dataset.i18n = emptyKey;
        const dictionary = typeof translations !== 'undefined' ? translations[getLanguage()] : null;
        if (dictionary?.[emptyKey]) emptyMessage.textContent = dictionary[emptyKey];
    };

    const updateNavigation = () => {
        const images = getImageItems();
        const imageIndex = activeItem ? images.findIndex((item) => item.id === activeItem.id) : -1;
        const hasMultiple = images.length > 1;
        previousButton.hidden = !hasMultiple || imageIndex < 0;
        nextButton.hidden = !hasMultiple || imageIndex < 0;
    };

    const renderItem = (item) => {
        viewer.replaceChildren();
        titleElement.textContent = getLocalizedValue(item.title);

        if (item.type === 'image') {
            const image = document.createElement('img');
            image.className = 'gallery-full-image';
            image.src = item.src;
            image.alt = getLocalizedValue(item.alt);
            image.decoding = 'async';
            viewer.append(image);
        } else if (item.youtube || /^https?:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)\//i.test(item.src)) {
            const videoUrl = item.youtube || item.src;
            let videoId = '';
            try {
                const url = new URL(videoUrl);
                if (url.hostname === 'youtu.be') videoId = url.pathname.slice(1);
                if (['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(url.hostname)) {
                    videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop() || '';
                }
            } catch (error) {
                console.error('Invalid YouTube URL in media gallery item:', item.id, error);
            }

            if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
                console.error('Invalid YouTube video ID in media gallery item:', item.id);
                return;
            }

            const frame = document.createElement('iframe');
            frame.className = 'gallery-video-frame';
            frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
            frame.title = getLocalizedValue(item.title) || getLocalizedValue(item.alt);
            frame.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share';
            frame.allowFullscreen = true;
            frame.loading = 'lazy';
            viewer.append(frame);
        } else {
            const video = document.createElement('video');
            video.className = 'gallery-video-player';
            video.controls = true;
            video.preload = 'none';
            video.playsInline = true;
            if (item.poster || item.thumbnail) video.poster = item.poster || item.thumbnail;
            const source = document.createElement('source');
            source.src = item.src;
            source.type = 'video/mp4';
            video.append(source);
            viewer.append(video);
        }

        updateNavigation();
    };

    function openItem(item) {
        activeItem = item;
        focusedElementBeforeOpen = document.activeElement;
        renderItem(item);

        if (!dialog.open) dialog.showModal();
        closeButton.focus();
    }

    const moveImage = (direction) => {
        const images = getImageItems();
        const currentIndex = images.findIndex((item) => item.id === activeItem?.id);
        if (currentIndex < 0 || images.length < 2) return;
        const nextIndex = (currentIndex + direction + images.length) % images.length;
        activeItem = images[nextIndex];
        renderItem(activeItem);
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            activeFilter = tab.dataset.galleryFilter;
            tabs.forEach((item) => {
                const isActive = item === tab;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-selected', String(isActive));
                item.tabIndex = isActive ? 0 : -1;
            });
            grid.setAttribute('aria-labelledby', tab.id);
            render();
        });

        tab.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const nextIndex = event.key === 'Home'
                ? 0
                : event.key === 'End'
                    ? tabs.length - 1
                    : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIndex].focus();
            tabs[nextIndex].click();
        });
    });

    previousButton.addEventListener('click', () => moveImage(-1));
    nextButton.addEventListener('click', () => moveImage(1));
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => {
        const video = viewer.querySelector('video');
        if (video) {
            video.pause();
            video.removeAttribute('src');
            video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
            video.load();
        }
        viewer.replaceChildren();
        activeItem = null;
        updateNavigation();
        if (focusedElementBeforeOpen instanceof HTMLElement) focusedElementBeforeOpen.focus();
    });

    document.addEventListener('keydown', (event) => {
        if (!dialog.open || activeItem?.type !== 'image') return;
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveImage(-1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveImage(1);
        }
    });

    let pointerStartX = null;
    viewer.addEventListener('pointerdown', (event) => {
        pointerStartX = event.pointerType === 'touch' ? event.clientX : null;
    });
    viewer.addEventListener('pointerup', (event) => {
        if (pointerStartX === null) return;
        const distance = event.clientX - pointerStartX;
        pointerStartX = null;
        if (Math.abs(distance) < 48) return;
        moveImage(distance < 0 ? 1 : -1);
    });
    viewer.addEventListener('pointercancel', () => {
        pointerStartX = null;
    });

    document.addEventListener('languageChanged', render);
    if ('addEventListener' in reducedMotion) reducedMotion.addEventListener('change', render);
    render();
});
