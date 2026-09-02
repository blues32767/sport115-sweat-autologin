/**
 * @file 運動部115揮汗有禮自動登入
 * @author blues32767
 * @date 2026/09/02
 * @license MIT
 * @repository https://github.com/blues32767/sport115-sweat-autologin
 */

// 啟動時設定每 1 分鐘檢查一次的計時器
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('checkAutoLogin', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkAutoLogin') {
        // 將原本的 lastTriggeredDate 改為 lastTriggeredKey
        chrome.storage.local.get(['autoOpenEnabled', 'autoOpenDay', 'autoOpenTime', 'lastTriggeredKey'], (data) => {
            if (!data.autoOpenEnabled || !data.autoOpenDay || !data.autoOpenTime) return;

            const now = new Date();
            // 活動結束後 (2026/11/30 24:00 後) 停止觸發
            if (now.getTime() > new Date('2026-11-30T23:59:59+08:00').getTime()) return;

            const currentDay = now.getDay(); // 0 是週日, 1-6 是週一到週六
            const targetDay = parseInt(data.autoOpenDay, 10);
            const jsTargetDay = targetDay === 7 ? 0 : targetDay; 

            const currentTimeStr = now.toTimeString().slice(0, 5); // 取得 "HH:MM"
            const currentDateStr = now.toDateString(); 

            // 如果星期與時間都符合設定
            if (currentDay === jsTargetDay && currentTimeStr === data.autoOpenTime) {
                
                // 【修正重點】使用「當前日期 + 設定的時間」作為唯一識別碼
                const currentTriggerKey = `${currentDateStr}-${data.autoOpenTime}`;
                
                // 檢查這個組合是否已經觸發過，避免同一分鐘內重複開啟
                if (data.lastTriggeredKey === currentTriggerKey) return; 

                // 記錄這次觸發的組合，並設定跨分頁的自動登入旗標
                chrome.storage.local.set({ 
                    lastTriggeredKey: currentTriggerKey,
                    triggerAutoLogin: true 
                }, () => {
                    // 自動開啟登入網頁
                    chrome.tabs.create({ url: 'https://500.gov.tw/registrant/access' });
                });
            }
        });
    }
});