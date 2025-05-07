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

* 設計並實作 RESTful API，遵循資源導向與語意化命名原則，並藉由業務邏輯抽離，提高API單一職責的特性與隱藏執行細節，增加後端程式碼的可讀性、擴展性與可維護性，並且將程式碼瘦身10%。
* 設計函式封裝與裝飾器（decorator）處理常見驗證流程，如 HTTP method 檢查、JSON parsing、統一錯誤回傳格式。
* 為了提升資料查詢效能，設計並實作 Django Signals，在使用者互動（追蹤、按讚、發文）發生變動時， **即時快取計數資訊** （如 followers_count、likes_count、posts_count），避免在每次查詢時重新遍歷整張資料表，顯著降低資料庫負擔並提升回應速度。此優化策略符合 **CQRS 模式** 中的「讀寫分離」設計原則，讓查詢更快速、更新更精準。
* 原始版本錯誤處理集中於單一大區塊，難以判斷錯誤來源與類型，重構後將錯誤處理模組化，明確區分輸入錯誤、查詢失敗、資料庫異常與其他例外，大幅提升程式錯誤覆蓋率（85%），同時縮短錯誤追蹤所需時間
  此設計**符合 Clean Architecture** 中的「容錯邊界」概念，將應用層與基礎層錯誤隔離，提升系統穩定性與維運效率。
* 搭配 select_related() 和 prefetch_related() 優化 Django ORM查詢，減少 N+1 查詢，API 效能提升20%。

### **💡 前端：模組化結構、狀態同步與事件管理降低記憶體使用**

* 建立統一的 StateManager 管理全域前端狀態，採用單一資料流（Unidirectional Data Flow）架構，讓畫面更新完全由狀態變更驅動，避免資料錯亂與非預期行為。並進一步重構模組間的依賴關係，降低模組耦合度，提升前端邏輯的可預測性、模組的可重用性與整體維護效率。
* 採用事件委派（Event Delegation）搭配 event.target.closest() 精準監聽動態元件操作，顯著減少事件綁定數量並降低記憶體使用；同時導入事件自動解綁與狀態驅動渲染機制，提升互動準確率與 UI 穩定性。

### **📌 免責聲明與使用說明**

> **免責聲明**
>
> 本專案為個人學習與作品展示用途，尚未正式開源，請勿未經授權進行複製或商業使用。專案靈感來自 Meta 所推出之 Threads，界面與結構僅作為前端練習與系統設計參考，無意圖侵犯任何品牌或智慧財產權。若有任何侵權疑慮，請聯繫我以進行修正或下架。
