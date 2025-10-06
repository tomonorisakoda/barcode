const codeReader = new ZXing.BrowserBarcodeReader();
const videoElement = document.getElementById('video');
const resultsDiv = document.getElementById('results');
const dataList = document.getElementById('dataList');
let currentBarcode = '';
let entries = [];

window.onload = () => {
  const saved = localStorage.getItem('barcodeEntries');
  if (saved) {
    entries = JSON.parse(saved);
    updateList();
  }
};

async function startScanner() {
  resultsDiv.textContent = 'バーコードをスキャン中...';
  try {
    const constraints = {
      video: {
        facingMode: { exact: "environment" }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;

    const result = await codeReader.decodeOnceFromStream(stream, videoElement);
    currentBarcode = result.text;
    resultsDiv.textContent = `✅ 読み取ったバーコード: ${currentBarcode}`;
    codeReader.reset();
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
    resultsDiv.textContent = '❌ 読み取り失敗: ' + err;
  }
}

function saveEntry() {
  const value = document.getElementById('valueInput').value;
  if (!currentBarcode) {
    alert('バーコードが読み取られていません');
    return;
  }
  if (!value || isNaN(value) || Number(value) < 0) {
    alert('有効な数値を入力してください');
    return;
  }

  const timestamp = new Date().toISOString();
  const existingIndex = entries.findIndex(e => e.barcode === currentBarcode);

  if (existingIndex >= 0) {
    entries[existingIndex] = { barcode: currentBarcode, value, time: timestamp };
  } else {
    entries.push({ barcode: currentBarcode, value, time: timestamp });
  }

  saveToLocalStorage();
  updateList();

  currentBarcode = '';
  document.getElementById('valueInput').value = '';
  resultsDiv.textContent = '';
}

function appendToList(barcode, value, time) {
  const li = document.createElement('li');
  li.textContent = `バーコード: ${barcode}, 個数: ${value}, 時刻: ${time}`;
  dataList.appendChild(li);
}

function updateList() {
  dataList.innerHTML = '';
  entries.forEach(e => appendToList(e.barcode, e.value, e.time));
}

function saveToLocalStorage() {
  localStorage.setItem('barcodeEntries', JSON.stringify(entries));
}

function createCSV(entries) {
  let csv = 'バーコード,個数,タイムスタンプ\n';
  csv += entries.map(e => `${e.barcode},${e.value},${e.time}`).join('\n');
  return csv;
}

function downloadCSV() {
  const csv = createCSV(entries);

  // BOMを付与（Excelでの文字化け対策）
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);

  // Blobでデータを作成
  const blob = new Blob([bom, new TextEncoder().encode(csv)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  // 日時をファイル名に追加（例: barcode_data_2025-10-04_05-02.csv）
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
  const filename = `barcode_data_${timestamp}.csv`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function clearEntries() {
  if (confirm("本当にすべてのデータを削除しますか？")) {
    entries = [];
    localStorage.removeItem('barcodeEntries');
    updateList();
    resultsDiv.textContent = '🗑️ データ一覧を削除しました';
  }
}