import json

from datetime import datetime, timezone
from pathlib import Path

from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)

# JSON内の日本語を\u形式に変換しない
app.json.ensure_ascii = False

CORS(app, origins=["http://localhost:5173"])

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


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


