# 🥗 健康餐店家隨機選擇器

公司內部用的健康餐店家隨機抽選靜態網頁工具，從 Google 試算表即時讀取店家清單，一鍵隨機選出今天吃哪家！

## 功能

- ✅ 自動從 Google 試算表讀取店家資料（CSV 格式）
- ✅ 顯示可抽選店家總數
- ✅ 抽獎滾輪動畫效果
- ✅ 顯示抽中店家的優點、缺點、免運費門檻、外送連結、備註
- ✅ 支援直接部署到 GitHub Pages

## 試算表欄位格式

Google 試算表請按以下欄位順序建立：

| 欄位 | 說明 |
|------|------|
| 店家名稱 | 餐廳名稱（必填） |
| 優點 | 好吃的地方、同事心得 |
| 缺點 | 注意事項 |
| 免運費金額 | 例如：500 |
| 店家外送網址 | 外送平台連結 |
| 備註 | 其他補充 |

> 第一列為標題列，系統會自動跳過。

## 如何更換 Google 試算表

1. 開啟 `main.js`
2. 修改第 8 行的 `SHEET_CSV_URL`：

```js
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/{你的試算表ID}/export?format=csv&gid=0";
```

3. 確認試算表已設定為「知道連結的人可以檢視」

## 如何取得 Google 試算表 CSV 網址

1. 開啟 Google 試算表
2. 點選「檔案」→「共用」→「共用給他人」，設定為「知道連結的人」可以「檢視」
3. CSV 網址格式如下：
   ```
   https://docs.google.com/spreadsheets/d/{試算表ID}/export?format=csv&gid=0
   ```
   - `{試算表ID}` 為試算表網址中 `/d/` 和 `/edit` 之間的字串
   - `gid=0` 代表第一個工作表（Sheet1）

## 部署到 GitHub Pages

1. 將專案推送到 GitHub repository
2. 進入 repository 設定 → Pages
3. Source 選擇 `main` branch，資料夾選 `/ (root)`
4. 儲存後即可在 `https://{你的帳號}.github.io/{repo名稱}/` 存取

## 本地預覽

直接用瀏覽器開啟 `index.html` 可能因 CORS 政策無法讀取外部資料，建議使用本地伺服器：

```bash
# 使用 Python（需安裝 Python 3）
python -m http.server 8080

# 使用 Node.js（需安裝 Node.js）
npx serve .
```

然後開啟 `http://localhost:8080`

## 檔案結構

```
├── index.html   # 主頁面
├── style.css    # 樣式
├── main.js      # 邏輯（含 CSV 解析與抽獎動畫）
└── README.md    # 說明文件
```
