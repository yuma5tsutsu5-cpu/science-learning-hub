import hmac
import json
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from datetime import timedelta
from functools import wraps
from pathlib import Path

import pyotp
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash


app = Flask(__name__)
app.json.ensure_ascii = False
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(32),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "false").lower()
    == "true",
    SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),
)

ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
}

CORS(
    app,
    resources={r"/api/*": {"origins": list(ALLOWED_ORIGINS)}},
    supports_credentials=True,
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

_login_attempts: dict[str, deque[float]] = defaultdict(deque)
_attempts_lock = threading.Lock()


def load_json(filename):
    file_path = DATA_DIR / filename

    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)

def save_json(filename, data):
    """dataフォルダのJSONファイルへデータを保存する"""
    file_path = DATA_DIR / filename

    with file_path.open("w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )


def _client_key():
    return request.remote_addr or "unknown"


def _login_rate_limited():
    now = time.time()
    key = _client_key()
    with _attempts_lock:
        attempts = _login_attempts[key]
        while attempts and attempts[0] <= now - 3600:
            attempts.popleft()
        attempts_last_minute = sum(timestamp > now - 60 for timestamp in attempts)
        return attempts_last_minute >= 5 or len(attempts) >= 20


def _record_failed_login():
    with _attempts_lock:
        _login_attempts[_client_key()].append(time.time())


def _clear_failed_logins():
    with _attempts_lock:
        _login_attempts.pop(_client_key(), None)


def _auth_is_configured():
    return all(
        os.environ.get(name)
        for name in ("FLASK_SECRET_KEY", "ADMIN_PASSWORD_HASH", "ADMIN_TOTP_SECRET")
    )


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
    if request.path.startswith("/api/auth") or request.path.startswith("/api/admin"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.post("/api/auth/login")
def admin_login():
    if not _auth_is_configured():
        return jsonify({"message": "管理者認証がまだ設定されていません"}), 503
    if _login_rate_limited():
        return jsonify({"message": "試行回数が多すぎます。しばらく待ってください"}), 429

    payload = request.get_json(silent=True) or {}
    password = payload.get("password", "")
    otp = str(payload.get("otp", "")).replace(" ", "")
    password_ok = check_password_hash(os.environ["ADMIN_PASSWORD_HASH"], password)
    otp_ok = pyotp.TOTP(
        os.environ["ADMIN_TOTP_SECRET"], digits=8, interval=30
    ).verify(otp, valid_window=1)

    if not password_ok or not otp_ok:
        _record_failed_login()
        return jsonify({"message": "パスワードまたは認証コードが違います"}), 401

    _clear_failed_logins()
    session.clear()
    session.permanent = True
    session["admin_authenticated"] = True
    session["csrf_token"] = secrets.token_urlsafe(32)
    return jsonify({
        "message": "ログインしました",
        "authenticated": True,
        "csrf_token": session["csrf_token"],
    })


@app.get("/api/auth/session")
def auth_session():
    authenticated = session.get("admin_authenticated") is True
    return jsonify({
        "authenticated": authenticated,
        "csrf_token": session.get("csrf_token") if authenticated else None,
    })


@app.post("/api/auth/logout")
@admin_required
@csrf_required
def admin_logout():
    session.clear()
    return jsonify({"message": "ログアウトしました"})

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/prompts")
def get_prompts():
    return jsonify(load_json("prompts.json"))


@app.get("/api/books")
def get_books():
    return jsonify(load_json("books.json"))


@app.post("/api/test")
def receive_test_data():
    received_data = request.get_json()

    return jsonify({
        "message": "FlaskでJSONを受け取りました",
        "received": received_data
    }), 200

@app.get("/api/prompts/<int:prompt_id>")
def get_prompt(prompt_id):
    prompts = load_json("prompts.json")

    prompt = next(
        (item for item in prompts if item["id"] == prompt_id),
        None
    )

    if prompt is None:
        return jsonify({
            "message": "指定されたプロンプトが見つかりません"
        }), 404

    return jsonify(prompt)


@app.get("/api/books/<int:book_id>")
def get_book(book_id):
    books = load_json("books.json")

    book = next(
        (item for item in books if item["id"] == book_id),
        None
    )

    if book is None:
        return jsonify({
            "message": "指定された書籍が見つかりません"
        }), 404

    return jsonify(book)


@app.post("/api/submissions/prompts")
def create_prompt_submission():
    if not request.is_json:
        return jsonify({
            "message": "JSON形式で送信してください"
        }), 400

    received_data = request.get_json()

    required_fields = [
        "title",
        "subject",
        "category",
        "difficulty",
        "description",
        "prompt",
        "reviewer",
    ]

    missing_fields = [
        field
        for field in required_fields
        if not isinstance(received_data.get(field), str)
        or not received_data.get(field).strip()
    ]

    if missing_fields:
        return jsonify({
            "message": "入力されていない項目があります",
            "missing_fields": missing_fields,
        }), 400

    submissions = load_json("prompt_submissions.json")

    next_id = max(
        (item["id"] for item in submissions),
        default=0
    ) + 1

    new_submission = {
        "id": next_id,
        "title": received_data["title"].strip(),
        "subject": received_data["subject"].strip(),
        "category": received_data["category"].strip(),
        "difficulty": received_data["difficulty"].strip(),
        "description": received_data["description"].strip(),
        "prompt": received_data["prompt"].strip(),
        "reviewer": received_data["reviewer"].strip(),
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }

    submissions.append(new_submission)
    save_json("prompt_submissions.json", submissions)

    return jsonify({
        "message": "プロンプトの投稿申請を受け付けました",
        "submission": new_submission,
    }), 201


@app.post("/api/submissions/books")
def create_book_submission():
    if not request.is_json:
        return jsonify({
            "message": "JSON形式で送信してください"
        }), 400

    received_data = request.get_json()

    required_fields = [
        "title",
        "author",
        "subject",
        "purpose",
        "difficulty",
        "review",
        "reviewer",
    ]

    missing_fields = [
        field
        for field in required_fields
        if not isinstance(received_data.get(field), str)
        or not received_data.get(field).strip()
    ]

    if missing_fields:
        return jsonify({
            "message": "入力されていない項目があります",
            "missing_fields": missing_fields,
        }), 400

    submissions = load_json("book_submissions.json")

    next_id = max(
        (item["id"] for item in submissions),
        default=0
    ) + 1

    new_submission = {
        "id": next_id,
        "title": received_data["title"].strip(),
        "author": received_data["author"].strip(),
        "subject": received_data["subject"].strip(),
        "purpose": received_data["purpose"].strip(),
        "difficulty": received_data["difficulty"].strip(),
        "review": received_data["review"].strip(),
        "reviewer": received_data["reviewer"].strip(),
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }

    submissions.append(new_submission)
    save_json("book_submissions.json", submissions)

    return jsonify({
        "message": "書籍レビューの投稿申請を受け付けました",
        "submission": new_submission,
    }), 201




@app.get("/api/admin/submissions")
@admin_required
def get_pending_submissions():
    prompt_submissions = load_json("prompt_submissions.json")
    book_submissions = load_json("book_submissions.json")

    pending_prompts = [
        item
        for item in prompt_submissions
        if item["status"] == "pending"
    ]

    pending_books = [
        item
        for item in book_submissions
        if item["status"] == "pending"
    ]

    return jsonify({
        "prompts": pending_prompts,
        "books": pending_books,
    })


@app.post("/api/admin/submissions/prompts/<int:submission_id>/approve")
@admin_required
@csrf_required
def approve_prompt_submission(submission_id):
    submissions = load_json("prompt_submissions.json")

    submission = next(
        (
            item
            for item in submissions
            if item["id"] == submission_id
        ),
        None,
    )

    if submission is None:
        return jsonify({
            "message": "プロンプト申請が見つかりません"
        }), 404

    if submission["status"] != "pending":
        return jsonify({
            "message": "この申請はすでに処理されています"
        }), 409

    prompts = load_json("prompts.json")

    next_prompt_id = max(
        (item["id"] for item in prompts),
        default=0,
    ) + 1

    new_prompt = {
        "id": next_prompt_id,
        "title": submission["title"],
        "subject": submission["subject"],
        "category": submission["category"],
        "difficulty": submission["difficulty"],
        "description": submission["description"],
        "prompt": submission["prompt"],
    }

    prompts.append(new_prompt)
    save_json("prompts.json", prompts)

    submission["status"] = "approved"
    submission["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    submission["published_id"] = next_prompt_id

    save_json("prompt_submissions.json", submissions)

    return jsonify({
        "message": "プロンプトを承認して公開しました",
        "published": new_prompt,
    })




@app.post("/api/admin/submissions/books/<int:submission_id>/approve")
@admin_required
@csrf_required
def approve_book_submission(submission_id):
    submissions = load_json("book_submissions.json")

    submission = next(
        (
            item
            for item in submissions
            if item["id"] == submission_id
        ),
        None,
    )

    if submission is None:
        return jsonify({
            "message": "書籍レビュー申請が見つかりません"
        }), 404

    if submission["status"] != "pending":
        return jsonify({
            "message": "この申請はすでに処理されています"
        }), 409

    books = load_json("books.json")

    next_book_id = max(
        (item["id"] for item in books),
        default=0,
    ) + 1

    new_book = {
        "id": next_book_id,
        "title": submission["title"],
        "author": submission["author"],
        "subject": submission["subject"],
        "purpose": submission["purpose"],
        "difficulty": submission["difficulty"],
        "review": submission["review"],
        "reviewer": submission["reviewer"],
    }

    books.append(new_book)
    save_json("books.json", books)

    submission["status"] = "approved"
    submission["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    submission["published_id"] = next_book_id

    save_json("book_submissions.json", submissions)

    return jsonify({
        "message": "書籍レビューを承認して公開しました",
        "published": new_book,
    })





@app.post("/api/admin/submissions/prompts/<int:submission_id>/reject")
@admin_required
@csrf_required
def reject_prompt_submission(submission_id):
    submissions = load_json("prompt_submissions.json")

    submission = next(
        (
            item
            for item in submissions
            if item["id"] == submission_id
        ),
        None,
    )

    if submission is None:
        return jsonify({
            "message": "プロンプト申請が見つかりません"
        }), 404

    if submission["status"] != "pending":
        return jsonify({
            "message": "この申請はすでに処理されています"
        }), 409

    submission["status"] = "rejected"
    submission["reviewed_at"] = datetime.now(timezone.utc).isoformat()

    save_json("prompt_submissions.json", submissions)

    return jsonify({
        "message": "プロンプト申請を却下しました"
    })



@app.post("/api/admin/submissions/books/<int:submission_id>/reject")
@admin_required
@csrf_required
def reject_book_submission(submission_id):
    submissions = load_json("book_submissions.json")

    submission = next(
        (
            item
            for item in submissions
            if item["id"] == submission_id
        ),
        None,
    )

    if submission is None:
        return jsonify({
            "message": "書籍レビュー申請が見つかりません"
        }), 404

    if submission["status"] != "pending":
        return jsonify({
            "message": "この申請はすでに処理されています"
        }), 409

    submission["status"] = "rejected"
    submission["reviewed_at"] = datetime.now(timezone.utc).isoformat()

    save_json("book_submissions.json", submissions)

    return jsonify({
        "message": "書籍レビュー申請を却下しました"
    })


