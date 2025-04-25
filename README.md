# README: Network Project 啟動說明

這是一個使用 Django 架構建置的社群平台專案。

---

## ✅ 啟動環境需求

- Python 3.13
- Node.js 18.18.0（建議使用 nvm 管理）

---

## 📦 安裝步驟

### 1. 建立虛擬環境並啟用

```bash
python3 -m venv .venv
source .venv/bin/activate      # Windows 使用者：.venv\Scripts\activate
```

### 2. 安裝 Python 套件

```bash
pip install -r requirements.txt
```

### 3. 安裝 Tailwind 依賴並啟動 watcher

```bash
nvm use 18.18.0
python manage.py tailwind install
python manage.py tailwind start
```

> 請確保已安裝 nvm，如尚未安裝請參考：https://github.com/nvm-sh/nvm

---

## 🚀 啟動 Django 專案

### 1. 套用資料庫遷移（如尚未完成）

```bash
python manage.py migrate
```

### 2. 啟動伺服器

```bash
python manage.py runserver
```

瀏覽器打開：http://127.0.0.1:8000 即可瀏覽本地開發環境。

---

## 📁 專案目錄結構簡介（部分）

```
project4/
├── network/                # Django App
├── static/network/         # 靜態資源（JS / CSS）
├── templates/network/      # HTML 樣板
├── manage.py
├── requirements.txt
└── README.md
```

---

如有問題可聯繫專案作者或檢查是否啟動正確虛擬環境與 Node 版本。

祝開發順利 🚀
