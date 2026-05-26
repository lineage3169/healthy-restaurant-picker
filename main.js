// =============================================
// 健康餐店家隨機選擇器 - main.js
// =============================================

// ⚙️ 設定區：請將 Google 試算表的 CSV 匯出網址貼在這裡
// 格式：https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid=0
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1MMYTeK-OdQdDarmVRjPcOR-XpvnWZqFrP53pmDlu8KY/export?format=csv&gid=0";

// =============================================
// CSV 解析器（支援 Google Sheet 的雙引號與換行）
// =============================================
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (ch === "\r" && next === "\n") {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
  }

  // 最後一行
  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }

  return rows;
}

// =============================================
// 主應用程式狀態
// =============================================
let restaurants = [];
let isSpinning = false;
let spinInterval = null;

// =============================================
// DOM 元素取得
// =============================================
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const spinBtn = document.getElementById("spin-btn");
const resultCard = document.getElementById("result-card");
const restaurantNameEl = document.getElementById("restaurant-name");
const detailsEl = document.getElementById("details");
const loaderEl = document.getElementById("loader");
const errorBannerEl = document.getElementById("error-banner");
const errorMsgEl = document.getElementById("error-msg");
const listSectionEl = document.getElementById("restaurant-list-section");
const listGridEl = document.getElementById("restaurant-list-grid");

// =============================================
// 資料載入
// =============================================
async function loadData() {
  showLoader(true);
  hideError();

  if (!SHEET_CSV_URL || SHEET_CSV_URL === "YOUR_GOOGLE_SHEET_CSV_URL_HERE") {
    showError("尚未設定 Google 試算表 CSV 網址，請開啟 main.js 並設定 SHEET_CSV_URL。");
    showLoader(false);
    return;
  }

  try {
    // 使用 cors-anywhere 代理或直接抓取（GitHub Pages 需直接抓取）
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      showError("試算表中沒有任何店家資料（至少需要標題列加一筆資料）。");
      showLoader(false);
      return;
    }

    // 第一列為標題：店家名稱, 優點, 缺點, 免運費金額, 店家外送網址, 備註
    const headers = rows[0];
    const dataRows = rows.slice(1);

    restaurants = dataRows
      .filter((row) => row.some((cell) => cell !== "")) // 過濾空行
      .map((row) => ({
        name: row[0] || "",
        pros: row[1] || "",
        cons: row[2] || "",
        freeShipping: row[3] || "",
        url: row[4] || "",
        note: row[5] || "",
      }))
      .filter((r) => r.name); // 過濾沒有店名的列

    updateUI();
  } catch (err) {
    console.error("載入資料失敗：", err);
    showError(`無法讀取 Google 試算表資料。\n請確認網址是否正確，或試算表是否已公開。\n錯誤：${err.message}`);
  } finally {
    showLoader(false);
  }
}

// =============================================
// UI 更新
// =============================================
function updateUI() {
  const count = restaurants.length;

  if (count === 0) {
    countEl.textContent = "目前沒有可抽選的店家";
    spinBtn.disabled = true;
    spinBtn.classList.add("disabled");
    statusEl.className = "status-badge status-empty";
    statusEl.textContent = "無可用店家";
  } else {
    countEl.textContent = `共 ${count} 間店家可以抽選`;
    spinBtn.disabled = false;
    spinBtn.classList.remove("disabled");
    statusEl.className = "status-badge status-ready";
    statusEl.textContent = "資料已載入";
  }

  renderRestaurantList();
}

function showLoader(show) {
  loaderEl.style.display = show ? "flex" : "none";
}

function showError(msg) {
  errorMsgEl.textContent = msg;
  errorBannerEl.style.display = "flex";
}

function hideError() {
  errorBannerEl.style.display = "none";
}

// =============================================
// 抽獎動畫邏輯
// =============================================
function spin() {
  if (isSpinning || restaurants.length === 0) return;

  isSpinning = true;
  spinBtn.disabled = true;
  spinBtn.classList.add("spinning");
  spinBtn.textContent = "抽選中...";

  // 重置結果卡片
  resultCard.classList.remove("show", "result-reveal");
  detailsEl.innerHTML = "";

  // 顯示轉動中的卡片
  resultCard.classList.add("show", "spinning-card");
  restaurantNameEl.classList.add("name-spin");

  const finalIndex = Math.floor(Math.random() * restaurants.length);
  let spinCount = 0;
  const totalSpins = 28 + Math.floor(Math.random() * 10); // 28~37 次切換
  let delay = 60; // 初始速度

  function nextSpin() {
    const randomIdx = Math.floor(Math.random() * restaurants.length);
    restaurantNameEl.textContent = restaurants[randomIdx].name;
    spinCount++;

    // 計算下一次延遲（越來越慢）
    if (spinCount > totalSpins * 0.6) {
      delay = Math.min(delay * 1.18, 400);
    }

    if (spinCount >= totalSpins) {
      // 結束
      clearTimeout(spinInterval);
      setTimeout(() => finishSpin(finalIndex), delay + 100);
    } else {
      spinInterval = setTimeout(nextSpin, delay);
    }
  }

  spinInterval = setTimeout(nextSpin, delay);
}

function finishSpin(index) {
  const winner = restaurants[index];

  restaurantNameEl.classList.remove("name-spin");
  restaurantNameEl.textContent = winner.name;
  resultCard.classList.remove("spinning-card");
  resultCard.classList.add("result-reveal");

  // 渲染詳細資訊
  renderDetails(winner);

  isSpinning = false;
  spinBtn.disabled = false;
  spinBtn.classList.remove("spinning");
  spinBtn.textContent = "🎲 再抽一次";
}

function renderDetails(r) {
  const items = [];

  if (r.pros) {
    items.push(createDetailItem("👍", "優點", r.pros));
  }
  if (r.cons) {
    items.push(createDetailItem("👎", "缺點", r.cons));
  }
  if (r.freeShipping) {
    items.push(createDetailItem("🚚", "免運", formatFreeShipping(r.freeShipping)));
  }
  if (r.note) {
    items.push(createDetailItem("📝", "備註", r.note));
  }
  if (r.url) {
    const link = document.createElement("a");
    link.href = r.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "order-link";
    link.innerHTML = `🛒 前往點餐 <span class="link-arrow">↗</span>`;
    items.push(link);
  }

  detailsEl.innerHTML = "";
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "no-details";
    empty.textContent = "此店家尚無詳細資訊";
    detailsEl.appendChild(empty);
  } else {
    items.forEach((el) => detailsEl.appendChild(el));
  }
}

function formatFreeShipping(value) {
  const text = String(value).trim();
  return /^\d+$/.test(text) ? `NT$${text}` : text;
}

function createDetailItem(icon, label, value) {
  const item = document.createElement("div");
  item.className = "detail-item";

  // 處理多行文字（用換行分割，可能是原始 CSV 換行）
  const lines = value.split("\n").filter((l) => l.trim());
  const formattedValue =
    lines.length > 1
      ? `<ul class="detail-list">${lines.map((l) => `<li>${escapeHtml(l.trim().replace(/^[-–•]\s*/, ""))}</li>`).join("")}</ul>`
      : `<span>${escapeHtml(value)}</span>`;

  item.innerHTML = `
    <div class="detail-header">
      <span class="detail-icon">${icon}</span>
      <span class="detail-label">${label}</span>
    </div>
    <div class="detail-value">${formattedValue}</div>
  `;
  return item;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =============================================
// 店家列表
// =============================================
function renderRestaurantList() {
  if (!listSectionEl || !listGridEl) return;

  if (restaurants.length === 0) {
    listSectionEl.style.display = "none";
    return;
  }

  listSectionEl.style.display = "block";
  listGridEl.innerHTML = "";

  restaurants.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "list-card";
    card.style.animationDelay = `${i * 0.04}s`;

    const hasLink = !!r.url;
    const tags = [];
    if (r.freeShipping) tags.push(`🚚 免運 ${formatFreeShipping(r.freeShipping)}`);
    if (r.note) tags.push(`📝 ${r.note}`);

    const proLines = r.pros
      ? r.pros.split("\n").filter(l => l.trim()).map(l => escapeHtml(l.trim().replace(/^[-–•]\s*/, "")))
      : [];
    const conLines = r.cons
      ? r.cons.split("\n").filter(l => l.trim()).map(l => escapeHtml(l.trim().replace(/^[-–•]\s*/, "")))
      : [];

    card.innerHTML = `
      <div class="list-card-header">
        <span class="list-card-index">${i + 1}</span>
        <div class="list-card-title-group">
          <span class="list-card-name">${escapeHtml(r.name)}</span>
        </div>
      </div>
      ${proLines.length ? `
        <div class="list-card-section pros">
          <span class="list-card-section-label">👍 優點</span>
          <ul>${proLines.map(l => `<li>${l}</li>`).join("")}</ul>
        </div>` : ""}
      ${conLines.length ? `
        <div class="list-card-section cons">
          <span class="list-card-section-label">👎 缺點</span>
          <ul>${conLines.map(l => `<li>${l}</li>`).join("")}</ul>
        </div>` : ""}
      ${tags.length || hasLink ? `
        <div class="list-card-footer">
          ${tags.length ? `<div class="list-card-tags">${tags.map(t => `<span class="list-card-tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
          ${hasLink ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="list-card-link">點餐 ↗</a>` : ""}
        </div>` : ""}
    `;
    listGridEl.appendChild(card);
  });
}

// =============================================
// 事件綁定
// =============================================
spinBtn.addEventListener("click", spin);

document.getElementById("reload-btn").addEventListener("click", () => {
  resultCard.classList.remove("show", "result-reveal");
  detailsEl.innerHTML = "";
  restaurantNameEl.textContent = "？";
  spinBtn.textContent = "🎲 隨機選擇";
  loadData();
});

// =============================================
// 啟動
// =============================================
loadData();
