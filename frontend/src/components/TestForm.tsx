import { FormEvent, useState } from "react";

type ApiResponse = {
  message: string;
  received: {
    title: string;
    subject: string;
  };
};

function TestForm() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("物理学");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // フォーム送信時のページ再読み込みを防ぐ
    event.preventDefault();

    setSending(true);
    setError("");
    setResult(null);

    const sendData = {
      title: title,
      subject: subject,
    };

    try {
      const response = await fetch("http://localhost:5000/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });

      if (!response.ok) {
        throw new Error("送信に失敗しました");
      }

      const responseData: ApiResponse = await response.json();
      setResult(responseData);
      setTitle("");
    } catch (error) {
      console.error(error);
      setError(
        "Flaskへ送信できませんでした。バックエンドが起動しているか確認してください。",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="section-label">POST TEST</p>
          <h2>JSON送信テスト</h2>
        </div>
      </div>

      <div className="form-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="title">プロンプトのタイトル</label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例：電磁気学の問題を整理する"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="subject">科目</label>

            <select
              id="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              <option value="物理学">物理学</option>
              <option value="化学">化学</option>
              <option value="生物学">生物学</option>
              <option value="数学">数学</option>
            </select>
          </div>

          <button className="submit-button" type="submit" disabled={sending}>
            {sending ? "送信中..." : "Flaskへ送信"}
          </button>
        </form>

        {error && <p className="form-error">{error}</p>}

        {result && (
          <div className="response-panel">
            <strong>{result.message}</strong>

            <dl>
              <div>
                <dt>タイトル</dt>
                <dd>{result.received.title}</dd>
              </div>

              <div>
                <dt>科目</dt>
                <dd>{result.received.subject}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}

export default TestForm;