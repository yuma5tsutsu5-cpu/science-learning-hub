import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getPrompt } from "../services/api";
import type { Prompt } from "../types";

function PromptDetailPage() {
  const { id } = useParams();
  const [promptItem, setPromptItem] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPrompt() {
      const promptId = Number(id);

      if (!Number.isInteger(promptId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const data = await getPrompt(promptId);
        setPromptItem(data);
      } catch (error) {
        if (error instanceof Error && error.message === "NOT_FOUND") {
          setNotFound(true);
        } else {
          console.error(error);
          setError("プロンプトを取得できませんでした。");
        }
      } finally {
        setLoading(false);
      }
    }

    loadPrompt();
  }, [id]);

  async function copyPrompt() {
    if (!promptItem) {
      return;
    }

    try {
      await navigator.clipboard.writeText(promptItem.prompt);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      setError("プロンプトをコピーできませんでした。");
    }
  }

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
          <h1>プロンプトが見つかりません</h1>
          <p>指定されたプロンプトは存在しないか、削除されています。</p>
          <Link className="primary-link" to="/prompts">
            プロンプト一覧へ戻る
          </Link>
        </div>
      </main>
    );
  }

  if (error || !promptItem) {
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
      <Link className="back-link" to="/prompts">
        ← プロンプト一覧へ戻る
      </Link>

      <article className="detail-card">
        <div className="tags">
          <span>{promptItem.subject}</span>
          <span>{promptItem.category}</span>
          <span>{promptItem.difficulty}</span>
        </div>

        <p className="section-label detail-label">LEARNING PROMPT</p>
        <h1>{promptItem.title}</h1>
        <p className="detail-description">{promptItem.description}</p>

        <section className="detail-section">
          <div className="detail-section-heading">
            <h2>プロンプト本文</h2>

            <button
              className="copy-button"
              type="button"
              onClick={copyPrompt}
            >
              {copied ? "コピーしました" : "コピーする"}
            </button>
          </div>

          <div className="prompt-full-text">
            <p>{promptItem.prompt}</p>
          </div>
        </section>
      </article>
    </main>
  );
}

export default PromptDetailPage;