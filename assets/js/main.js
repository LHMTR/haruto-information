// main.js - 首页逻辑（含不筛选按钮、按 line_code 排序）

document.addEventListener('DOMContentLoaded', function() {
    // ----- 原有功能（侧边栏、移动端菜单等）-----
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        });
    }

    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
                const span = this.querySelector('span');
                if (span) {
                    span.textContent = sidebar.classList.contains('collapsed') ? '展开侧边栏' : '折叠侧边栏';
                }
            }
        });
    }

    document.querySelectorAll('.sidebar-group-title').forEach(title => {
        title.addEventListener('click', function() {
            const group = this.parentElement;
            group.classList.toggle('collapsed');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });

    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });

    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    function setActiveSidebarLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage || 
                (currentPage === 'index.html' && linkHref === './index.html') ||
                (currentPage === '' && linkHref === './index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage || 
                (currentPage === 'index.html' && linkHref === './index.html') ||
                (currentPage === '' && linkHref === './index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    setActiveSidebarLink();
    setActiveNavLink();

    // ----- 列表页逻辑（含不筛选按钮）-----
    if (document.getElementById('trainsContainer')) {
        // 修正：使用相对路径，指向当前目录下的 information/index.json
        const DATA_SOURCE_URL = 'information/index.json';  // ✅ 正确路径
        let allLines = [];
        let filteredLines = [];
        let currentGroupBy = 'none';  // 默认不筛选
        let searchTerm = '';

        const container = document.getElementById('trainsContainer');
        const viewNoneBtn = document.getElementById('viewNoneBtn');
        const viewCompanyBtn = document.getElementById('viewCompanyBtn');
        const viewServiceBtn = document.getElementById('viewServiceBtn');
        const searchInput = document.getElementById('searchInput');

        const preferredLang = getPreferredLanguage(); // 来自 language.js

        // 加载数据
        async function loadData() {
            container.innerHTML = '<div class="loading">加载中...</div>';
            try {
                const res = await fetch(DATA_SOURCE_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
                allLines = await res.json();
                filteredLines = allLines;
                render();
            } catch (e) {
                console.error('数据加载失败:', e);
                container.innerHTML = `<div class="error">数据加载失败: ${e.message}</div>`;
            }
        }

        // 按公司代码首字母分组
        function groupByCompany(lines) {
            const groups = {};
            lines.forEach(line => {
                const code = line.company_code || '?';
                const firstChar = code.charAt(0).toUpperCase();
                if (!groups[firstChar]) groups[firstChar] = [];
                groups[firstChar].push(line);
            });
            return groups;
        }

        // 按服务类型首字母分组
        function groupByService(lines) {
            const groups = {};
            lines.forEach(line => {
                const type = line.service_type || '?';
                const firstChar = type.charAt(0).toUpperCase();
                if (!groups[firstChar]) groups[firstChar] = [];
                groups[firstChar].push(line);
            });
            return groups;
        }

        // 渲染卡片（不分组时使用）
        function renderCards(items) {
            let cardsHtml = '';
            items.forEach(item => {
                const lineName = getBilingualText(item.line_name, preferredLang);
                const dest = getBilingualText(item.destination, preferredLang);
                const serviceType = getBilingualText(item.service_type, preferredLang);
                const serviceName = getBilingualText(item.service, preferredLang);
                const company = getBilingualText(item.company, preferredLang);
                const builder = getBilingualText(item.builder, preferredLang);

                cardsHtml += `
                    <div class="train-card" data-linecode="${item.line_code}">
                        <div class="card-color-strip" style="background-color: ${item.color || '#888'};"></div>
                        <div class="card-content">
                            <div class="main-row">
                                <span class="line-name">${lineName.primary}</span>
                                <span class="destination">${dest.primary}</span>
                            </div>
                            <div class="service-row">
                                <span class="service-color-dot" style="background-color: ${item.service_color || '#aaa'};"></span>
                                <span class="service-type">${serviceType.primary}</span>
                                <span class="service-name">${serviceName.primary}</span>
                                <span class="service-company">${company.primary}</span>
                                <span class="builder">${builder.primary}</span>
                            </div>
                            <div class="secondary-lang text-xs text-gray-500 mt-1">
                                ${lineName.secondary} · ${dest.secondary} · ${serviceType.secondary} ${serviceName.secondary} · ${company.secondary} ${builder.secondary}
                            </div>
                        </div>
                    </div>
                `;
            });
            return cardsHtml;
        }

        // 主渲染函数
        function render() {
            let data = filteredLines;

            // 搜索过滤
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                data = data.filter(line => {
                    const name = getSingleText(line.line_name, preferredLang).toLowerCase();
                    const dest = getSingleText(line.destination, preferredLang).toLowerCase();
                    return name.includes(term) || dest.includes(term);
                });
            }

            if (data.length === 0) {
                container.innerHTML = '<div class="no-data">无匹配线路</div>';
                return;
            }

            let html = '';

            if (currentGroupBy === 'none') {
                // 不分组：按 line_code 自然排序（字母+数字）
                const sortedData = [...data].sort((a, b) => 
                    a.line_code.localeCompare(b.line_code, undefined, { numeric: true })
                );
                html = renderCards(sortedData);
            } else {
                // 按公司或服务分组
                let groups = currentGroupBy === 'company' ? groupByCompany(data) : groupByService(data);
                const sortedLetters = Object.keys(groups).sort((a, b) => a.localeCompare(b));

                sortedLetters.forEach(letter => {
                    html += `<div class="category-header">${letter}</div>`;
                    html += renderCards(groups[letter]);
                });
            }

            container.innerHTML = html;

            // 卡片点击跳转
            document.querySelectorAll('.train-card').forEach(card => {
                card.addEventListener('click', () => {
                    const code = card.dataset.linecode;
                    window.location.href = `pages/${code}.html?lang=${preferredLang}`;
                });
            });
        }

        // 按钮事件
        if (viewNoneBtn) {
            viewNoneBtn.addEventListener('click', () => {
                currentGroupBy = 'none';
                viewNoneBtn.classList.add('active');
                viewCompanyBtn.classList.remove('active');
                viewServiceBtn.classList.remove('active');
                render();
            });
        }

        if (viewCompanyBtn) {
            viewCompanyBtn.addEventListener('click', () => {
                currentGroupBy = 'company';
                viewNoneBtn.classList.remove('active');
                viewCompanyBtn.classList.add('active');
                viewServiceBtn.classList.remove('active');
                render();
            });
        }

        if (viewServiceBtn) {
            viewServiceBtn.addEventListener('click', () => {
                currentGroupBy = 'service';
                viewNoneBtn.classList.remove('active');
                viewCompanyBtn.classList.remove('active');
                viewServiceBtn.classList.add('active');
                render();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value;
                render();
            });
        }

        // 启动
        loadData();
    }
});
