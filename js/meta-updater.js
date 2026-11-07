/* ==========================================================================
   Dynamic Meta Updater for news.html
   Updates title, description, OG, Twitter, and JSON-LD
   based on the loaded news article.
========================================================================== */

(function () {
    'use strict';

    const BASE_URL = 'https://www.hak.com.sa';
    const DEFAULT_LOGO = `${BASE_URL}/images/logo.png`;

    // Get news ID from URL (?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    if (!newsId) return;

    /* ------------------------------------------------------------------
       Helper: update a meta tag by name or property
    ------------------------------------------------------------------ */
    const setMeta = (selector, value) => {
        const el = document.querySelector(selector);
        if (el && value) el.setAttribute('content', value);
    };

    const setLink = (selector, value) => {
        const el = document.querySelector(selector);
        if (el && value) el.setAttribute('href', value);
    };

    /* ------------------------------------------------------------------
       Listen for news loaded event dispatched from i18n.js / script.js
    ------------------------------------------------------------------ */
    document.addEventListener('newsLoaded', (event) => {
        const data = event.detail || {};
        applyNewsMeta(data);
    });

    /* ------------------------------------------------------------------
       Apply meta updates
    ------------------------------------------------------------------ */
    function applyNewsMeta({ title, description, image, date, category, author, lang }) {
        const currentLang = lang || document.documentElement.lang || 'ar';
        const canonicalUrl = `${BASE_URL}/news.html?id=${newsId}`;

        // Title
        const pageTitle = title
            ? `${title} | هدية الخير`
            : 'أرشيف الأخبار | هدية الخير';

        document.title = pageTitle;

        // Standard meta
        setMeta('meta[name="title"]', pageTitle);
        setMeta('meta[name="description"]', description || 'تصفّح آخر أخبار ومبادرات شركة هدية الخير للاستثمار.');

        // Canonical
        setLink('link[rel="canonical"]', canonicalUrl);

        // Open Graph
        setMeta('meta[property="og:title"]', pageTitle);
        setMeta('meta[property="og:description"]', description || '');
        setMeta('meta[property="og:url"]', canonicalUrl);
        setMeta('meta[property="og:image"]', image || DEFAULT_LOGO);
        setMeta('meta[property="og:image:secure_url"]', image || DEFAULT_LOGO);
        setMeta('meta[property="og:type"]', 'article');

        if (date) {
            const isoDate = new Date(date).toISOString();
            setMeta('meta[property="article:published_time"]', isoDate);
        }

        if (category) {
            setMeta('meta[property="article:section"]', category);
        }

        if (author) {
            setMeta('meta[property="article:author"]', author);
        }

        // Twitter
        setMeta('meta[name="twitter:title"]', pageTitle);
        setMeta('meta[name="twitter:description"]', description || '');
        setMeta('meta[name="twitter:image"]', image || DEFAULT_LOGO);
        setMeta('meta[name="twitter:url"]', canonicalUrl);

        // JSON-LD NewsArticle
        updateNewsArticleSchema({ title, description, image, date, category, author, canonicalUrl, currentLang });
    }

    /* ------------------------------------------------------------------
       Update JSON-LD schema
    ------------------------------------------------------------------ */
    function updateNewsArticleSchema({ title, description, image, date, category, author, canonicalUrl, currentLang }) {
        const schemaEl = document.getElementById('newsArticleSchema');
        if (!schemaEl) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": title || 'أرشيف الأخبار | هدية الخير',
            "description": description || '',
            "image": image || DEFAULT_LOGO,
            "datePublished": date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            "dateModified": new Date().toISOString().split('T')[0],
            "author": {
                "@type": "Organization",
                "name": author || "القسم الإعلامي - هدية الخير للاستثمار"
            },
            "publisher": {
                "@type": "Organization",
                "name": "شركة هدية الخير للاستثمار",
                "logo": {
                    "@type": "ImageObject",
                    "url": DEFAULT_LOGO
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": canonicalUrl
            },
            "inLanguage": mapLangToI18n(currentLang),
            "articleSection": category || "المركز الإعلامي",
            "isPartOf": {
                "@type": "WebSite",
                "name": "Hadiyah Alkhair Investment",
                "url": BASE_URL
            }
        };

        schemaEl.textContent = JSON.stringify(schema, null, 2);
    }

    function mapLangToI18n(lang) {
        const map = {
            ar: 'ar-SA',
            en: 'en-US',
            id: 'id-ID',
            fr: 'fr-FR'
        };
        return map[lang] || 'ar-SA';
    }

    /* ------------------------------------------------------------------
       Fallback: if newsLoaded event is not fired, try reading DOM after a delay
    ------------------------------------------------------------------ */
    window.addEventListener('load', () => {
        setTimeout(() => {
            const titleEl = document.getElementById('news-title');
            const descEl = document.getElementById('news-text');
            const imageEl = document.getElementById('news-image');
            const dateEl = document.getElementById('news-date');
            const categoryEl = document.getElementById('news-category');
            const authorEl = document.getElementById('news-author');

            if (titleEl && titleEl.textContent.trim()) {
                applyNewsMeta({
                    title: titleEl.textContent.trim(),
                    description: descEl ? descEl.textContent.trim().substring(0, 160) : '',
                    image: imageEl ? imageEl.src : '',
                    date: dateEl ? dateEl.textContent.trim() : '',
                    category: categoryEl ? categoryEl.textContent.trim() : '',
                    author: authorEl ? authorEl.textContent.trim() : ''
                });
            }
        }, 800);
    });
})();