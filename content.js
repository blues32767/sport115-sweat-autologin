// 輔助函式：觸發 DOM 事件讓前端框架 (如 Alpine.js) 能夠捕捉到值的改變
const triggerEvent = (el, type) => {
    el.dispatchEvent(new Event(type, { bubbles: true }));
};

// 輔助函式：延遲 (用於等待 DOM 元素出現)
const delay = ms => new Promise(res => setTimeout(res, ms));

(async function initAutoLogin() {
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;

    // 4. 登入後頁面：停止自動登入功能
    if (currentPath.includes('/registrant/member/tasks')) {
        sessionStorage.removeItem('autoLoginFlow');
        return;
    }

    // 1. 活動首頁
    if (currentUrl === 'https://500.gov.tw/registrant/' || currentUrl === 'https://500.gov.tw/registrant') {
        injectFloatingUI();
    }

    // 2. 身分證號登入頁面
    else if (currentPath === '/registrant/access' && sessionStorage.getItem('autoLoginFlow') === 'true') {
        chrome.storage.local.get(['idNo'], async (data) => {
            if (!data.idNo) return;
            const idInput = document.querySelector('#idNo');
            const submitBtn = document.querySelector('button[type="submit"].btn--primary');
            
            if (idInput && submitBtn) {
                idInput.value = data.idNo;
                triggerEvent(idInput, 'input');
                triggerEvent(idInput, 'change');
                
                await delay(300);
                submitBtn.click();
            }
        });
    }

    // 3. 登入驗證頁面 (出生年月日、手機)
    else if (currentPath === '/registrant/login' && sessionStorage.getItem('autoLoginFlow') === 'true') {
        chrome.storage.local.get(['birthYear', 'birthMonth', 'birthDay', 'phone'], async (data) => {
            if (!data.birthYear || !data.phone) return;

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
        });
    }
})();

// ==========================================
// 注入浮動 UI 與設定面板邏輯
// ==========================================
function injectFloatingUI() {
    if (document.getElementById('auto-login-floater')) return;

    const floater = document.createElement('div');
    floater.id = 'auto-login-floater';
    
    // 建立頂部控制列
    const topBar = document.createElement('div');
    topBar.className = 'al-top-bar';
    
    // 建立開關與狀態文字
    const switchGroup = document.createElement('div');
    switchGroup.className = 'al-switch-group';
    
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'al-toggle';
    toggleBtn.innerHTML = '<div class="al-toggle-knob"></div>';
    
    const statusText = document.createElement('div');
    statusText.className = 'al-status';
    statusText.textContent = '自動登入';
    
    switchGroup.appendChild(toggleBtn);
    switchGroup.appendChild(statusText);
    
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'al-settings-btn';
    settingsBtn.innerHTML = '⚙️ (設定)';
    
    topBar.appendChild(switchGroup);
    topBar.appendChild(settingsBtn);

    // 建立下拉設定面板
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
        <button id="al-save-btn" class="al-save-btn">儲存設定</button>
        <div id="al-save-msg" class="al-save-msg">設定已儲存！</div>
    `;

    floater.appendChild(topBar);
    floater.appendChild(settingsPanel);
    document.body.appendChild(floater);

    // --- 事件處理：開關動畫與登入 ---
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止干擾拖曳邏輯
        
        if (toggleBtn.classList.contains('active')) return; // 防止重複點擊

        // 觸發 iOS 開關動畫
        toggleBtn.classList.add('active');
        statusText.textContent = '啟動中...';
        statusText.style.color = '#34C759'; // 文字也變綠色
        
        sessionStorage.setItem('autoLoginFlow', 'true');
        
        // 延遲 350 毫秒，讓使用者完整看完流暢的開關動畫再跳轉
        setTimeout(() => {
            window.location.href = 'https://500.gov.tw/registrant/access';
        }, 350);
    });

    // --- 事件處理：面板展開與資料讀寫 ---
    const fields = ['idNo', 'birthYear', 'birthMonth', 'birthDay', 'phone'];
    
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
        };

        chrome.storage.local.set(dataToSave, () => {
            const msg = document.getElementById('al-save-msg');
            msg.style.opacity = 1;
            setTimeout(() => { msg.style.opacity = 0; }, 2000);
        });
    });

    // --- 事件處理：拖曳 (僅針對空白處) ---
    let isDragging = false;
    let startX, startY, initialX, initialY;

    topBar.addEventListener('mousedown', (e) => {
        // 若點擊的是按鈕或開關，不觸發拖曳
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