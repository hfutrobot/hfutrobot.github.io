/**
 * 浮动时钟组件 - Floating Clock Widget  
 * 在页面显示实时模拟时钟和数字时间，支持拖动并记住位置
 * 靠近边缘时自动收起，悬停展开
 */

(function () {
    'use strict';

    // 配置项
    const CONFIG = {
        storageKey: 'floating-clock-position',
        updateInterval: 1000, // 更新间隔（毫秒）
        edgeThreshold: 10 // 距离边缘多少像素时触发收起
    };

    // 星期名称
    const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    // 获取保存的位置
    function getSavedPosition() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            return saved ? JSON.parse(saved) : { bottom: 20, left: 20 };
        } catch (e) {
            console.warn('Failed to load clock position:', e);
            return { bottom: 20, left: 20 };
        }
    }

    // 保存位置
    function savePosition(bottom, left) {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify({ bottom, left }));
        } catch (e) {
            console.warn('Failed to save clock position:', e);
        }
    }

    // 格式化时间
    function formatTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    // 格式化日期
    function formatDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        return `${year}年${month}月${date}日`;
    }

    // 获取星期
    function getWeekday() {
        const now = new Date();
        return WEEKDAYS[now.getDay()];
    }

    // 创建模拟时钟HTML
    function createAnalogClock() {
        const marksHtml = Array.from({ length: 12 }, (_, i) =>
            `<div class="clock-mark"></div>`
        ).join('');

        return `
      <div class="analog-clock">
        ${marksHtml}
        <div class="hour-hand"></div>
        <div class="minute-hand"></div>
        <div class="second-hand"></div>
      </div>
    `;
    }

    // 更新时钟指针角度
    function updateClockHands(clockElement) {
        const now = new Date();
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // CalculatePerformance角度 - 精确到毫秒
        const secondDeg = (seconds + milliseconds / 1000) * 6; // 秒针每秒6度
        const minuteDeg = (minutes * 6) + (seconds * 0.1); // 分针每分钟6度，每秒0.1度
        const hourDeg = (hours * 30) + (minutes * 0.5); // 时针每小时30度，每分钟0.5度

        // 应用旋转
        const hourHand = clockElement.querySelector('.hour-hand');
        const minuteHand = clockElement.querySelector('.minute-hand');
        const secondHand = clockElement.querySelector('.second-hand');

        if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
        if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
        if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
    }

    // 创建时钟HTML
    function createClockElement() {
        const clockDiv = document.createElement('div');
        clockDiv.id = 'floating-clock';
        clockDiv.innerHTML = `
      <div class="clock-content">
        ${createAnalogClock()}
        <div class="digital-time">
          <div class="time-display">${formatTime()}</div>
          <div class="date-weekday-row">
            <span class="date-display">📅 ${formatDate()}</span>
            <span class="weekday-display">${getWeekday()}</span>
          </div>
        </div>
      </div>
    `;

        // 应用保存的位置
        const pos = getSavedPosition();
        clockDiv.style.bottom = pos.bottom + 'px';
        clockDiv.style.left = pos.left + 'px';

        return clockDiv;
    }

    // 更新时钟显示
    function updateClock(clockElement) {
        const timeDisplay = clockElement.querySelector('.time-display');
        const dateDisplay = clockElement.querySelector('.date-display');
        const weekdayDisplay = clockElement.querySelector('.weekday-display');

        // 更新数字时间
        if (timeDisplay) {
            timeDisplay.textContent = formatTime();
        }

        // 更新模拟时钟指针
        updateClockHands(clockElement);

        // 更新日期
        const newDate = formatDate();
        const currentDateText = dateDisplay.textContent.replace('📅 ', '').trim();
        if (currentDateText !== newDate) {
            dateDisplay.textContent = `📅 ${newDate}`;
        }

        // 更新星期
        const newWeekday = getWeekday();
        if (weekdayDisplay.textContent !== newWeekday) {
            weekdayDisplay.textContent = newWeekday;
        }
    }

    // 检测是否靠近边缘并应用收起效果
    function checkEdgeProximity(element) {
        const rect = element.getBoundingClientRect();
        const threshold = CONFIG.edgeThreshold;

        const nearLeft = rect.left < threshold;
        const nearRight = window.innerWidth - rect.right < threshold;
        const nearTop = rect.top < threshold;
        const nearBottom = window.innerHeight - rect.bottom < threshold;

        // 移除所有收起状态
        element.classList.remove('collapsed-left', 'collapsed-right', 'collapsed-top', 'collapsed-bottom');

        // 应用相应的收起状态（优先级：左右 > 上下）
        if (nearLeft) {
            element.classList.add('collapsed-left');
        } else if (nearRight) {
            element.classList.add('collapsed-right');
        } else if (nearTop) {
            element.classList.add('collapsed-top');
        } else if (nearBottom) {
            element.classList.add('collapsed-bottom');
        }
    }

    // 实现拖动功能
    function makeDraggable(element) {
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // 触摸事件支持
        element.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);

        function dragStart(e) {
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX;
                initialY = e.touches[0].clientY;
            } else {
                initialX = e.clientX;
                initialY = e.clientY;
            }

            const rect = element.getBoundingClientRect();
            currentX = rect.left;
            currentY = rect.top;

            isDragging = true;
            element.classList.add('dragging');

            // 拖动时移除收起状态
            element.classList.remove('collapsed-left', 'collapsed-right', 'collapsed-top', 'collapsed-bottom');
        }

        function drag(e) {
            if (!isDragging) return;

            e.preventDefault();

            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            const deltaX = clientX - initialX;
            const deltaY = clientY - initialY;

            const newLeft = currentX + deltaX;
            const newTop = currentY + deltaY;

            // 限制在视口范围内
            const maxLeft = window.innerWidth - element.offsetWidth;
            const maxTop = window.innerHeight - element.offsetHeight;

            const boundedLeft = Math.max(0, Math.min(newLeft, maxLeft));
            const boundedTop = Math.max(0, Math.min(newTop, maxTop));

            element.style.left = boundedLeft + 'px';
            element.style.top = boundedTop + 'px';
            element.style.bottom = 'auto';
        }

        function dragEnd() {
            if (!isDragging) return;

            isDragging = false;
            element.classList.remove('dragging');

            // 保存位置（转换为bottom和left）
            const rect = element.getBoundingClientRect();
            const bottom = window.innerHeight - rect.bottom;
            const left = rect.left;

            savePosition(bottom, left);

            // 检测是否靠近边缘并应用收起效果
            setTimeout(() => {
                checkEdgeProximity(element);
            }, 100);
        }
    }

    // 初始化时钟
    function initClock() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initClock);
            return;
        }

        // 创建时钟元素
        const clockElement = createClockElement();
        document.body.appendChild(clockElement);

        // 立即更新一次时钟指针
        updateClockHands(clockElement);

        // 启动定时更新
        setInterval(() => {
            updateClock(clockElement);
        }, CONFIG.updateInterval);

        // 使时钟可拖动
        makeDraggable(clockElement);

        // 初始检测是否靠近边缘
        setTimeout(() => {
            checkEdgeProximity(clockElement);
        }, 100);
    }

    // 启动
    initClock();
})();
