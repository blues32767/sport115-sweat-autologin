// ==UserScript==
// @name         運動部115揮汗有禮自動登入助手
// @namespace    https://github.com/blues32767/sport115-sweat-autologin
// @version      1.1.1
// @description  自動填寫運動部115揮汗有禮活動登入資訊，提供排程自動登入、任務週期追蹤與現代化浮動控制面板。
// @author       blues32767
// @match        *://500.gov.tw/registrant/*
// @match        *://500.gov.tw/registrant
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================
    // 1. 樣式注入 (包含桌面與手機適配)
    // ==========================================
    const CSS_STYLES = `
    #auto-login-floater {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      border-radius: 20px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s;
      width: 360px;
      max-width: calc(100vw - 32px);
      box-sizing: border-box;
    }
    #auto-login-floater.event-ended { display: none !important; }
    #auto-login-floater.dragging {
      transform: scale(0.98);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      cursor: grabbing !important;
    }
    .al-top-bar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;
      cursor: grab;
      gap: 12px;
    }
    .al-switch-group {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex: 1;
    }
    .al-toggle {
      width: 46px;
      height: 26px;
      background-color: #E5E5EA;
      border-radius: 15px;
      position: relative;
      cursor: pointer;
      transition: background-color 0.3s ease;
      box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
    }
    .al-toggle-knob {
      width: 22px;
      height: 22px;
      background-color: #FFFFFF;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1.2);
    }
    .al-toggle.active { background-color: #34C759; }
    .al-toggle.active .al-toggle-knob { transform: translateX(20px); }
    .al-status {
      font-size: 13px;
      font-weight: 500;
      color: #1C1C1E;
      pointer-events: none; 
      line-height: 1.4;
    }
    .al-settings-btn {
      background: rgba(0, 0, 0, 0.05);
      border: none;
      cursor: pointer;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      color: #1C1C1E;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .al-settings-btn:hover { background: rgba(0, 0, 0, 0.1); }
    #al-settings-panel {
      display: none;
      flex-direction: column;
      gap: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      margin-top: 12px;
      padding-top: 12px;
      cursor: default;
    }
    #al-settings-panel.open { display: flex; }
    .al-form-group { display: flex; flex-direction: column; gap: 6px; }
    .al-form-group label { font-size: 12px; color: #8E8E93; font-weight: 500; }
    .al-input {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #E5E5EA;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      color: #1C1C1E;
      transition: border-color 0.2s;
      width: 100%;
      box-sizing: border-box;
    }
    .al-input:focus { border-color: #007AFF; }
    .al-date-group { display: flex; gap: 6px; }
    .al-schedule-box {
      background: rgba(0,0,0,0.03);
      padding: 10px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .al-schedule-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
    }
    .al-schedule-header input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
    .al-schedule-note { font-size: 11px; color: #FF3B30; font-weight: 500; }
    .al-save-btn {
      background-color: #1C1C1E; color: #FFF; border: none; padding: 10px;
      border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer;
      margin-top: 4px; transition: background-color 0.2s;
    }
    .al-save-btn:hover { background-color: #333; }
    .al-save-msg {
      font-size: 12px; color: #34C759; text-align: center; opacity: 0;
      transition: opacity 0.3s; margin-top: -4px;
    }
    .al-current-time {
      font-size: 11px;
      color: #8E8E93;
      text-align: right;
      margin-top: 4px;
    }
    .al-footer-quote {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px dashed rgba(0, 0, 0, 0.08);
      text-align: center;
      line-height: 1.4;
    }
    .al-footer-quote .al-quote-zh { margin: 0; font-size: 10.5px; color: #8E8E93; }
    .al-footer-quote .al-quote-en {
      margin: 2px 0 4px 0; font-size: 9.5px; color: #AEAEB2;
      font-style: italic; font-family: Georgia, serif;
    }
    .al-footer-quote .al-quote-author { font-size: 9.5px; color: #AEAEB2; }
    .al-footer-quote a { color: #636366; text-decoration: none; font-weight: 500; }
    .al-footer-quote a:hover { color: #007AFF; text-decoration: underline; }
    .al-footer-meta {
      margin-top: 6px; font-size: 9.5px; color: #AEAEB2;
      text-align: center; letter-spacing: 0.2px;
    }
    .al-footer-meta a { color: #8E8E93; text-decoration: none; }
    .al-footer-meta a:hover { color: #007AFF; text-decoration: underline; }
    `;
    GM_addStyle(CSS_STYLES);

    // ==========================================
    // 2. 儲存層包裝 (替代 chrome.storage.local)
    // ==========================================
    const storage = {
        get: (keys) => {
            const data = {};
            keys.forEach(k => {
                data[k] = GM_getValue(k, undefined);
            });
            return data;
        },
        set: (obj) => {
            Object.entries(obj).forEach(([k, v]) => {
                GM_setValue(k, v);
            });
        }
    };

    // ==========================================
    // 3. 常數定義與週期設定
    // ==========================================
    const TASK_PERIODS = [
        { no: 1, start: '2026-09-01T00:00:00+08:00', end: '2026-09-06T23:59:59+08:00' },
        { no: 2, start: '2026-09-07T00:00:00+08:00', end: '2026-09-13T23:59:59+08:00' },
        { no: 3, start: '2026-09-14T00:00:00+08:00', end: '2026-09-20T23:59:59+08:00' },
        { no: 4, start: '2026-09-21T00:00:00+08:00', end: '2026-09-27T23:59:59+08:00' },
        { no: 5, start: '2026-09-28T00:00:00+08:00', end: '2026-10-04T23:59:59+08:00' },
        { no: 6, start: '2026-10-05T00:00:00+08:00', end: '2026-10-11T23:59:59+08:00' },
        { no: 7, start: '2026-10-12T00:00:00+08:00', end: '2026-10-18T23:59:59+08:00' },
        { no: 8, start: '2026-10-19T00:00:00+08:00', end: '2026-10-25T23:59:59+08:00' },
        { no: 9, start: '2026-10-26T00:00:00+08:00', end: '2026-11-01T23:59:59+08:00' },
        { no: 10, start: '2026-11-02T00:00:00+08:00', end: '2026-11-08T23:59:59+08:00' },
        { no: 11, start: '2026-11-09T00:00:00+08:00', end: '2026-11-15T23:59:59+08:00' },
        { no: 12, start: '2026-11-16T00:00:00+08:00', end: '2026-11-22T23:59:59+08:00' },
        { no: 13, start: '2026-11-23T00:00:00+08:00', end: '2026-11-29T23:59:59+08:00' },
        { no: 14, start: '2026-11-30T00:00:00+08:00', end: '2026-11-30T23:59:59+08:00' }
    ];

    const triggerEvent = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
    const delay = ms => new Promise(res => setTimeout(res, ms));

    function getRemainingTimeStr(targetDate) {
        const diff = targetDate.getTime() - Date.now();
        if (diff <= 0) return '0天0小時';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        return `${days}天${hours}小時`;
    }

    function getFormattedTimeStr() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${y} ${m} ${d} ${h} ${min}`;
    }

    function generateStatusText() {
        const data = storage.get(['lastUploadedPeriod']);
        const now = new Date();
        const lastUploaded = data.lastUploadedPeriod || 0;

        if (now.getTime() > new Date(TASK_PERIODS[13].end).getTime()) {
            return '活動已結束，感謝您的參與！';
        }

        let currPeriod = null;
        let currPeriodIdx = -1;
        for (let i = 0; i < TASK_PERIODS.length; i++) {
            if (now >= new Date(TASK_PERIODS[i].start) && now <= new Date(TASK_PERIODS[i].end)) {
                currPeriod = TASK_PERIODS[i];
                currPeriodIdx = i;
                break;
            }
        }

        if (!currPeriod) return '目前非任務開放期間。';

        if (lastUploaded >= currPeriod.no) {
            if (currPeriodIdx + 1 < TASK_PERIODS.length) {
                const next = TASK_PERIODS[currPeriodIdx + 1];
                const nextStart = new Date(next.start);
                const mmStart = nextStart.getMonth() + 1;
                const ddStart = nextStart.getDate();
                const nextEnd = new Date(next.end);
                const mmEnd = nextEnd.getMonth() + 1;
                const ddEnd = nextEnd.getDate();
                const remain = getRemainingTimeStr(nextStart);
                return `已上傳第${lastUploaded}期，下期任務為${mmStart}/${ddStart}－${mmEnd}/${ddEnd}，剩${remain}`;
            } else {
                return `已上傳第${lastUploaded}期 (最後一期)，已完成所有任務！`;
            }
        } else {
            const remain = getRemainingTimeStr(new Date(currPeriod.end));
            const uploadedText = lastUploaded > 0 ? `已上傳第${lastUploaded}期，` : '';
            return `${uploadedText}尚未上傳第${currPeriod.no}期，剩餘時間：${remain}`;
        }
    }

    // ==========================================
    // 4. 背景排程定時器 (原 background.js 邏輯)
    // ==========================================
    function checkScheduler() {
        const data = storage.get(['autoOpenEnabled', 'autoOpenDay', 'autoOpenTime', 'lastTriggeredKey']);
        if (!data.autoOpenEnabled || !data.autoOpenDay || !data.autoOpenTime) return;

        const now = new Date();
        if (now.getTime() > new Date('2026-11-30T23:59:59+08:00').getTime()) return;

        const currentDay = now.getDay(); // 0 是週日, 1-6 是週一至週六
        const targetDay = parseInt(data.autoOpenDay, 10);
        const jsTargetDay = targetDay === 7 ? 0 : targetDay;

        const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"
        const currentDateStr = now.toDateString();

        if (currentDay === jsTargetDay && currentTimeStr === data.autoOpenTime) {
            const currentTriggerKey = `${currentDateStr}-${data.autoOpenTime}`;
            if (data.lastTriggeredKey === currentTriggerKey) return;

            // 紀錄觸發並啟動登入流程
            storage.set({ lastTriggeredKey: currentTriggerKey });
            sessionStorage.setItem('autoLoginFlow', 'true');
            window.location.href = 'https://500.gov.tw/registrant/access';
        }
    }

    // ==========================================
    // 5. 核心自動登入流程與頁面辨識
    // ==========================================
    async function initAutoLogin() {
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;

        // 啟動頁面排程檢查 (每 15 秒比對一次)
        setInterval(checkScheduler, 15000);
        checkScheduler();

        // 頁面 1：任務總覽頁面 (辨識審核與上傳狀態)
        if (currentPath.includes('/registrant/member/tasks')) {
            sessionStorage.removeItem('autoLoginFlow');

            let highestUploaded = 0;
            document.querySelectorAll('.period-card').forEach(card => {
                const periodNoText = card.querySelector('.period-no')?.textContent || '';
                const match = periodNoText.match(/\d+/);
                if (match) {
                    const pNum = parseInt(match[0], 10);
                    const actionsHtml = card.querySelector('.period-actions')?.innerHTML || '';
                    const stateHtml = card.querySelector('.period-state')?.innerHTML || '';
                    if (actionsHtml.includes('檢視我的截圖') || stateHtml.includes('審核中') || stateHtml.includes('通過')) {
                        if (pNum > highestUploaded) highestUploaded = pNum;
                    }
                }
            });

            if (highestUploaded > 0) {
                storage.set({ lastUploadedPeriod: highestUploaded });
            }
        }

        // 頁面 2：身分證輸入頁面
        if (currentPath === '/registrant/access' && sessionStorage.getItem('autoLoginFlow') === 'true') {
            const data = storage.get(['idNo']);
            if (data.idNo) {
                const idInput = document.querySelector('#idNo');
                const submitBtn = document.querySelector('button[type="submit"].btn--primary');
                if (idInput && submitBtn) {
                    idInput.value = data.idNo;
                    triggerEvent(idInput, 'input');
                    triggerEvent(idInput, 'change');
                    await delay(300);
                    submitBtn.click();
                }
            }
        }
        // 頁面 3：驗證登入頁面 (出生年月日、手機)
        else if (currentPath === '/registrant/login' && sessionStorage.getItem('autoLoginFlow') === 'true') {
            const data = storage.get(['birthYear', 'birthMonth', 'birthDay', 'phone']);
            if (data.birthYear && data.phone) {
                let year = parseInt(data.birthYear, 10);
                if (year < 1911) year += 1911;

                const yearSelect = document.querySelector('#birthYear');
                if (yearSelect) {
                    yearSelect.value = year.toString();
                    triggerEvent(yearSelect, 'change');
                }
                await delay(500);

                const monthSelect = document.querySelector('#birthMonth');
                const daySelect = document.querySelector('#birthDay');
                if (monthSelect) {
                    monthSelect.value = parseInt(data.birthMonth, 10).toString();
                    triggerEvent(monthSelect, 'change');
                }
                if (daySelect) {
                    daySelect.value = parseInt(data.birthDay, 10).toString();
                    triggerEvent(daySelect, 'change');
                }

                const phoneInput = document.querySelector('#phone');
                const submitBtn = document.querySelector('button[type="submit"].btn--primary');

                if (phoneInput && submitBtn) {
                    phoneInput.value = data.phone;
                    triggerEvent(phoneInput, 'input');
                    triggerEvent(phoneInput, 'change');
                    await delay(300);
                    submitBtn.click();
                    sessionStorage.removeItem('autoLoginFlow');
                }
            }
        }

        // 首頁與任務頁面：注入浮動視窗
        if (currentUrl.includes('500.gov.tw/registrant') && !currentPath.includes('/access') && !currentPath.includes('/login')) {
            injectFloatingUI();
        }
    }

    // ==========================================
    // 6. 浮動 UI 注入與支援滑鼠/觸控拖曳
    // ==========================================
    function injectFloatingUI() {
        if (document.getElementById('auto-login-floater')) return;

        const now = new Date();
        if (now.getTime() > new Date('2026-11-30T23:59:59+08:00').getTime()) return;

        const floater = document.createElement('div');
        floater.id = 'auto-login-floater';

        const topBar = document.createElement('div');
        topBar.className = 'al-top-bar';

        const switchGroup = document.createElement('div');
        switchGroup.className = 'al-switch-group';

        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'al-toggle';
        toggleBtn.innerHTML = '<div class="al-toggle-knob"></div>';

        const statusText = document.createElement('div');
        statusText.className = 'al-status';
        statusText.innerHTML = generateStatusText();

        switchGroup.appendChild(toggleBtn);
        switchGroup.appendChild(statusText);

        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'al-settings-btn';
        settingsBtn.innerHTML = '⚙️ (設定)';

        topBar.appendChild(switchGroup);
        topBar.appendChild(settingsBtn);

        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'al-settings-panel';
        settingsPanel.innerHTML = `
            <div class="al-form-group">
                <label>身分證字號</label>
                <input type="text" id="al-idNo" class="al-input" placeholder="A123456789" maxlength="10">
            </div>
            <div class="al-form-group">
                <label>出生日期 (民國/西元皆可)</label>
                <div class="al-date-group">
                    <input type="number" id="al-birthYear" class="al-input" placeholder="年 (如 77)">
                    <input type="number" id="al-birthMonth" class="al-input" placeholder="月" min="1" max="12">
                    <input type="number" id="al-birthDay" class="al-input" placeholder="日" min="1" max="31">
                </div>
            </div>
            <div class="al-form-group">
                <label>手機號碼</label>
                <input type="tel" id="al-phone" class="al-input" placeholder="09XXXXXXXX" maxlength="10">
            </div>

            <div class="al-schedule-box">
                <div class="al-schedule-header">
                    <input type="checkbox" id="al-autoOpenEnabled"> 啟用自動排程登入
                </div>
                <div class="al-date-group">
                    <select id="al-autoOpenDay" class="al-input">
                        <option value="1">每週一</option>
                        <option value="2">每週二</option>
                        <option value="3">每週三</option>
                        <option value="4">每週四</option>
                        <option value="5">每週五</option>
                        <option value="6">每週六</option>
                        <option value="7">每週日</option>
                    </select>
                    <input type="time" id="al-autoOpenTime" class="al-input">
                </div>
                <div class="al-schedule-note">※ 勾選並儲存後，若開啟活動頁面將於排程時間自動登入。</div>
                <div id="al-sysTime" class="al-current-time">目前時間：${getFormattedTimeStr()}</div>
            </div>

            <button id="al-save-btn" class="al-save-btn">儲存設定</button>
            <div id="al-save-msg" class="al-save-msg">設定已儲存！</div>

            <div class="al-footer-quote">
                <p class="al-quote-zh">「戰神戰神戰神阿基里斯 我還要運動一百年你怎麼就先死」</p>
                <p class="al-quote-en">"O Achilles, God of War—I was gonna train for a hundred years, why did you die on me first?"</p>
                <span class="al-quote-author">— 芒果醬 Mango Jump <a href="https://www.youtube.com/watch?v=3yYL2U4bPs4" target="_blank" rel="noopener">〈阿基裏斯 / Achilles〉</a></span>
            </div>

            <div class="al-footer-meta">
                油猴腳本版 v1.1.1 · Developed by <a href="https://github.com/blues32767/sport115-sweat-autologin/" target="_blank" rel="noopener">blues32767</a>
            </div>
        `;

        floater.appendChild(topBar);
        floater.appendChild(settingsPanel);
        document.body.appendChild(floater);

        // 時間即時刷新
        setInterval(() => {
            const timeEl = document.getElementById('al-sysTime');
            if (timeEl) timeEl.textContent = `目前時間：${getFormattedTimeStr()}`;
        }, 10000);

        // 一鍵啟動登入開關
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (toggleBtn.classList.contains('active')) return;

            toggleBtn.classList.add('active');
            statusText.innerHTML = '<strong>🚀 啟動中...</strong>';
            statusText.style.color = '#34C759';

            sessionStorage.setItem('autoLoginFlow', 'true');
            setTimeout(() => {
                window.location.href = 'https://500.gov.tw/registrant/access';
            }, 350);
        });

        // 展開與讀取面板設定
        const fields = ['idNo', 'birthYear', 'birthMonth', 'birthDay', 'phone', 'autoOpenEnabled', 'autoOpenDay', 'autoOpenTime'];
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('open');

            if (settingsPanel.classList.contains('open')) {
                const data = storage.get(fields);
                if (data.idNo) document.getElementById('al-idNo').value = data.idNo;
                if (data.birthYear) document.getElementById('al-birthYear').value = data.birthYear;
                if (data.birthMonth) document.getElementById('al-birthMonth').value = data.birthMonth;
                if (data.birthDay) document.getElementById('al-birthDay').value = data.birthDay;
                if (data.phone) document.getElementById('al-phone').value = data.phone;
                if (data.autoOpenEnabled) document.getElementById('al-autoOpenEnabled').checked = data.autoOpenEnabled;
                if (data.autoOpenDay) document.getElementById('al-autoOpenDay').value = data.autoOpenDay;
                if (data.autoOpenTime) document.getElementById('al-autoOpenTime').value = data.autoOpenTime;
            }
        });

        settingsPanel.addEventListener('mousedown', (e) => e.stopPropagation());
        settingsPanel.addEventListener('touchstart', (e) => e.stopPropagation());

        // 儲存設定按鈕
        document.getElementById('al-save-btn').addEventListener('click', () => {
            const dataToSave = {
                idNo: document.getElementById('al-idNo').value.trim(),
                birthYear: document.getElementById('al-birthYear').value.trim(),
                birthMonth: document.getElementById('al-birthMonth').value.trim(),
                birthDay: document.getElementById('al-birthDay').value.trim(),
                phone: document.getElementById('al-phone').value.trim(),
                autoOpenEnabled: document.getElementById('al-autoOpenEnabled').checked,
                autoOpenDay: document.getElementById('al-autoOpenDay').value,
                autoOpenTime: document.getElementById('al-autoOpenTime').value,
            };

            storage.set(dataToSave);
            const msg = document.getElementById('al-save-msg');
            msg.style.opacity = '1';
            statusText.innerHTML = generateStatusText();
            setTimeout(() => { msg.style.opacity = '0'; }, 2000);
        });

        // 拖曳邏輯 (同時支援電腦滑鼠與手機觸控)
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const handleDragStart = (clientX, clientY, target) => {
            if (target.closest('.al-settings-btn') || target.closest('.al-toggle')) return;
            isDragging = true;
            startX = clientX;
            startY = clientY;
            initialX = floater.offsetLeft;
            initialY = floater.offsetTop;
            floater.classList.add('dragging');
        };

        const handleDragMove = (clientX, clientY) => {
            if (!isDragging) return;
            const dx = clientX - startX;
            const dy = clientY - startY;
            floater.style.left = `${initialX + dx}px`;
            floater.style.top = `${initialY + dy}px`;
            floater.style.right = 'auto';
        };

        const handleDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            floater.classList.remove('dragging');
        };

        // 滑鼠監聽
        topBar.addEventListener('mousedown', (e) => handleDragStart(e.clientX, e.clientY, e.target));
        document.addEventListener('mousemove', (e) => handleDragMove(e.clientX, e.clientY));
        document.addEventListener('mouseup', handleDragEnd);

        // 手機觸控監聽
        topBar.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
                handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        document.addEventListener('touchend', handleDragEnd);
    }

    // 啟動腳本
    initAutoLogin();
})();