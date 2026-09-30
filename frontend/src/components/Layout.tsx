import { NavLink, Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="app">
      <header className="navigation-header">
        <div className="navigation-content">
          <NavLink className="site-logo" to="/">
            Science Learning Hub
          </NavLink>

          <nav className="navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "navigation-link active" : "navigation-link"
              }
            >
              ホーム
            </NavLink>

            <NavLink
              to="/prompts"
              className={({ isActive }) =>
                isActive ? "navigation-link active" : "navigation-link"
              }
            >
              プロンプト
            </NavLink>

            <NavLink
              to="/books"
              className={({ isActive }) =>
                isActive ? "navigation-link active" : "navigation-link"
              }
            >
              書籍レビュー
            </NavLink>

            <NavLink
              to="/submit"
              className={({ isActive }) =>
                isActive ? "navigation-link active" : "navigation-link"
              }
            >
              投稿テスト
            </NavLink>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <p>Science Learning Hub</p>
        <p>理学部の学習を支援する試作サイトです。</p>
      </footer>
    </div>
  );
}

export default Layout;