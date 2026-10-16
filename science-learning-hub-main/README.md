# Science Learning Hub

理学部向けの学習プロンプト・書籍レビューサイトです。React + Vite のフロントエンドと Flask API を Docker Compose で起動します。

## 主な機能

- プロンプトと書籍レビューの閲覧
- 新しい投稿の申請
- 管理画面で申請を承認・却下
- 管理画面のパスワード + 8桁TOTP（二要素認証）
- セッションCookie、CSRF対策、Origin検査、ログイン試行制限

## 初回セットアップ

1. 設定ファイルを作ります。

   ```bash
   cp .env.example .env
   ```

2. 依存関係を含む一時コンテナで秘密情報を生成します。

   ```bash
   docker compose run --rm backend python create_admin_secrets.py
   ```

3. 表示された3行を `.env` の同名3項目へ貼り付けます。表示されたセットアップURIは、8桁TOTPに対応する認証アプリへ登録します。`.env` やセットアップURIはGitHubへ公開しないでください。

4. 起動します。

   ```bash
   docker compose up --build
   ```

5. ブラウザで開きます。

   - サイト: <http://localhost:5173>
   - 管理画面: <http://localhost:5173/admin>
   - API動作確認: <http://localhost:5000/api/health>

管理画面では設定したパスワードと認証アプリの8桁コードを入力します。セッションは30分です。

## 開発時のコマンド

コンテナが停止中なら、`docker compose exec` より先に起動してください。

```bash
docker compose up -d --build
docker compose ps
docker compose exec frontend npm run build
docker compose exec backend python -m unittest test_app.py
```

ログを見る場合:

```bash
docker compose logs -f backend frontend
```

停止する場合:

```bash
docker compose down
```

## 本番公開時

- HTTPSを使用し、`.env` の `SESSION_COOKIE_SECURE` を `true` にする
- `ALLOWED_ORIGINS` を実際のフロントエンドURLだけにする
- `VITE_API_BASE_URL` を公開APIのURLにする
- JSONファイルは複数プロセスから同時更新する本番運用には向かないため、公開前にデータベースへ移行する
