# Privacy Policy / 隱私權政策

**Extension Name / 套件名稱**: 運動部115揮汗有禮自動登入 (sport115-sweat-autologin)  
**Developer / 開發者**: blues32767  
**Repository / 專案庫**: [https://github.com/blues32767/sport115-sweat-autologin](https://github.com/blues32767/sport115-sweat-autologin)  
**Effective Date / 最後更新日期**: 2026-09-02  

---

## 繁體中文版

本擴充套件（以下簡稱「本套件」）尊重並重視使用者的個人隱私。為符合《Google Chrome 線上應用程式商店開發人員計畫政策》，特此說明本套件對使用者資料的處理原則。

### 1. 資料收集與使用方式
* **個人識別資訊**：本套件提供使用者設定身分證字號、出生日期（年／月／日）及手機號碼，僅用於在活動登入頁面執行自動填表輔助。
* **排程設定**：使用者自訂之每週自動開啟與登入排程時間。
* **儲存機制**：上述所有資料僅存放於使用者瀏覽器的本機儲存空間（`chrome.storage.local`）。本套件**未建置任何遠端伺服器或資料庫**，絕不會將您的個資傳輸、上傳或備份至任何外部網路或第三方。

### 2. 權限需求說明
* **`storage`**：用於在使用者裝置端保存登入憑證與自訂排程偏好。
* **`alarms`**：用於定期比對系統時間，於使用者指定的排程時間觸發提醒或開啟頁面，避免背景常駐佔用資源。
* **`tabs`**：當排程時間到達或手動點擊啟動時，用於開啟活動官方登入網址。
* **主機存取權限（Host Permissions）**：僅限於 `https://500.gov.tw/registrant/*` 單一網域路徑，用於在該網頁注入自動化登入控制項與讀取「我的任務」之審核進度狀態。

### 3. 資料揭露與第三方共享
* 本套件不包含任何第三方追蹤分析工具（如 Google Analytics、廣告 SDK 等）。
* 開發者絕不會將使用者的個人資訊進行販售、租借、轉移或作為信用評估用途。

### 4. 資料刪除與留存
* 使用者可隨時於擴充套件設定面板中覆蓋、清空已輸入的欄位。
* 當使用者從 Chrome 瀏覽器中解除安裝或移除本套件時，所有存放於本機瀏覽器中的相關資料將一併被永久刪除。

### 5. 聯絡方式
若對本隱私權政策或套件運作有任何疑問，請透過 GitHub Issue 提出：  
[https://github.com/blues32767/sport115-sweat-autologin/issues](https://github.com/blues32767/sport115-sweat-autologin/issues)

---

## English Version

This Privacy Policy describes how "sport115-sweat-autologin" (the "Extension") handles user information in accordance with the Google Chrome Web Store Developer Program Policies.

### 1. Data Collection and Usage
* **Personal Identification Information**: The Extension allows users to store their National Identification Number (ID), Date of Birth, and Mobile Phone Number solely for automating the login and identity verification process on the official campaign website.
* **Scheduling Preferences**: User-defined weekly schedules for automated login triggers.
* **Storage Mechanism**: All user data is stored strictly locally on the user's device via `chrome.storage.local`. The Extension **does not operate any remote servers or external databases**. Your personal information is never uploaded, transmitted, synchronized, or shared with external parties.

### 2. Permissions Justification
* **`storage`**: Used to save login credentials and user preferences locally within the browser.
* **`alarms`**: Used to check scheduled times periodically to initiate the login workflow without consuming background resources constantly.
* **`tabs`**: Used to create a browser tab navigating to the official login URL when a schedule triggers or when the user initiates manual login.
* **Host Permissions**: Limited strictly to `https://500.gov.tw/registrant/*` to inject form-filling scripts and read the user's task verification status.

### 3. Third-Party Disclosure
* The Extension does not integrate any third-party tracking, telemetry, advertising, or analytics libraries.
* The developer will never sell, transfer, monetize, or use personal data for creditworthiness or advertising purposes.

### 4. Data Retention and Deletion
* Users may clear or update their saved data at any time via the extension settings panel.
* Uninstalling or removing the Extension from Google Chrome will permanently delete all stored data from the local storage.

### 5. Contact Information
If you have questions or suggestions regarding this Privacy Policy, please open an issue on the project repository:  
[https://github.com/blues32767/sport115-sweat-autologin/issues](https://github.com/blues32767/sport115-sweat-autologin/issues)
