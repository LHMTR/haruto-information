// main.js - 原有功能 + 列表页逻辑（无 train 字段）

document.addEventListener('DOMContentLoaded', function() {
    // ----- 原有功能 -----
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

    // ----- 列表页逻辑（无 train 字段）-----
    if (document.getElementById('trainsContainer')) {
        const DATA_SOURCE_URL = '/information/index.json';
        let allLines = [];
        let filteredLines = [];
        let currentGroupBy = 'company';
        let searchTerm = '';

        const container = document.getElementById('trainsContainer');
        const viewCompanyBtn = document.getElementById('viewCompanyBtn');
        const viewServiceBtn = document.getElementById('viewServiceBtn');
        const searchInput = document.getElementById('searchInput');

        const preferredLang = getPreferredLanguage();

        async function loadData() {
            container.innerHTML = '<div class="loading">加载中...</div>';
            try {
                const res = await fetch(DATA_SOURCE_URL);
                if (!res.ok) throw new Error('网络错误');
                allLines = await res.json();
                filteredLines = allLines;
                render();
            } catch (e) {
                container.innerHTML = '<div class="error">数据加载失败</div>';
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

            let groups = currentGroupBy === 'company' ? groupByCompany(data) : groupByService(data);
            const sortedLetters = Object.keys(groups).sort((a,b) => a.localeCompare(b));

            let html = '';
            sortedLetters.forEach(letter => {
                html += `<div class="category-header">${letter}</div>`;
                groups[letter].forEach(item => {
                    const lineName = getBilingualText(item.line_name, preferredLang);
                    const dest = getBilingualText(item.destination, preferredLang);
                    const serviceType = getBilingualText(item.service_type, preferredLang);
                    const serviceName = getBilingualText(item.service, preferredLang);
                    const company = getBilingualText(item.company, preferredLang);
                    const builder = getBilingualText(item.builder, preferredLang);

                    html += `
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
            });
            container.innerHTML = html;

            document.querySelectorAll('.train-card').forEach(card => {
                card.addEventListener('click', () => {
                    const code = card.dataset.linecode;
                    window.location.href = `information/${code}.html?lang=${preferredLang}`;
                });
            });
        }

        viewCompanyBtn.addEventListener('click', () => {
            currentGroupBy = 'company';
            viewCompanyBtn.classList.add('active');
            viewServiceBtn.classList.remove('active');
            render();
        });
        viewServiceBtn.addEventListener('click', () => {
            currentGroupBy = 'service';
            viewServiceBtn.classList.add('active');
            viewCompanyBtn.classList.remove('active');
            render();
        });
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            render();
        });

        loadData();
    }
});