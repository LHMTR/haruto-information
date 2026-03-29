// language.js - 多语言核心处理与语言切换
// 语言顺序：简体中文、英语、繁体中文、日语、韩语

const LANGUAGES = ['zh-hans', 'en', 'zh-hant', 'ja', 'ko'];
const DEFAULT_LANG = 'zh-hans';
// 后备顺序（用于主要语言缺失时，英语不参与后备，因为英语固定为次要语言）
const FALLBACK_ORDER = ['zh-hans', 'zh-hant', 'ja', 'ko'];

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

/**
 * 解析多语言字段
 * 输入格式：简体中文|英语|繁体中文|日语|韩语
 * 可缺省，缺省部分自动留空
 */
function parseMultilingualField(fieldValue) {
    if (!fieldValue) return { 'zh-hans': '', 'en': '', 'zh-hant': '', 'ja': '', 'ko': '' };
    const parts = fieldValue.split('|');
    // 顺序与语言定义一致
    const langOrder = ['zh-hans', 'en', 'zh-hant', 'ja', 'ko'];
    const result = {
        'zh-hans': '',
        'en': '',
        'zh-hant': '',
        'ja': '',
        'ko': ''
    };
    for (let i = 0; i < parts.length && i < langOrder.length; i++) {
        result[langOrder[i]] = parts[i] || '';
    }
    return result;
}

/**
 * 获取双语文本：返回 { primary, secondary }
 * - primary: 首选语言（若首选为英语，则使用后备顺序的非英语语言）
 * - secondary: 固定为英语（若存在），否则为空
 */
function getBilingualText(fieldValue, preferredLang) {
    const texts = parseMultilingualField(fieldValue);
    let primary;
    if (preferredLang === 'en') {
        // 首选语言是英语时，主要语言使用后备顺序的第一个非英语语言
        for (let lang of FALLBACK_ORDER) {
            if (texts[lang]) {
                primary = texts[lang];
                break;
            }
        }
        primary = primary || ''; // 如果都没有，则为空
    } else {
        primary = texts[preferredLang] || '';
    }
    const secondary = texts['en'] || '';
    return { primary, secondary };
}

/**
 * 获取单语言文本（用于标题等只需要一种语言的场合）
 * 优先级：首选语言 → 后备顺序
 */
function getSingleText(fieldValue, preferredLang) {
    const texts = parseMultilingualField(fieldValue);
    if (texts[preferredLang]) return texts[preferredLang];
    for (let lang of FALLBACK_ORDER) {
        if (texts[lang]) return texts[lang];
    }
    return '';
}

// 无列车提示的多语言文本（独立于上述逻辑，可直接按首选语言返回）
function getNoTrainMessage(preferredLang) {
    const messages = {
        'zh-hans': '注意：此线路上暂时没有列车行驶',
        'en': 'Note: No trains are currently running on this line',
        'zh-hant': '注意：此線路上暫時沒有列車行駛',
        'ja': '注意：この路線には現在列車が運行していません',
        'ko': '주의: 이 노선에는 현재 열차가 운행되지 않습니다'
    };
    return messages[preferredLang] || messages[DEFAULT_LANG];
}

// ========== 语言切换UI逻辑（保持不变）==========
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
