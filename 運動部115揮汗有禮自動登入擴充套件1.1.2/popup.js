document.addEventListener('DOMContentLoaded', () => {
  const fields = ['idNo', 'birthYear', 'birthMonth', 'birthDay', 'phone'];
  
  // 讀取既有設定
  chrome.storage.local.get(fields, (data) => {
    fields.forEach(field => {
      if (data[field]) document.getElementById(field).value = data[field];
    });
  });

  // 儲存設定
  document.getElementById('saveBtn').addEventListener('click', () => {
    const dataToSave = {};
    fields.forEach(field => {
      dataToSave[field] = document.getElementById(field).value.trim();
    });

    chrome.storage.local.set(dataToSave, () => {
      const status = document.getElementById('statusMsg');
      status.style.opacity = 1;
      setTimeout(() => { status.style.opacity = 0; }, 2000);
    });
  });
});