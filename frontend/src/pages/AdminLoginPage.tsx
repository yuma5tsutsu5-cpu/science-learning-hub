import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

function AdminLoginPage() {
  const { authenticated, login } = useAuth();
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (authenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(password, otp);
      const destination = (location.state as { from?: string } | null)?.from ?? "/admin";
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ログインできませんでした");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="main-content auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="section-label">ADMINISTRATION</p>
        <h1>管理者ログイン</h1>
        <p>パスワードと認証アプリに表示される8桁のコードを入力してください。</p>
        <label htmlFor="admin-password">パスワード</label>
        <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        <label htmlFor="admin-otp">8桁の認証コード</label>
        <input id="admin-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} />
        {error && <p className="form-message form-error" role="alert">{error}</p>}
        <button className="approve-button auth-submit" type="submit" disabled={submitting}>{submitting ? "確認中..." : "ログイン"}</button>
      </form>
    </main>
  );
}

export default AdminLoginPage;
