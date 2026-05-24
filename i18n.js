document.addEventListener('DOMContentLoaded', () => {

    // === Language Switcher Logic ===
    const langToggleDesktop = document.getElementById('langToggle');
    const langToggleMobile = document.getElementById('langToggleMobile');
    const currentLangDesktop = document.getElementById('currentLang');
    const currentLangMobile = document.getElementById('currentLangMobile');

    // اللغات المدعومة بالترتيب
    const SUPPORTED_LANGS = ['ar', 'en', 'id'];

    // اللغة المحفوظة أو العربية افتراضياً
    let currentLang = localStorage.getItem('siteLang') || 'ar';

    // التأكد من أن اللغة المحفوظة مدعومة
    if (!SUPPORTED_LANGS.includes(currentLang)) {
        currentLang = 'ar';
        localStorage.setItem('siteLang', currentLang);
    }

    // تطبيق اللغة عند تحميل الصفحة
    applyLanguage(currentLang);

    // === دالة التبديل بين 3 لغات ===
    function toggleLanguage() {
        const currentIndex = SUPPORTED_LANGS.indexOf(currentLang);
        const nextIndex = (currentIndex + 1) % SUPPORTED_LANGS.length;
        currentLang = SUPPORTED_LANGS[nextIndex];
        localStorage.setItem('siteLang', currentLang);
        applyLanguage(currentLang);
        window.location.reload();
    }

    // === زر اللغة في الديسكتوب ===
    if (langToggleDesktop) {
        langToggleDesktop.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLanguage();
        });
    }

    // === زر اللغة في الموبايل ===
    if (langToggleMobile) {
        langToggleMobile.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLanguage();
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
        });
    }

    // === دالة تطبيق اللغة ===
    function applyLanguage(lang) {
        // 1. تحديث خصائص HTML
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        const footerDiv = document.querySelector('footer div div');
        if (footerDiv) {
            // إضافة كلاس LTR للفوتر في حال كانت اللغة إنجليزية أو إندونيسية
            if (lang === 'en' || lang === 'id') {
                footerDiv.classList.add('footer-ltr');
            } else {
                footerDiv.classList.remove('footer-ltr');
            }
        }

        // 3. تحديث نص زر تغيير اللغة (يعرض اللغة التالية)
        const nextLangMap = { 'ar': 'EN', 'en': 'ID', 'id': 'AR' };
        const toggleText = nextLangMap[lang] || 'EN';

        if (currentLangDesktop) currentLangDesktop.textContent = toggleText;
        if (currentLangMobile) currentLangMobile.textContent = toggleText;

        // 4. تحديث meta tags
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = translations[lang]?.['meta.description'] || '';
        document.title = translations[lang]?.['meta.title'] || document.title;

        // 5. تحديث جميع العناصر التي تحمل data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = translations[lang]?.[key];

            if (translation) {
                if (translation.includes('<')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // 6. تحديث القوائم (القيم)
        document.querySelectorAll('[data-i18n-list]').forEach(el => {
            const items = el.querySelectorAll('li[data-i18n]');
            items.forEach(li => {
                const key = li.getAttribute('data-i18n');
                if (translations[lang]?.[key]) {
                    li.textContent = translations[lang][key];
                }
            });
        });

        // 7. تحديث الأخبار
        updateNewsItems(lang);

        // 8. إطلاق حدث مخصص
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    // === دالة تحديث الأخبار ===
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

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

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
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.classList.add('shadow-md');
            } else {
                header.classList.remove('shadow-md');
            }
        });
    }

});