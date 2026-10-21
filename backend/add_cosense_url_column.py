import os

import psycopg


def main():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URLが設定されていません。")

    with psycopg.connect(
        database_url, prepare_threshold=None, sslmode="require"
    ) as connection:
        connection.execute(
            "alter table books add column if not exists cosense_url text"
        )
        connection.execute(
            "alter table book_submissions add column if not exists cosense_url text"
        )

    print("books と book_submissions に cosense_url 列を用意しました。")


if __name__ == "__main__":
    main()
