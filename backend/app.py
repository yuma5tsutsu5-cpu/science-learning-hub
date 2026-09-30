import json
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