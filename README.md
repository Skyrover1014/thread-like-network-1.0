# Network

Network專案是參考Threads的作品雛形，這是一個使用 Django + Tailwind + Cloudinary（可選）的全端應用範例，目前規劃為特定使用族群交流與共學的模板專案，支援使用者註冊、貼文等功能，支援本地與 Render 自動部署。

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

### **📌 免責聲明與使用說明**

> **免責聲明**
>
> 本專案為個人學習與作品展示用途，尚未正式開源，請勿未經授權進行複製或商業使用。專案靈感來自 Meta 所推出之 Threads，介面與結構僅作為前端練習與系統設計參考，無意圖侵犯任何品牌或智慧財產權。若有任何侵權疑慮，請聯繫我以進行修正或下架。
