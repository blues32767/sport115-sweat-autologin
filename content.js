/**
 * @file 運動部115揮汗有禮自動登入
 * @author blues32767
 * @date 2026/09/02
 * @license MIT
 * @repository https://github.com/blues32767/sport115-sweat-autologin
 */

// 任務週期時間表
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

async function generateStatusText() {
    return new Promise(resolve => {
        chrome.storage.local.get(['lastUploadedPeriod'], (data) => {
            const now = new Date();
            const lastUploaded = data.lastUploadedPeriod || 0;
            
            if (now.getTime() > new Date(TASK_PERIODS[13].end).getTime()) {
                resolve('活動已結束，感謝您的參與！');
                return;
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

            if (!currPeriod) {
                resolve('目前非任務開放期間。');
                return;
            }

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
                    resolve(`已上傳第${lastUploaded}期，下期任務開始時間為${mmStart}/${ddStart}－${mmEnd}/${ddEnd}，剩${remain}`);
                } else {
                    resolve(`已上傳第${lastUploaded}期 (最後一期)，已完成所有任務！`);
                }
            } else {
                const remain = getRemainingTimeStr(new Date(currPeriod.end));
                const uploadedText = lastUploaded > 0 ? `已上傳第${lastUploaded}期，` : '';
                resolve(`${uploadedText}尚未上傳第${currPeriod.no}期，剩餘時間：${remain}`);
            }
        });
    });
}

(async function initAutoLogin() {
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;

    // 【修復】強制使用 await 等待儲存空間讀取完畢，解決排程觸發的時間差問題
    const bgData = await chrome.storage.local.get(['triggerAutoLogin']);
    if (bgData.triggerAutoLogin) {
        sessionStorage.setItem('autoLoginFlow', 'true');
        await chrome.storage.local.set({ triggerAutoLogin: false }); 
    }

    // 4. 登入後頁面：紀錄上傳狀態，但「不再中斷」流程，讓浮動視窗能顯示
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
            await chrome.storage.local.set({ lastUploadedPeriod: highestUploaded });
        }
    }

    // 判斷是否需要顯示浮動視窗 (首頁 與 任務頁面 均顯示)
    if (currentUrl === 'https://500.gov.tw/registrant/' || currentUrl === 'https://500.gov.tw/registrant' || currentPath.includes('/registrant/member/tasks')) {
        injectFloatingUI();
    }
    // 身分證號登入頁面
    else if (currentPath === '/registrant/access' && sessionStorage.getItem('autoLoginFlow') === 'true') {
        chrome.storage.local.get(['idNo'], async (data) => {
            if (!data.idNo) return;
            const idInput = document.querySelector('#idNo');
            const submitBtn = document.querySelector('button[type="submit"].btn--primary');
            if (idInput && submitBtn) {
                idInput.value = data.idNo;
                triggerEvent(idInput, 'input'); triggerEvent(idInput, 'change');
                await delay(300); submitBtn.click();
            }
        });
    }
    // 登入驗證頁面 (出生年月日、手機)
    else if (currentPath === '/registrant/login' && sessionStorage.getItem('autoLoginFlow') === 'true') {
        chrome.storage.local.get(['birthYear', 'birthMonth', 'birthDay', 'phone'], async (data) => {
            if (!data.birthYear || !data.phone) return;
            let year = parseInt(data.birthYear, 10);
            if (year < 1911) year += 1911;

            const yearSelect = document.querySelector('#birthYear');
            if (yearSelect) { yearSelect.value = year.toString(); triggerEvent(yearSelect, 'change'); }
            await delay(500); 

            const monthSelect = document.querySelector('#birthMonth');
            const daySelect = document.querySelector('#birthDay');
            if (monthSelect) { monthSelect.value = parseInt(data.birthMonth, 10).toString(); triggerEvent(monthSelect, 'change'); }
            if (daySelect) { daySelect.value = parseInt(data.birthDay, 10).toString(); triggerEvent(daySelect, 'change'); }

            const phoneInput = document.querySelector('#phone');
            const submitBtn = document.querySelector('button[type="submit"].btn--primary');
            
            if (phoneInput && submitBtn) {
                phoneInput.value = data.phone;
                triggerEvent(phoneInput, 'input'); triggerEvent(phoneInput, 'change');
                await delay(300); submitBtn.click();
                sessionStorage.removeItem('autoLoginFlow');
            }
        });
    }
})();

// ==========================================
// 注入浮動 UI 與設定面板邏輯
// ==========================================
async function injectFloatingUI() {
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
    statusText.innerHTML = await generateStatusText(); 
    
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
            <div class="al-schedule-note">※ 勾選並儲存後，時間到將忽略開關自動登入。</div>
            <div id="al-sysTime" class="al-current-time">目前時間：${getFormattedTimeStr()}</div>
        </div>

        <button id="al-save-btn" class="al-save-btn">儲存設定</button>
        <div id="al-save-msg" class="al-save-msg">設定已儲存！</div>
        
        <div class="al-footer-meta">
            v1.1.0 · Developed by <a href="https://github.com/blues32767/sport115-sweat-autologin/" target="_blank" rel="noopener">blues32767</a> · 2026/09/02
        </div>
    `;

    floater.appendChild(topBar);
    floater.appendChild(settingsPanel);
    document.body.appendChild(floater);

    // 定期更新視窗內的時間顯示
    setInterval(() => {
        const timeEl = document.getElementById('al-sysTime');
        if (timeEl) timeEl.textContent = `目前時間：${getFormattedTimeStr()}`;
    }, 10000);

    // --- 事件處理：開關動畫與登入 ---
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (toggleBtn.classList.contains('active')) return;

        toggleBtn.classList.add('active');
        statusText.innerHTML = '<strong>🚀 啟動中...</strong>';
        statusText.style.color = '#34C759';
        
        sessionStorage.setItem('autoLoginFlow', 'true');
        setTimeout(() => { window.location.href = 'https://500.gov.tw/registrant/access'; }, 350);
    });

    // --- 事件處理：面板展開與資料讀寫 ---
    const fields = ['idNo', 'birthYear', 'birthMonth', 'birthDay', 'phone', 'autoOpenEnabled', 'autoOpenDay', 'autoOpenTime'];
    
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('open');
        
        if (settingsPanel.classList.contains('open')) {
            chrome.storage.local.get(fields, (data) => {
                if (data.idNo) document.getElementById('al-idNo').value = data.idNo;
                if (data.birthYear) document.getElementById('al-birthYear').value = data.birthYear;
                if (data.birthMonth) document.getElementById('al-birthMonth').value = data.birthMonth;
                if (data.birthDay) document.getElementById('al-birthDay').value = data.birthDay;
                if (data.phone) document.getElementById('al-phone').value = data.phone;
                if (data.autoOpenEnabled) document.getElementById('al-autoOpenEnabled').checked = data.autoOpenEnabled;
                if (data.autoOpenDay) document.getElementById('al-autoOpenDay').value = data.autoOpenDay;
                if (data.autoOpenTime) document.getElementById('al-autoOpenTime').value = data.autoOpenTime;
            });
        }
    });

    settingsPanel.addEventListener('mousedown', (e) => e.stopPropagation());
    settingsPanel.addEventListener('click', (e) => e.stopPropagation());

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

        chrome.storage.local.set(dataToSave, async () => {
            const msg = document.getElementById('al-save-msg');
            msg.style.opacity = 1;
            statusText.innerHTML = await generateStatusText();
            setTimeout(() => { msg.style.opacity = 0; }, 2000);
        });
    });

    // --- 事件處理：拖曳 (僅針對空白處) ---
    let isDragging = false;
    let startX, startY, initialX, initialY;

    topBar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.al-settings-btn') || e.target.closest('.al-toggle')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = floater.offsetLeft;
        initialY = floater.offsetTop;
        floater.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        floater.style.left = `${initialX + dx}px`;
        floater.style.top = `${initialY + dy}px`;
        floater.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        floater.classList.remove('dragging');
    });
}