// main.js - 原有功能 + 列表页逻辑（无 train 字段）

document.addEventListener('DOMContentLoaded', function() {
    // ... 原有侧边栏、移动端等功能保持不变 ...

    // ----- 列表页逻辑 -----
    if (document.getElementById('trainsContainer')) {
        // 数据源改为 /information/index.json
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

        // ... groupByCompany, groupByService 等函数不变 ...

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

            // 点击卡片跳转至 pages/{code}.html
            document.querySelectorAll('.train-card').forEach(card => {
                card.addEventListener('click', () => {
                    const code = card.dataset.linecode;
                    window.location.href = `pages/${code}.html?lang=${preferredLang}`;
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