import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getBook } from "../services/api";
import type { Book } from "../types";

function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBook() {
      const bookId = Number(id);

      if (!Number.isInteger(bookId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const data = await getBook(bookId);
        setBook(data);
      } catch (error) {
        if (error instanceof Error && error.message === "NOT_FOUND") {
          setNotFound(true);
        } else {
          console.error(error);
          setError("書籍レビューを取得できませんでした。");
        }
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [id]);

  if (loading) {
    return (
      <main className="main-content">
        <p className="status-message">読み込み中です...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="main-content">
        <div className="not-found">
          <p className="section-label">404</p>
          <h1>書籍が見つかりません</h1>
          <p>指定された書籍は存在しないか、削除されています。</p>
          <Link className="primary-link" to="/books">
            書籍レビュー一覧へ戻る
          </Link>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="main-content">
        <p className="status-message error-message">
          {error || "データを表示できませんでした。"}
        </p>
      </main>
    );
  }

  return (
    <main className="main-content detail-page">
      <Link className="back-link" to="/books">
        ← 書籍レビュー一覧へ戻る
      </Link>

      <article className="detail-card">
        <div className="tags">
          <span>{book.subject}</span>
          <span>{book.purpose}</span>
          <span>{book.difficulty}</span>
        </div>

        <p className="section-label detail-label">BOOK REVIEW</p>
        <h1>{book.title}</h1>
        <p className="detail-author">著者：{book.author}</p>

        <section className="detail-section">
          <h2>この本について</h2>

          <dl className="book-information">
            <div>
              <dt>対象科目</dt>
              <dd>{book.subject}</dd>
            </div>

            <div>
              <dt>利用目的</dt>
              <dd>{book.purpose}</dd>
            </div>

            <div>
              <dt>難易度</dt>
              <dd>{book.difficulty}</dd>
            </div>
          </dl>
        </section>

        <section className="detail-section">
          <h2>レビュー</h2>
          <div className="review-full-text">
            <p>{book.review}</p>
          </div>
          <p className="detail-reviewer">投稿者：{book.reviewer}</p>
        </section>
      </article>
    </main>
  );
}

export default BookDetailPage;