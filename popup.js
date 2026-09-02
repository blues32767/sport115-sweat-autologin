/**
 * @file 運動部115揮汗有禮自動登入
 * @author blues32767
 * @date 2026/09/02
 * @license MIT
 * @repository https://github.com/blues32767/sport115-sweat-autologin
 */

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

function getRemainingTimeStr(targetDate) {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return '0天0小時';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}天${hours}小時`;
}

function updateTimeDisplay() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('sysTime').textContent = `目前系統時間：${y} ${m} ${d} ${h} ${min}`;
}

document.addEventListener('DOMContentLoaded', () => {
    // 0. 手動立即自動登入按鈕邏輯
    const quickToggle = document.getElementById('quickStartToggle');
    const quickText = document.getElementById('quickStartText');
    
    quickToggle.addEventListener('click', () => {
        if (quickToggle.classList.contains('active')) return;

        // 觸發動畫
        quickToggle.classList.add('active');
        quickText.innerHTML = '<strong>🚀 開啟新分頁啟動中...</strong>';
        quickText.style.color = '#34C759';

        // 設定旗標，並呼叫 API 開啟登入分頁
        chrome.storage.local.set({ triggerAutoLogin: true }, () => {
            setTimeout(() => {
                chrome.tabs.create({ url: 'https://500.gov.tw/registrant/access' });
            }, 350); // 稍微延遲讓使用者看完療癒的滑動動畫
        });
    });

    // 1. 更新時間
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 10000); 

    // 2. 讀取並顯示任務狀態
    chrome.storage.local.get(['lastUploadedPeriod'], (data) => {
        const now = new Date();
        const lastUploaded = data.lastUploadedPeriod || 0;
        const statusEl = document.getElementById('popupStatus');

        if (now.getTime() > new Date(TASK_PERIODS[13].end).getTime()) {
            statusEl.innerHTML = '活動已結束，感謝您的參與！';
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
            statusEl.innerHTML = '目前非任務開放期間。';
        } else if (lastUploaded >= currPeriod.no) {
            if (currPeriodIdx + 1 < TASK_PERIODS.length) {
                const next = TASK_PERIODS[currPeriodIdx + 1];
                const nextStart = new Date(next.start);
                const mmStart = nextStart.getMonth() + 1;
                const ddStart = nextStart.getDate();
                const nextEnd = new Date(next.end);
                const mmEnd = nextEnd.getMonth() + 1;
                const ddEnd = nextEnd.getDate();
                const remain = getRemainingTimeStr(nextStart);
                statusEl.innerHTML = `已上傳第${lastUploaded}期<br>下期任務：${mmStart}/${ddStart}－${mmEnd}/${ddEnd}<br>距下期開始剩 ${remain}`;
            } else {
                statusEl.innerHTML = `已上傳第${lastUploaded}期 (最後一期)<br>已完成所有任務！`;
            }
        } else {
            const remain = getRemainingTimeStr(new Date(currPeriod.end));
            const uploadedText = lastUploaded > 0 ? `已上傳第${lastUploaded}期<br>` : '';
            statusEl.innerHTML = `${uploadedText}尚未上傳第${currPeriod.no}期<br>本期剩餘時間：${remain}`;
        }
    });

    // 3. 讀取與儲存表單
    const fields = ['idNo', 'birthYear', 'birthMonth', 'birthDay', 'phone', 'autoOpenDay', 'autoOpenTime'];
    
    chrome.storage.local.get([...fields, 'autoOpenEnabled'], (data) => {
        fields.forEach(field => { if (data[field]) document.getElementById(field).value = data[field]; });
        if (data.autoOpenEnabled) document.getElementById('autoOpenEnabled').checked = data.autoOpenEnabled;
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
        const dataToSave = { autoOpenEnabled: document.getElementById('autoOpenEnabled').checked };
        fields.forEach(field => { dataToSave[field] = document.getElementById(field).value.trim(); });

        chrome.storage.local.set(dataToSave, () => {
            const msg = document.getElementById('statusMsg');
            msg.style.opacity = 1;
            setTimeout(() => { msg.style.opacity = 0; }, 2000);
        });
    });
});