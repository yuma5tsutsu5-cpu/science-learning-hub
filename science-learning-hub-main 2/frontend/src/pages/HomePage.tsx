import { Link } from "react-router-dom";

function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="site-label">SCIENCE LEARNING HUB</p>

          <h1>理学部の学びを、みんなで共有する。</h1>

          <p className="hero-description">
            授業理解、復習、大学院入試に役立つ学習プロンプトと、
            先輩・先生による書籍レビューを紹介します。
          </p>

          <div className="hero-actions">
            <Link className="primary-link" to="/prompts">
              プロンプトを見る
            </Link>

            <Link className="secondary-link" to="/books">
              書籍レビューを見る
            </Link>
          </div>
        </div>
      </section>

      <main className="main-content">
        <section className="introduction-grid">
          <article className="introduction-card">
            <p className="section-label">PROMPTS</p>
            <h2>学習プロンプト</h2>
            <p>
              ChatGPTを授業理解や復習に活用するためのプロンプトを、
              科目や目的別に紹介します。
            </p>
            <Link to="/prompts">一覧を見る →</Link>
          </article>

          <article className="introduction-card">
            <p className="section-label">BOOK REVIEWS</p>
            <h2>書籍レビュー</h2>
            <p>
              先輩や先生が推薦する書籍を、難易度や学習目的とともに紹介します。
            </p>
            <Link to="/books">一覧を見る →</Link>
          </article>
        </section>
      </main>
    </>
  );
}

export default HomePage;