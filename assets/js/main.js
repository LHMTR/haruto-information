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
        const DATA_SOURCE_URL = 'information/index.json';  // 相对路径
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

        // 十六进制颜色正则
        const hexColorRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;

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

        // 辅助函数：过滤有效的十六进制颜色
        function getValidColors(item) {
            const colors = [];
            if (item.line_color_1 && hexColorRegex.test(item.line_color_1)) colors.push(item.line_color_1);
            if (item.line_color_2 && hexColorRegex.test(item.line_color_2)) colors.push(item.line_color_2);
            if (item.line_color_3 && hexColorRegex.test(item.line_color_3)) colors.push(item.line_color_3);
            return colors;
        }

        // 生成线路颜色渐变（基于有效颜色数量平均分配）
        function getLineColorGradient(item) {
            const colors = getValidColors(item);
            if (colors.length === 0) return '#888';
            if (colors.length === 1) return colors[0];
            // 平均分配宽度
            const total = colors.length;
            const percentage = 100 / total;
            const stops = colors.map((c, i) => `${c} ${i * percentage}%, ${c} ${(i + 1) * percentage}%`).join(', ');
            return `linear-gradient(to bottom, ${stops})`;
        }

        // 渲染卡片（不分组时使用）
        function renderCards(items) {
            let cardsHtml = '';
            items.forEach(item => {
                const lineName = getBilingualText(item.line_name, preferredLang);
                const dest = getBilingualText(item.destination, preferredLang);
                const serviceName = getBilingualText(item.service, preferredLang);
                const company = getBilingualText(item.company, preferredLang);
                const builder = getBilingualText(item.builder, preferredLang);
                const depot = getBilingualText(item.depot, preferredLang);

                // 构建建设者字符串
                const builderText = builder.primary ? `由 ${builder.primary} 建设` : '';

                // 构建第二行内容：服务名称（粗体） + 公司 + 建设者 + 车厂（如果存在）
                let secondLineHtml = `
                    <span class="service-color-dot" style="background-color: ${item.service_color || '#aaa'};"></span>
                    <span class="service-name-bold">${serviceName.primary}</span>
                    <span class="service-company">${company.primary}</span>
                `;
                if (builderText) {
                    secondLineHtml += `<span class="service-builder">${builderText}</span>`;
                }
                if (depot.primary) {
                    secondLineHtml += `<span class="service-depot">${depot.primary}</span>`;
                }

                // 列车警告
                const noTrainWarning = (item.train === false) ? `<div class="no-train-warning"><i class="fa fa-exclamation-triangle"></i> ${getNoTrainMessage(preferredLang)}</div>` : '';

                cardsHtml += `
                    <div class="train-card" data-linecode="${item.line_code}">
                        <div class="card-color-strip" style="background: ${getLineColorGradient(item)};"></div>
                        <div class="card-content">
                            <div class="main-row">
                                <span class="line-name">${lineName.primary}</span>
                                <span class="destination">${dest.primary}</span>
                            </div>
                            <div class="service-row">
                                ${secondLineHtml}
                            </div>
                            ${noTrainWarning}
                        </div>
                    </div>
                `;
            });
            return cardsHtml;
        }

        function render() {
            let data = filteredLines;

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
                const sortedData = [...data].sort((a, b) => 
                    a.line_code.localeCompare(b.line_code, undefined, { numeric: true })
                );
                html = renderCards(sortedData);
            } else {
                let groups = currentGroupBy === 'company' ? groupByCompany(data) : groupByService(data);
                const sortedLetters = Object.keys(groups).sort((a, b) => a.localeCompare(b));

                sortedLetters.forEach(letter => {
                    html += `<div class="category-header">${letter}</div>`;
                    html += renderCards(groups[letter]);
                });
            }

            container.innerHTML = html;

            document.querySelectorAll('.train-card').forEach(card => {
                card.addEventListener('click', () => {
                    const code = card.dataset.linecode;
                    window.location.href = `pages/${code}.html?lang=${preferredLang}`;
                });
            });
        }

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

        loadData();
    }
});