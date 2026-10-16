import { useEffect, useMemo, useState } from "react";

import { getPrompts } from "../services/api";
import type { Prompt } from "../types";

import { Link } from "react-router-dom";

function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    async function loadPrompts() {
      try {
        const data = await getPrompts();
        setPrompts(data);
      } catch (error) {
        console.error(error);
        setError("プロンプトを取得できませんでした。");
      } finally {
        setLoading(false);
      }
    }

    loadPrompts();
  }, []);

  const subjects = useMemo(
    () => [...new Set(prompts.map((item) => item.subject))],
    [prompts],
  );

  const categories = useMemo(
    () => [...new Set(prompts.map((item) => item.category))],
    [prompts],
  );

  const difficulties = useMemo(
    () => [...new Set(prompts.map((item) => item.difficulty))],
    [prompts],
  );

  const filteredPrompts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return prompts.filter((item) => {
      const searchableText = [
        item.title,
        item.subject,
        item.category,
        item.difficulty,
        item.description,
        item.prompt,
      ]
        .join(" ")
        .toLowerCase();

      const matchesKeyword =
        normalizedKeyword === "" ||
        searchableText.includes(normalizedKeyword);

      const matchesSubject =
        subject === "" || item.subject === subject;

      const matchesCategory =
        category === "" || item.category === category;

      const matchesDifficulty =
        difficulty === "" || item.difficulty === difficulty;

      return (
        matchesKeyword &&
        matchesSubject &&
        matchesCategory &&
        matchesDifficulty
      );
    });
  }, [prompts, keyword, subject, category, difficulty]);

  function resetFilters() {
    setKeyword("");
    setSubject("");
    setCategory("");
    setDifficulty("");
  }

  const hasActiveFilters =
    keyword !== "" ||
    subject !== "" ||
    category !== "" ||
    difficulty !== "";

  return (
    <main className="main-content">
      <div className="page-heading">
        <p className="section-label">PROMPTS</p>
        <h1>学習プロンプト</h1>
        <p>授業理解、復習、大学院入試などに利用できるプロンプトです。</p>
      </div>

      {loading && <p className="status-message">読み込み中です...</p>}

      {error && <p className="status-message error-message">{error}</p>}

      {!loading && !error && (
        <>
          <section className="filter-panel" aria-label="プロンプトの検索条件">
            <div className="keyword-field">
              <label htmlFor="prompt-keyword">キーワード検索</label>

              <input
                id="prompt-keyword"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="タイトル、説明、プロンプトから検索"
              />
            </div>

            <div className="filter-select-grid">
              <div className="filter-field">
                <label htmlFor="prompt-subject">科目</label>

                <select
                  id="prompt-subject"
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
                <label htmlFor="prompt-category">学習目的</label>

                <select
                  id="prompt-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">すべての目的</option>

                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="prompt-difficulty">難易度</label>

                <select
                  id="prompt-difficulty"
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
                全{prompts.length}件中、{filteredPrompts.length}件を表示
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

          {filteredPrompts.length > 0 ? (
            <div className="card-grid">
              {filteredPrompts.map((promptItem) => (
                <article className="card" key={promptItem.id}>
                  <div className="tags">
                    <span>{promptItem.subject}</span>
                    <span>{promptItem.category}</span>
                    <span>{promptItem.difficulty}</span>
                  </div>

                  <h2>{promptItem.title}</h2>
                  <p>{promptItem.description}</p>

                  <div className="prompt-preview">
                    <strong>プロンプト例</strong>
                    <p>{promptItem.prompt}</p>
                  </div>
                  <Link
                    className="card-link"
                    to={`/prompts/${promptItem.id}`}
                  >
                    詳細を見る →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-result">
              <h2>該当するプロンプトがありません</h2>
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

export default PromptsPage;