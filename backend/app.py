import hmac
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

import psycopg
import pyotp
from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from psycopg.rows import dict_row
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash


app = Flask(__name__, static_folder="static", static_url_path="")
app.json.ensure_ascii = False
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(32),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true",
    SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),
    MAX_CONTENT_LENGTH=64 * 1024,
)

ALLOWED_ORIGINS = {
    value.strip()
    for value in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if value.strip()
}
CORS(app, resources={r"/api/*": {"origins": list(ALLOWED_ORIGINS)}}, supports_credentials=True)

_login_attempts: dict[str, deque[float]] = defaultdict(deque)
_attempts_lock = threading.Lock()


def db_connect():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")
    return psycopg.connect(
        database_url,
        row_factory=dict_row,
        prepare_threshold=None,
        sslmode="require",
    )


def json_value(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def json_row(row):
    return {key: json_value(value) for key, value in row.items()} if row else None


def json_rows(rows):
    return [json_row(row) for row in rows]


def validated_payload(fields):
    if not request.is_json:
        return None, (jsonify({"message": "JSON形式で送信してください"}), 400)
    payload = request.get_json(silent=True) or {}
    missing = [
        field for field in fields
        if not isinstance(payload.get(field), str) or not payload[field].strip()
    ]
    if missing:
        return None, (jsonify({"message": "入力されていない項目があります", "missing_fields": missing}), 400)
    return {field: payload[field].strip() for field in fields}, None


def client_key():
    return request.remote_addr or "unknown"


def login_rate_limited():
    now = time.time()
    with _attempts_lock:
        attempts = _login_attempts[client_key()]
        while attempts and attempts[0] <= now - 3600:
            attempts.popleft()
        return sum(stamp > now - 60 for stamp in attempts) >= 5 or len(attempts) >= 20


def record_failed_login():
    with _attempts_lock:
        _login_attempts[client_key()].append(time.time())


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if session.get("admin_authenticated") is not True:
            return jsonify({"message": "管理者ログインが必要です"}), 401
        return view(*args, **kwargs)
    return wrapped


def csrf_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        expected = session.get("csrf_token", "")
        provided = request.headers.get("X-CSRF-Token", "")
        if not expected or not provided or not hmac.compare_digest(expected, provided):
            return jsonify({"message": "CSRFトークンが無効です"}), 403
        return view(*args, **kwargs)
    return wrapped


@app.before_request
def validate_request_origin():
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("Origin")
        if origin and origin not in ALLOWED_ORIGINS:
            return jsonify({"message": "許可されていない送信元です"}), 403


@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    if request.path.startswith(("/api/auth", "/api/admin")):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.errorhandler(psycopg.Error)
def database_error(error):
    app.logger.exception("Database error", exc_info=error)
    return jsonify({"message": "データベースへ接続できませんでした"}), 503


@app.post("/api/auth/login")
def admin_login():
    required = ("FLASK_SECRET_KEY", "ADMIN_PASSWORD_HASH", "ADMIN_TOTP_SECRET")
    if not all(os.environ.get(name) for name in required):
        return jsonify({"message": "管理者認証がまだ設定されていません"}), 503
    if login_rate_limited():
        return jsonify({"message": "試行回数が多すぎます。しばらく待ってください"}), 429
    payload = request.get_json(silent=True) or {}
    password_ok = check_password_hash(os.environ["ADMIN_PASSWORD_HASH"], payload.get("password", ""))
    otp_ok = pyotp.TOTP(os.environ["ADMIN_TOTP_SECRET"], digits=8, interval=30).verify(
        str(payload.get("otp", "")).replace(" ", ""), valid_window=1
    )
    if not password_ok or not otp_ok:
        record_failed_login()
        return jsonify({"message": "パスワードまたは認証コードが違います"}), 401
    with _attempts_lock:
        _login_attempts.pop(client_key(), None)
    session.clear()
    session.permanent = True
    session["admin_authenticated"] = True
    session["csrf_token"] = secrets.token_urlsafe(32)
    return jsonify({"message": "ログインしました", "authenticated": True, "csrf_token": session["csrf_token"]})


@app.get("/api/auth/session")
def auth_session():
    authenticated = session.get("admin_authenticated") is True
    return jsonify({"authenticated": authenticated, "csrf_token": session.get("csrf_token") if authenticated else None})


@app.post("/api/auth/logout")
@admin_required
@csrf_required
def admin_logout():
    session.clear()
    return jsonify({"message": "ログアウトしました"})


@app.get("/api/health")
def health():
    with db_connect() as connection:
        connection.execute("select 1")
    return jsonify({"status": "ok", "database": "connected"})


@app.get("/api/prompts")
def get_prompts():
    with db_connect() as connection:
        rows = connection.execute("select * from prompts order by id").fetchall()
    return jsonify(json_rows(rows))


@app.get("/api/prompts/<int:item_id>")
def get_prompt(item_id):
    with db_connect() as connection:
        row = connection.execute("select * from prompts where id = %s", (item_id,)).fetchone()
    return jsonify(json_row(row)) if row else (jsonify({"message": "指定されたプロンプトが見つかりません"}), 404)


@app.get("/api/books")
def get_books():
    with db_connect() as connection:
        rows = connection.execute("select * from books order by id").fetchall()
    return jsonify(json_rows(rows))


@app.get("/api/books/<int:item_id>")
def get_book(item_id):
    with db_connect() as connection:
        row = connection.execute("select * from books where id = %s", (item_id,)).fetchone()
    return jsonify(json_row(row)) if row else (jsonify({"message": "指定された書籍が見つかりません"}), 404)


@app.post("/api/submissions/prompts")
def create_prompt_submission():
    fields = ("title", "subject", "category", "difficulty", "description", "prompt", "reviewer")
    data, error = validated_payload(fields)
    if error:
        return error
    with db_connect() as connection:
        row = connection.execute(
            """insert into prompt_submissions
               (title, subject, category, difficulty, description, prompt, reviewer)
               values (%s, %s, %s, %s, %s, %s, %s) returning *""",
            tuple(data[field] for field in fields),
        ).fetchone()
    return jsonify({"message": "プロンプトの投稿申請を受け付けました", "submission": json_row(row)}), 201


@app.post("/api/submissions/books")
def create_book_submission():
    fields = ("title", "author", "subject", "purpose", "difficulty", "review", "reviewer")
    data, error = validated_payload(fields)
    if error:
        return error
    with db_connect() as connection:
        row = connection.execute(
            """insert into book_submissions
               (title, author, subject, purpose, difficulty, review, reviewer)
               values (%s, %s, %s, %s, %s, %s, %s) returning *""",
            tuple(data[field] for field in fields),
        ).fetchone()
    return jsonify({"message": "書籍レビューの投稿申請を受け付けました", "submission": json_row(row)}), 201


@app.get("/api/admin/submissions")
@admin_required
def get_pending_submissions():
    with db_connect() as connection:
        prompts = connection.execute("select * from prompt_submissions where status = 'pending' order by submitted_at").fetchall()
        books = connection.execute("select * from book_submissions where status = 'pending' order by submitted_at").fetchall()
    return jsonify({"prompts": json_rows(prompts), "books": json_rows(books)})


def approve_submission(kind, submission_id):
    is_prompt = kind == "prompts"
    submission_table = "prompt_submissions" if is_prompt else "book_submissions"
    public_table = "prompts" if is_prompt else "books"
    columns = (
        ("title", "subject", "category", "difficulty", "description", "prompt", "reviewer")
        if is_prompt else
        ("title", "author", "subject", "purpose", "difficulty", "review", "reviewer")
    )
    with db_connect() as connection:
        submission = connection.execute(
            f"select * from {submission_table} where id = %s for update", (submission_id,)
        ).fetchone()
        if not submission:
            return jsonify({"message": "申請が見つかりません"}), 404
        if submission["status"] != "pending":
            return jsonify({"message": "この申請はすでに処理されています"}), 409
        placeholders = ", ".join(["%s"] * len(columns))
        published = connection.execute(
            f"insert into {public_table} ({', '.join(columns)}) values ({placeholders}) returning *",
            tuple(submission[column] for column in columns),
        ).fetchone()
        connection.execute(
            f"update {submission_table} set status = 'approved', reviewed_at = now(), published_id = %s where id = %s",
            (published["id"], submission_id),
        )
    label = "プロンプト" if is_prompt else "書籍レビュー"
    return jsonify({"message": f"{label}を承認して公開しました", "published": json_row(published)})


def reject_submission(kind, submission_id):
    table = "prompt_submissions" if kind == "prompts" else "book_submissions"
    with db_connect() as connection:
        row = connection.execute(f"select status from {table} where id = %s for update", (submission_id,)).fetchone()
        if not row:
            return jsonify({"message": "申請が見つかりません"}), 404
        if row["status"] != "pending":
            return jsonify({"message": "この申請はすでに処理されています"}), 409
        connection.execute(f"update {table} set status = 'rejected', reviewed_at = now() where id = %s", (submission_id,))
    label = "プロンプト申請" if kind == "prompts" else "書籍レビュー申請"
    return jsonify({"message": f"{label}を却下しました"})


@app.post("/api/admin/submissions/<kind>/<int:submission_id>/<action>")
@admin_required
@csrf_required
def review_submission(kind, submission_id, action):
    if kind not in {"prompts", "books"} or action not in {"approve", "reject"}:
        return jsonify({"message": "無効な操作です"}), 404
    return approve_submission(kind, submission_id) if action == "approve" else reject_submission(kind, submission_id)


@app.get("/")
@app.get("/<path:path>")
def serve_frontend(path=""):
    static_dir = Path(app.static_folder)
    requested = static_dir / path
    if path and requested.is_file():
        return send_from_directory(static_dir, path)
    if path == "api" or path.startswith("api/"):
        return jsonify({"message": "APIが見つかりません"}), 404
    index = static_dir / "index.html"
    if index.is_file():
        return send_from_directory(static_dir, "index.html")
    return jsonify({"message": "フロントエンドは開発サーバー http://localhost:5173 で確認してください"}), 404
