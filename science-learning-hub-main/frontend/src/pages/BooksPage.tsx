import { useEffect, useMemo, useState } from "react";

import { getBooks } from "../services/api";
import type { Book } from "../types";

import { Link } from "react-router-dom";

function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await getBooks();
        setBooks(data);
      } catch (error) {
        console.error(error);
        setError("書籍レビューを取得できませんでした。");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  const subjects = useMemo(
    () => [...new Set(books.map((item) => item.subject))],
    [books],
  );

  const purposes = useMemo(
    () => [...new Set(books.map((item) => item.purpose))],
    [books],
  );

  const difficulties = useMemo(
    () => [...new Set(books.map((item) => item.difficulty))],
    [books],
  );

  const filteredBooks = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return books.filter((item) => {
      const searchableText = [
        item.title,
        item.author,
        item.subject,
        item.difficulty,
        item.purpose,
        item.reviewer,
        item.review,
      ]
        .join(" ")
        .toLowerCase();

      const matchesKeyword =
        normalizedKeyword === "" ||
        searchableText.includes(normalizedKeyword);

      const matchesSubject =
        subject === "" || item.subject === subject;

      const matchesPurpose =
        purpose === "" || item.purpose === purpose;

      const matchesDifficulty =
        difficulty === "" || item.difficulty === difficulty;

      return (
        matchesKeyword &&
        matchesSubject &&
        matchesPurpose &&
        matchesDifficulty
      );
    });
  }, [books, keyword, subject, purpose, difficulty]);

  function resetFilters() {
    setKeyword("");
    setSubject("");
    setPurpose("");
    setDifficulty("");
  }

  const hasActiveFilters =
    keyword !== "" ||
    subject !== "" ||
    purpose !== "" ||
    difficulty !== "";

  return (
    <main className="main-content">
      <div className="page-heading">
        <p className="section-label">BOOK REVIEWS</p>
        <h1>書籍レビュー</h1>
        <p>先輩や先生が推薦する理学部の学習に役立つ書籍です。</p>
      </div>

      {loading && <p className="status-message">読み込み中です...</p>}

      {error && <p className="status-message error-message">{error}</p>}

      {!loading && !error && (
        <>
          <section className="filter-panel" aria-label="書籍レビューの検索条件">
            <div className="keyword-field">
              <label htmlFor="book-keyword">キーワード検索</label>

              <input
                id="book-keyword"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="書名、著者、レビューから検索"
              />
            </div>

            <div className="filter-select-grid">
              <div className="filter-field">
                <label htmlFor="book-subject">科目</label>

                <select
                  id="book-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                >
                  <option value="">すべての科目</option>

                  {subjects.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="book-purpose">利用目的</label>

                <select
                  id="book-purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                >
                  <option value="">すべての目的</option>

                  {purposes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="book-difficulty">難易度</label>

                <select
                  id="book-difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                >
                  <option value="">すべての難易度</option>

                  {difficulties.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-footer">
              <p>
                全{books.length}件中、{filteredBooks.length}件を表示
              </p>

              <button
                className="reset-button"
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                条件をリセット
              </button>
            </div>
          </section>

          {filteredBooks.length > 0 ? (
            <div className="card-grid">
              {filteredBooks.map((book) => (
                <article className="card" key={book.id}>
                  <div className="tags">
                    <span>{book.subject}</span>
                    <span>{book.purpose}</span>
                    <span>{book.difficulty}</span>
                  </div>

                  <h2>{book.title}</h2>
                  <p className="book-author">{book.author}</p>
                  <p>{book.review}</p>
                  <p className="reviewer">レビュー：{book.reviewer}</p>
                  

                  <Link
                    className="card-link"
                    to={`/books/${book.id}`}
                  >
                    詳細を見る →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-result">
              <h2>該当する書籍がありません</h2>
              <p>検索条件を変更するか、条件をリセットしてください。</p>

              <button
                className="reset-button"
                type="button"
                onClick={resetFilters}
              >
                条件をリセット
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default BooksPage;