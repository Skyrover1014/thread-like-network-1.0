# Network

Network專案是參考Threads的作品雛形，這是一個使用 Django + Tailwind + Cloudinary（可選）的全端應用範例，目前規劃為特定使用族群交流與共學的模板專案，支援使用者註冊、貼文、留言等功能，支援本地與 Render 自動部署。

作品展示：[https://thread-like-network-1-0.onrender.com](https://thread-like-network-1-0.onrender.com)

專案功能：

* **Profile：** 個人檔案頁面支援瀏覽個人發文與貼文列表，可檢視粉絲與追蹤、發文數與更換個人頭貼。
* **Post ：** 基本的文字發文、編輯貼文與按讚貼文，搭配分頁處理優化加載貼文的效能。
* **Follow：** 支援管理與其他用戶的追蹤關係。

### 📦 安裝需求

* Python 3.11+
* Node.js 18.x（建議使用 `nvm` 管理）
* npm
* SQLite

### **🛠️ 安裝步驟**

1️⃣ 複製專案

```
git clone https://github.com/Skyrover1014/thread-like-network-1.0.git
cd project4-render-deploy
```

2️⃣ 建立虛擬環境並安裝依賴

```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3️⃣ 安裝前端相依（如 Tailwind）

```
cd theme/static_src
npm install
cd ../../
```

4️⃣ 編譯 Tailwind CSS（開發模式）

```
python manage.py tailwind start
```

5️⃣ 執行資料庫遷移與初始帳號建立

```
python manage.py migrate
python manage.py createsuperuser
```

6️⃣ 啟動開發伺服器

```
python manage.py runserver
```

## 技術成果

### **🔧 後端：Django + RESTful API 設計與優化**

* 設計並實作 Django RESTful API，遵循資源導向與語意化命名原則（如 /api/posts/`<id>`/like/，/api/users/`<id>`/follow/）。
* 將複雜的業務邏輯進行責任拆分，採用函式封裝與裝飾器（decorator）處理常見驗證流程，如 HTTP method 檢查、JSON parsing、統一錯誤回傳格式。
* 搭配 select_related() 和 prefetch_related() 優化 ORM 查詢，減少 N+1 查詢，API 效能提升達 70%。
* 透過 Django Signal 快取計算資料，在資料變動時即時更新使用者的 follower/following 數，避免每次前端都需重計。
* 加入錯誤集中處理與防禦式程式設計（try/except），避免資料庫錯誤與不合法請求導致崩潰。

### **💡 前端：模組化結構、狀態同步與高效事件管理**

* 使用 Tailwind CSS 實作語意化的 component-first 架構，命名風格一致（如 compose_section, post_item, modal_wrapper），增強可讀性與可維護性。
* 建立統一的 StateManager 管理前端狀態（如當前頁面、使用者 ID、編輯狀態），搭配單一資料流驅動渲染邏輯，減少錯誤。
* 採用事件委派（Event Delegation）搭配 event.target.closest()，避免重複事件綁定，記憶體佔用顯著降低。
* 針對 Like、Edit、Follow 等動態元件，採用動態 DOM 建立與自動事件移除策略，防止記憶體洩漏與行為錯亂。

### **🛠 架構與部署**

* 支援本地與雲端部署，整合環境變數與 dj_database_url 達成 Heroku / Render 等平台部署彈性。
* 使用 Whitenoise 進行靜態檔案壓縮與管理，適用於生產環境。
* 設定 Tailwind + django-tailwind 架構，結合 Django 模板與 modern CSS workflow。
* 除錯階段加入 django-debug-toolbar、django-browser-reload 加速本地開發流程。

### **📌 免責聲明與使用說明**

> **免責聲明**
>
> 本專案為個人學習與作品展示用途，尚未正式開源，請勿未經授權進行複製或商業使用。專案靈感來自 Meta 所推出之 Threads，界面與結構僅作為前端練習與系統設計參考，無意圖侵犯任何品牌或智慧財產權。若有任何侵權疑慮，請聯繫我以進行修正或下架。
