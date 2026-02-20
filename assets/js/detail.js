// detail.js - 线路详情页左列逻辑（重构版）

document.addEventListener('DOMContentLoaded', function() {
    const preferredLang = getPreferredLanguage();
    const path = window.location.pathname;
    const lineCode = path.split('/').pop().replace('.html', '');
    const dataUrl = `/haruto-information/information/${lineCode}.json`; // 注意子路径

    // 十六进制颜色正则
    const hexColorRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;

    // 返回按钮
    const backBtnContainer = document.getElementById('back-button-container');
    if (backBtnContainer) {
        backBtnContainer.innerHTML = `
            <a href="../index_zh-hans.html?lang=${preferredLang}" class="back-button">
                <i class="fa fa-arrow-left"></i> 返回列表
            </a>
        `;
    }

    fetch(dataUrl)
        .then(res => res.json())
        .then(data => {
            renderFixedHeader(data);
            renderStations(data);
        })
        .catch(err => {
            document.getElementById('leftPanelDetail').innerHTML = '<p class="error">线路信息加载失败</p>';
            console.error(err);
        });

    // 过滤有效的线路颜色
    function getValidLineColors(data) {
        const colors = [];
        if (data.line_color_1 && hexColorRegex.test(data.line_color_1)) colors.push(data.line_color_1);
        if (data.line_color_2 && hexColorRegex.test(data.line_color_2)) colors.push(data.line_color_2);
        if (data.line_color_3 && hexColorRegex.test(data.line_color_3)) colors.push(data.line_color_3);
        return colors;
    }

    function renderFixedHeader(data) {
        // 线路名称
        const lineName = getBilingualText(data.line_name, preferredLang);
        document.getElementById('line-name-display').innerHTML = lineName.primary;
        document.getElementById('line-name-display').style.fontSize = 'clamp(1.5rem, 5vw, 2.5rem)';

        // 服务信息行：服务颜色竖条（默认白色） + 服务名称 + 公司 + 建设者
        const serviceName = getBilingualText(data.service, preferredLang);
        const company = getBilingualText(data.company, preferredLang);
        const builder = getBilingualText(data.builder, preferredLang);
        const builderText = builder.primary ? `由 ${builder.primary} 建设` : '';

        let serviceHtml = `
            <span class="service-color-dot" style="background-color: ${data.service_color || '#FFFFFF'};"></span>
            <span class="service-name-bold">${serviceName.primary}</span>
            <span class="service-company">${company.primary}</span>
        `;
        if (builderText) {
            serviceHtml += `<span class="service-builder">${builderText}</span>`;
        }
        document.getElementById('service-info-row').innerHTML = serviceHtml;

        // 彩色横杠 (基于有效颜色平均分配)
        const colors = getValidLineColors(data);
        const colorBar = document.getElementById('color-bar');
        colorBar.innerHTML = '';
        if (colors.length === 0) {
            colorBar.style.backgroundColor = '#888';
            colorBar.style.display = 'block';
        } else if (colors.length === 1) {
            colorBar.style.backgroundColor = colors[0];
            colorBar.style.display = 'block';
        } else {
            colorBar.style.display = 'flex';
            colors.forEach((c, i) => {
                const segment = document.createElement('div');
                segment.style.flex = '1';
                segment.style.height = '100%';
                segment.style.backgroundColor = c;
                if (i > 0) segment.style.borderLeft = '1px solid rgba(255,255,255,0.3)';
                colorBar.appendChild(segment);
            });
        }

        // 车厂
        const depot = getBilingualText(data.depot, preferredLang);
        document.getElementById('depot-info').innerHTML = `车厂：${depot.primary} <span class="text-sm text-gray-500">${depot.secondary}</span>`;

        // 列车警告
        if (data.train === false) {
            document.getElementById('train-warning').innerHTML = `<i class="fa fa-exclamation-triangle"></i> ${getNoTrainMessage(preferredLang)}`;
        } else {
            document.getElementById('train-warning').innerHTML = '';
        }
    }

    function renderStations(data) {
        const container = document.getElementById('stationsScrollable');
        const stations = data.stations || {};
        const stationIds = Object.keys(stations); // 按插入顺序
        if (stationIds.length === 0) {
            container.innerHTML = '<p class="text-gray-500 p-4">无车站信息</p>';
            return;
        }

        let html = '<div class="stations-vertical">';
        for (let i = 0; i < stationIds.length; i++) {
            const id = stationIds[i];
            const s = stations[id];
            const isFirst = (i === 0);
            const isLast = (i === stationIds.length - 1);

            // 强制首尾车站 directly = false
            const directly = (isFirst || isLast) ? false : (s.directly || false);

            const stationName = getBilingualText(s.station_name, preferredLang);
            const color1 = s.color1 || '#888';
            const color2 = s.color2 || color1; // 仅当 directly=true 时使用

            const lineNumber = s.line_number || '';
            const stationNumber = s.station_number || '';
            const stopTime = s.stop_time || '';
            const platform = s.platform || '';
            const note = s.note || '';

            // 圆形背景：直接使用渐变或纯色，中间加白线
            let circleStyle;
            if (directly) {
                // 上半 color1，中间白线，下半 color2
                circleStyle = `background: linear-gradient(to bottom, ${color1} 0%, ${color1} 49%, white 49%, white 51%, ${color2} 51%, ${color2} 100%);`;
            } else {
                circleStyle = `background-color: ${color1};`;
            }

            // 生成车站 HTML
            html += `
                <div class="station-item-vertical">
                    <div class="station-left">
                        <div class="station-circle" style="${circleStyle}">
                            <span class="line-number">${lineNumber}</span>
                            <span class="station-number">${stationNumber}</span>
                        </div>
                    </div>
                    <div class="station-right">
                        <div class="station-name-primary">${stationName.primary}</div>
                        ${stationName.secondary ? `<div class="station-name-secondary">${stationName.secondary}</div>` : ''}
                        <div class="station-platform">站台 ${platform}</div>
                    </div>
                    <div class="station-time">${stopTime}</div>
                    ${note ? `<div class="station-note">${note}</div>` : ''}
                </div>
            `;

            // 如果不是最后一个车站，生成连接线
            if (!isLast) {
                const nextId = stationIds[i + 1];
                const next = stations[nextId];
                const nextIsFirst = false; // 下一个不会是第一个
                const nextIsLast = (i + 1 === stationIds.length - 1);
                const nextDirectly = (nextIsFirst || nextIsLast) ? false : (next.directly || false);

                // 连接线上半部分颜色：当前站的下半颜色
                let topColor;
                if (directly) {
                    topColor = color2; // 当前站的下半部分使用 color2
                } else {
                    topColor = color1;
                }

                // 连接线下半部分颜色：下一站的上半颜色
                let bottomColor;
                if (nextDirectly) {
                    bottomColor = next.color1; // 下一站的上半部分使用 color1
                } else {
                    bottomColor = next.color1;
                }

                const connectorStyle = `background: linear-gradient(to bottom, ${topColor} 0%, ${topColor} 50%, ${bottomColor} 50%, ${bottomColor} 100%);`;
                html += `<div class="station-connector" style="${connectorStyle}"></div>`;
            }
        }
        html += '</div>';
        container.innerHTML = html;
    }
});