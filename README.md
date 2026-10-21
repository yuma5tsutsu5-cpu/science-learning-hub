# Science Learning Hub

理学部向けの学習プロンプト・書籍レビューサイトです。React + Vite のフロントエンドと Flask API を Docker Compose で起動します。

## 主な機能

- プロンプトと書籍レビューの閲覧
- 新しい投稿の申請
- 管理画面で申請を承認・却下
- 書籍レビューからCosenseの関連ノートを開く
- 管理画面から公開済みデータを削除
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

4. SupabaseのSession pooler接続文字列を `.env` の `DATABASE_URL` に設定します。

5. 起動します。

   ```bash
   docker compose up --build
   ```

6. 初回のみ、JSONの仮データをSupabaseへ移行します。

   ```bash
   docker compose exec backend python migrate_json_to_db.py
   ```

7. ブラウザで開きます。

   - サイト: <http://localhost:5173>
   - 管理画面: <http://localhost:5173/admin>
   - API動作確認: <http://localhost:5000/api/health>

管理画面では設定したパスワードと認証アプリの8桁コードを入力します。セッションは30分です。

## Cosense URL機能を追加した既存環境の更新

既存のSupabaseデータを残したまま、必要な列だけ追加します。更新後に一度だけ実行してください。

```bash
docker compose exec backend python add_cosense_url_column.py
```

このコマンドは何度実行しても既存データを削除しません。

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

## Renderへの本番公開

ルートの `Dockerfile` はReactをビルドし、Flaskから同一オリジンで配信します。RenderではDocker Web Serviceとして作成し、次の環境変数を設定します。

- `DATABASE_URL`
- `FLASK_SECRET_KEY`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_TOTP_SECRET`
- `ALLOWED_ORIGINS`（Renderの公開URL）
- `SESSION_COOKIE_SECURE=true`
- `SESSION_COOKIE_SAMESITE=Lax`

秘密情報を `.env` ごとGitHubへコミットしないでください。
