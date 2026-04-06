# Choice Index

買い物比較メモアプリ。商品の単価比較・店別確認・買い物メモが一画面でできます。

## ファイル構成

```
choice-index/
├── index.html     # アプリ本体（全機能）
├── vercel.json    # Vercel設定
├── .gitignore
└── README.md
```

## GitHub + Vercel での公開手順

### 初回セットアップ

1. GitHubで新しいリポジトリを作成（例: `choice-index`）
2. ローカルにクローン or このファイルをアップロード
3. [vercel.com](https://vercel.com) にログイン → **Add New Project**
4. GitHubリポジトリを選択 → **Deploy**

### 更新方法

`index.html` を編集して GitHub にプッシュすると、Vercel が自動でデプロイします。

```bash
git add .
git commit -m "update"
git push
```
