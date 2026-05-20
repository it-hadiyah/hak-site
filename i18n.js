// script.js
document.addEventListener('DOMContentLoaded', () => {

    // === Language Switcher Logic ===
    const langToggle = document.getElementById('langToggle');
    const currentLangSpan = document.getElementById('currentLang');

    // Get saved language or default to 'ar'
    let currentLang = localStorage.getItem('siteLang') || 'ar';

    // Apply language on load
    applyLanguage(currentLang);

    // Toggle language on click
    langToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('siteLang', currentLang);
        applyLanguage(currentLang);
    });

    function applyLanguage(lang) {
        // Update HTML attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        const footerDiv = document.querySelector('footer div div');

        if (lang === 'en') {
            footerDiv.classList.add('footer-ltr');
        } else {
            footerDiv.classList.remove('footer-ltr');
        }
        // Update toggle button text
        if (currentLangSpan) {
            currentLangSpan.textContent = translations[lang]?.['btn.toggleLang'] || (lang === 'ar' ? 'EN' : 'عربي');
        }

        // Update meta tags
        const metaTitle = document.querySelector('meta[name="title"]');
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaTitle) metaTitle.content = translations[lang]?.['meta.title'] || '';
        if (metaDesc) metaDesc.content = translations[lang]?.['meta.description'] || '';
        document.title = translations[lang]?.['meta.title'] || document.title;

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = translations[lang]?.[key];

            if (translation) {
                // Check if translation contains HTML (like span tags for colors)
                if (translation.includes('<')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Update list items for values
        document.querySelectorAll('[data-i18n-list]').forEach(el => {
            const prefix = el.getAttribute('data-i18n-list');
            const items = el.querySelectorAll('li[data-i18n-key]');
            items.forEach(li => {
                const key = li.getAttribute('data-i18n-key');
                const fullKey = `${prefix}.${key}`;
                if (translations[lang]?.[fullKey]) {
                    li.textContent = translations[lang][fullKey];
                }
            });
        });

        // Update news items dynamically
        updateNewsItems(lang);

        // Update footer year if needed
        const yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        // Dispatch custom event for other scripts to listen to
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    function updateNewsItems(lang) {
        const newsItems = document.querySelectorAll('[data-news-id]');
        newsItems.forEach(item => {
            const id = item.getAttribute('data-news-id');
            const titleEl = item.querySelector('[data-i18n="news' + id + '.title"]');
            const descEl = item.querySelector('[data-i18n="news' + id + '.desc"]');

            if (titleEl && translations[lang]?.[`news${id}.title`]) {
                titleEl.textContent = translations[lang][`news${id}.title`];
            }
            if (descEl && translations[lang]?.[`news${id}.desc`]) {
                descEl.textContent = translations[lang][`news${id}.desc`];
            }
        });
    }

    // === Mobile Menu Toggle ===
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenu?.classList.toggle('hidden');
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('#mobileMenu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu?.classList.add('hidden');
        });
    });

    // === Smooth Scroll for Anchor Links ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // === Header Scroll Effect ===
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header?.classList.add('shadow-md');
        } else {
            header?.classList.remove('shadow-md');
        }
    });

});