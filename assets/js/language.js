// language.js - 多语言核心处理与语言切换

// 语言列表
const LANGUAGES = ['zh-hans', 'zh-hant', 'en', 'ja', 'ko'];
const DEFAULT_LANG = 'zh-hans';
// 后备顺序（当首选语言缺失时，用于主要位置）
const FALLBACK_ORDER = ['zh-hans', 'zh-hant', 'ja', 'ko', 'en'];

// 获取当前首选语言（从 localStorage 或 URL 参数）
function getPreferredLanguage() {
    let lang = localStorage.getItem('preferred_lang');
    if (lang && LANGUAGES.includes(lang)) return lang;
    // 从 URL 参数获取
    const urlParams = new URLSearchParams(window.location.search);
    lang = urlParams.get('lang');
    if (lang && LANGUAGES.includes(lang)) {
        localStorage.setItem('preferred_lang', lang);
        return lang;
    }
    return DEFAULT_LANG;
}

// 解析多语言字段（格式：文本1|文本2|文本3|文本4|文本5，按语言顺序）
function parseMultilingualField(fieldValue) {
    if (!fieldValue) return { 'zh-hans': '', 'zh-hant': '', 'en': '', 'ja': '', 'ko': '' };
    const parts = fieldValue.split('|');
    while (parts.length < 5) parts.push('');
    return {
        'zh-hans': parts[0] || '',
        'zh-hant': parts[1] || '',
        'en': parts[2] || '',
        'ja': parts[3] || '',
        'ko': parts[4] || ''
    };
}

// 获取双语文本：返回 { primary, secondary }
function getBilingualText(fieldValue, preferredLang) {
    const texts = parseMultilingualField(fieldValue);
    let primary = texts[preferredLang];
    let secondary = texts['en'];

    // 如果首选语言是英语，则主要位置按后备顺序取，英语放次要
    if (preferredLang === 'en') {
        primary = null;
        for (let lang of FALLBACK_ORDER) {
            if (lang !== 'en' && texts[lang]) {
                primary = texts[lang];
                break;
            }
        }
        secondary = texts['en'] || primary || ''; // 如果英语也没有，就用主要
    } else {
        // 非英语：主要取首选，如果为空则按后备顺序取
        if (!primary) {
            for (let lang of FALLBACK_ORDER) {
                if (lang !== preferredLang && lang !== 'en' && texts[lang]) {
                    primary = texts[lang];
                    break;
                }
            }
        }
        // 次要取英语，如果英语为空则用主要
        if (!secondary) secondary = primary || '';
    }

    return {
        primary: primary || '',
        secondary: secondary || ''
    };
}

// 获取单语言文本（用于标题等只需要一种语言的场合，按后备顺序）
function getSingleText(fieldValue, preferredLang) {
    const texts = parseMultilingualField(fieldValue);
    if (texts[preferredLang]) return texts[preferredLang];
    for (let lang of FALLBACK_ORDER) {
        if (texts[lang]) return texts[lang];
    }
    return '';
}

// ========== 语言切换UI逻辑 ==========
document.addEventListener('DOMContentLoaded', function() {
    const languageBtn = document.getElementById('language-btn');
    const languageDropdown = document.getElementById('language-dropdown');

    if (languageBtn && languageDropdown) {
        // 高亮当前语言选项
        const currentLang = getPreferredLanguage();
        document.querySelectorAll('.language-dropdown a').forEach(link => {
            const lang = link.dataset.lang;
            link.classList.remove('active');
            if (lang === currentLang) {
                link.classList.add('active');
                // 如果有勾选图标，显示
                const checkIcon = link.querySelector('.fa-check');
                if (checkIcon) checkIcon.style.display = 'inline-block';
            } else {
                const checkIcon = link.querySelector('.fa-check');
                if (checkIcon) checkIcon.style.display = 'none';
            }
        });

        // 切换下拉菜单显示
        languageBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            languageDropdown.classList.toggle('active');
            // 关闭其他下拉
            const sourceDropdown = document.getElementById('sourcecode-dropdown');
            if (sourceDropdown) sourceDropdown.classList.remove('active');
        });

        // 点击语言选项切换语言
        languageDropdown.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const newLang = this.dataset.lang;
                localStorage.setItem('preferred_lang', newLang);
                // 重载当前页面，保留原有路径，添加 lang 参数
                const url = new URL(window.location.href);
                url.searchParams.set('lang', newLang);
                window.location.href = url.toString();
            });
        });

        // 点击其他地方关闭下拉
        document.addEventListener('click', function() {
            languageDropdown.classList.remove('active');
        });

        languageDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // 源代码下拉菜单
    const sourcecodeBtn = document.getElementById('sourcecode-btn');
    const sourcecodeDropdown = document.getElementById('sourcecode-dropdown');
    if (sourcecodeBtn && sourcecodeDropdown) {
        sourcecodeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sourcecodeDropdown.classList.toggle('active');
            const langDropdown = document.getElementById('language-dropdown');
            if (langDropdown) langDropdown.classList.remove('active');
        });
        document.addEventListener('click', function() {
            sourcecodeDropdown.classList.remove('active');
        });
        sourcecodeDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});