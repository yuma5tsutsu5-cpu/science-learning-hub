import json
import os
from datetime import datetime
from pathlib import Path

import psycopg


DATA_DIR = Path(__file__).resolve().parent / "data"


def load(name):
    with (DATA_DIR / name).open(encoding="utf-8") as file:
        return json.load(file)


def timestamp(value):
    return datetime.fromisoformat(value) if value else None


def main():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URLが設定されていません。")

    prompts = load("prompts.json")
    books = load("books.json")
    prompt_submissions = load("prompt_submissions.json")
    book_submissions = load("book_submissions.json")

    with psycopg.connect(
        database_url, prepare_threshold=None, sslmode="require"
    ) as connection:
        for item in prompts:
            connection.execute(
                """insert into prompts
                   (id, title, subject, category, difficulty, description, prompt, reviewer)
                   values (%s, %s, %s, %s, %s, %s, %s, %s)
                   on conflict (id) do nothing""",
                (item["id"], item["title"], item["subject"], item["category"],
                 item["difficulty"], item["description"], item["prompt"], item.get("reviewer")),
            )

        for item in books:
            connection.execute(
                """insert into books
                   (id, title, author, subject, purpose, difficulty, review, reviewer, cosense_url)
                   values (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                   on conflict (id) do nothing""",
                (item["id"], item["title"], item["author"], item["subject"],
                 item["purpose"], item["difficulty"], item["review"], item["reviewer"],
                 item.get("cosense_url")),
            )

        for item in prompt_submissions:
            connection.execute(
                """insert into prompt_submissions
                   (id, title, subject, category, difficulty, description, prompt, reviewer,
                    status, submitted_at, reviewed_at, published_id)
                   values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   on conflict (id) do nothing""",
                (item["id"], item["title"], item["subject"], item["category"],
                 item["difficulty"], item["description"], item["prompt"], item["reviewer"],
                 item.get("status", "pending"), timestamp(item.get("submitted_at")),
                 timestamp(item.get("reviewed_at")), item.get("published_id")),
            )

        for item in book_submissions:
            connection.execute(
                """insert into book_submissions
                   (id, title, author, subject, purpose, difficulty, review, reviewer,
                    cosense_url, status, submitted_at, reviewed_at, published_id)
                   values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   on conflict (id) do nothing""",
                (item["id"], item["title"], item["author"], item["subject"],
                 item["purpose"], item["difficulty"], item["review"], item["reviewer"],
                 item.get("cosense_url"),
                 item.get("status", "pending"), timestamp(item.get("submitted_at")),
                 timestamp(item.get("reviewed_at")), item.get("published_id")),
            )

        for table in ("prompts", "books", "prompt_submissions", "book_submissions"):
            connection.execute(
                f"""select setval(
                    pg_get_serial_sequence('{table}', 'id'),
                    coalesce((select max(id) from {table}), 1),
                    exists(select 1 from {table})
                )"""
            )

    print("JSONデータをSupabaseへ移行しました。")
    print(f"prompts: {len(prompts)}, books: {len(books)}")
    print(f"prompt_submissions: {len(prompt_submissions)}, book_submissions: {len(book_submissions)}")


if __name__ == "__main__":
    main()
