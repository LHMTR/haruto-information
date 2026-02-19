// language.js - 多语言核心处理与语言切换

const LANGUAGES = ['zh-hans', 'zh-hant', 'en', 'ja', 'ko'];
const DEFAULT_LANG = 'zh-hans';
const FALLBACK_ORDER = ['zh-hans', 'zh-hant', 'ja', 'ko', 'en'];

// 获取当前首选语言
function getPreferredLanguage() {
    let lang = localStorage.getItem('preferred_lang');
    if (lang && LANGUAGES.includes(lang)) return lang;
    const urlParams = new URLSearchParams(window.location.search);
    lang = urlParams.get('lang');
    if (lang && LANGUAGES.includes(lang)) {
        localStorage.setItem('preferred_lang', lang);
        return lang;
    }
    return DEFAULT_LANG;
}

// 解析多语言字段（支持任意数量分隔符，按优先级顺序分配）
function parseMultilingualField(fieldValue) {
    if (!fieldValue) return { 'zh-hans': '', 'zh-hant': '', 'en': '', 'ja': '', 'ko': '' };
    const parts = fieldValue.split('|');
    // 优先级顺序：简体中文、繁体中文、日语、韩语、英语
    const langOrder = ['zh-hans', 'zh-hant', 'ja', 'ko', 'en'];
    const result = {
        'zh-hans': '',
        'zh-hant': '',
        'en': '',
        'ja': '',
        'ko': ''
    };
    for (let i = 0; i < parts.length && i < langOrder.length; i++) {
        result[langOrder[i]] = parts[i] || '';
    }
    return result;
}

// 获取双语文本：返回 { primary, secondary }
function getBilingualText(fieldValue, preferredLang) {
    const texts = parseMultilingualField(fieldValue);
    let primary = texts[preferredLang];
    let secondary = texts['en'];

    if (preferredLang === 'en') {
        primary = null;
        for (let lang of FALLBACK_ORDER) {
            if (lang !== 'en' && texts[lang]) {
                primary = texts[lang];
                break;
            }
        }
        secondary = texts['en'] || primary || '';
    } else {
        if (!primary) {
            for (let lang of FALLBACK_ORDER) {
                if (lang !== preferredLang && lang !== 'en' && texts[lang]) {
                    primary = texts[lang];
                    break;
                }
            }
        }
        if (!secondary) secondary = primary || '';
    }
    return { primary: primary || '', secondary: secondary || '' };
}

// 获取单语言文本（后备顺序）
function getSingleText(fieldValue, preferredLang) {
    const texts = parseMultilingualField(fieldValue);
    if (texts[preferredLang]) return texts[preferredLang];
    for (let lang of FALLBACK_ORDER) {
        if (texts[lang]) return texts[lang];
    }
    return '';
}

// 无列车提示的多语言文本
function getNoTrainMessage(preferredLang) {
    const messages = {
        'zh-hans': '注意：此线路上暂时没有列车行驶',
        'zh-hant': '注意：此線路上暫時沒有列車行駛',
        'en': 'Note: No trains are currently running on this line',
        'ja': '注意：この路線には現在列車が運行していません',
        'ko': '주의: 이 노선에는 현재 열차가 운행되지 않습니다'
    };
    return messages[preferredLang] || messages[DEFAULT_LANG];
}

// ========== 语言切换UI逻辑 ==========
document.addEventListener('DOMContentLoaded', function() {
    const languageBtn = document.getElementById('language-btn');
    const languageDropdown = document.getElementById('language-dropdown');

    if (languageBtn && languageDropdown) {
        const currentLang = getPreferredLanguage();
        document.querySelectorAll('.language-dropdown a').forEach(link => {
            const lang = link.dataset.lang;
            link.classList.remove('active');
            if (lang === currentLang) {
                link.classList.add('active');
                const checkIcon = link.querySelector('.fa-check');
                if (checkIcon) checkIcon.style.display = 'inline-block';
            } else {
                const checkIcon = link.querySelector('.fa-check');
                if (checkIcon) checkIcon.style.display = 'none';
            }
        });

        languageBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            languageDropdown.classList.toggle('active');
            const sourceDropdown = document.getElementById('sourcecode-dropdown');
            if (sourceDropdown) sourceDropdown.classList.remove('active');
        });

        languageDropdown.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const newLang = this.dataset.lang;
                localStorage.setItem('preferred_lang', newLang);
                const url = new URL(window.location.href);
                url.searchParams.set('lang', newLang);
                window.location.href = url.toString();
            });
        });

        document.addEventListener('click', function() {
            languageDropdown.classList.remove('active');
        });
        languageDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // 移动端语言选择同步
    const mobileLangSelect = document.getElementById('mobile-language-select');
    if (mobileLangSelect) {
        mobileLangSelect.value = getPreferredLanguage();
        mobileLangSelect.addEventListener('change', function() {
            const newLang = this.value;
            localStorage.setItem('preferred_lang', newLang);
            const url = new URL(window.location.href);
            url.searchParams.set('lang', newLang);
            window.location.href = url.toString();
        });
    }
});