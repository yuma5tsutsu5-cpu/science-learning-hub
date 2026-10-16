import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="main-content">
      <div className="not-found">
        <p className="section-label">404</p>
        <h1>ページが見つかりません</h1>
        <p>指定されたURLのページは存在しません。</p>
        <Link className="primary-link" to="/">
          ホームへ戻る
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;