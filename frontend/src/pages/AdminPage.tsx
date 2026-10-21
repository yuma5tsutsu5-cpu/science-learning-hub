import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../components/AuthContext";

import {
  deletePublishedItem,
  getPendingSubmissions,
  getPublishedItems,
  reviewSubmission,
  type ReviewAction,
  type SubmissionKind,
} from "../services/api";

import type {
  BookSubmission,
  PendingSubmissions,
  PublishedItems,
  PromptSubmission,
} from "../types";

const emptySubmissions: PendingSubmissions = {
  prompts: [],
  books: [],
};

const emptyPublishedItems: PublishedItems = {
  prompts: [],
  books: [],
};

function AdminPage() {
  const { csrfToken, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] =
    useState<PendingSubmissions>(emptySubmissions);
  const [publishedItems, setPublishedItems] =
    useState<PublishedItems>(emptyPublishedItems);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingKey, setProcessingKey] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const [pendingData, publishedData] = await Promise.all([
          getPendingSubmissions(),
          getPublishedItems(),
        ]);
        setSubmissions(pendingData);
        setPublishedItems(publishedData);
      } catch (error) {
        console.error(error);
        setError("申請一覧を取得できませんでした。");
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, []);

  function formatDate(value: string) {
    return new Date(value).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleReview(
    kind: SubmissionKind,
    id: number,
    action: ReviewAction,
  ) {
    const actionLabel = action === "approve" ? "承認" : "却下";

    const confirmed = window.confirm(
      `この申請を${actionLabel}しますか？`,
    );

    if (!confirmed) {
      return;
    }

    const key = `${kind}-${id}`;

    setProcessingKey(key);
    setError("");
    setMessage("");

    try {
      const response = await reviewSubmission(kind, id, action, csrfToken);

      setMessage(response.message);

      if (action === "approve") {
        setPublishedItems(await getPublishedItems());
      }

      setSubmissions((currentSubmissions) => {
        if (kind === "prompts") {
          return {
            ...currentSubmissions,
            prompts: currentSubmissions.prompts.filter(
              (item) => item.id !== id,
            ),
          };
        }

        return {
          ...currentSubmissions,
          books: currentSubmissions.books.filter(
            (item) => item.id !== id,
          ),
        };
      });
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("申請の処理中にエラーが発生しました。");
      }
    } finally {
      setProcessingKey("");
    }
  }

  async function handleDelete(
    kind: SubmissionKind,
    id: number,
    title: string,
  ) {
    const confirmed = window.confirm(
      `「${title}」を完全に削除しますか？\nこの操作は取り消せません。`,
    );
    if (!confirmed) return;

    const key = `delete-${kind}-${id}`;
    setProcessingKey(key);
    setError("");
    setMessage("");

    try {
      const response = await deletePublishedItem(kind, id, csrfToken);
      setMessage(response.message);
      setPublishedItems((current) =>
        kind === "prompts"
          ? { ...current, prompts: current.prompts.filter((item) => item.id !== id) }
          : { ...current, books: current.books.filter((item) => item.id !== id) },
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "削除中にエラーが発生しました。");
    } finally {
      setProcessingKey("");
    }
  }

  const totalCount =
    submissions.prompts.length + submissions.books.length;

  async function handleLogout() {
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ログアウトできませんでした。");
    }
  }

  if (loading) {
    return (
      <main className="main-content">
        <p className="status-message">申請一覧を読み込んでいます...</p>
      </main>
    );
  }

  return (
    <main className="main-content">
      <div className="page-heading">
        <p className="section-label">ADMINISTRATION</p>
        <h1>投稿申請の管理</h1>
        <p>
          投稿されたプロンプトと書籍レビューを確認し、
          公開または却下します。
        </p>
      </div>

      <div className="admin-warning">
        <strong>認証済みの管理画面です</strong>
        <p>
          承認すると投稿が公開データへ移動します。内容を確認してから操作してください。
        </p>
        <button className="logout-button" type="button" onClick={handleLogout}>ログアウト</button>
      </div>

      {error && (
        <p className="form-message form-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="form-message form-success" role="status">
          {message}
        </p>
      )}

      <div className="admin-summary">
        <article>
          <strong>{totalCount}</strong>
          <span>確認待ちの合計</span>
        </article>

        <article>
          <strong>{submissions.prompts.length}</strong>
          <span>プロンプト</span>
        </article>

        <article>
          <strong>{submissions.books.length}</strong>
          <span>書籍レビュー</span>
        </article>
      </div>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="section-label">PROMPTS</p>
            <h2>プロンプト申請</h2>
          </div>

          <span>{submissions.prompts.length}件</span>
        </div>

        {submissions.prompts.length === 0 ? (
          <div className="empty-result">
            <h3>確認待ちのプロンプトはありません</h3>
          </div>
        ) : (
          <div className="admin-list">
            {submissions.prompts.map(
              (submission: PromptSubmission) => {
                const key = `prompts-${submission.id}`;
                const processing = processingKey === key;

                return (
                  <article
                    className="admin-submission-card"
                    key={submission.id}
                  >
                    <div className="admin-card-header">
                      <div className="tags">
                        <span>{submission.subject}</span>
                        <span>{submission.category}</span>
                        <span>{submission.difficulty}</span>
                      </div>

                      <span className="pending-badge">確認待ち</span>
                    </div>

                    <h3>{submission.title}</h3>
                    <p>{submission.description}</p>

                    <dl className="submission-metadata">
                      <div>
                        <dt>投稿者</dt>
                        <dd>{submission.reviewer}</dd>
                      </div>

                      <div>
                        <dt>申請日時</dt>
                        <dd>{formatDate(submission.submitted_at)}</dd>
                      </div>
                    </dl>

                    <div className="admin-content-preview">
                      <strong>プロンプト本文</strong>
                      <p>{submission.prompt}</p>
                    </div>

                    <div className="admin-actions">
                      <button
                        className="approve-button"
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          handleReview(
                            "prompts",
                            submission.id,
                            "approve",
                          )
                        }
                      >
                        {processing ? "処理中..." : "承認して公開"}
                      </button>

                      <button
                        className="reject-button"
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          handleReview(
                            "prompts",
                            submission.id,
                            "reject",
                          )
                        }
                      >
                        却下
                      </button>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="section-label">BOOK REVIEWS</p>
            <h2>書籍レビュー申請</h2>
          </div>

          <span>{submissions.books.length}件</span>
        </div>

        {submissions.books.length === 0 ? (
          <div className="empty-result">
            <h3>確認待ちの書籍レビューはありません</h3>
          </div>
        ) : (
          <div className="admin-list">
            {submissions.books.map(
              (submission: BookSubmission) => {
                const key = `books-${submission.id}`;
                const processing = processingKey === key;

                return (
                  <article
                    className="admin-submission-card"
                    key={submission.id}
                  >
                    <div className="admin-card-header">
                      <div className="tags">
                        <span>{submission.subject}</span>
                        <span>{submission.purpose}</span>
                        <span>{submission.difficulty}</span>
                      </div>

                      <span className="pending-badge">確認待ち</span>
                    </div>

                    <h3>{submission.title}</h3>
                    <p className="book-author">
                      著者：{submission.author}
                    </p>

                    <dl className="submission-metadata">
                      <div>
                        <dt>投稿者</dt>
                        <dd>{submission.reviewer}</dd>
                      </div>

                      <div>
                        <dt>申請日時</dt>
                        <dd>{formatDate(submission.submitted_at)}</dd>
                      </div>
                    </dl>

                    <div className="admin-content-preview">
                      <strong>レビュー</strong>
                      <p>{submission.review}</p>
                    </div>

                    {submission.cosense_url && (
                      <p>
                        <a href={submission.cosense_url} target="_blank" rel="noopener noreferrer">
                          Cosenseのノートを確認する ↗
                        </a>
                      </p>
                    )}

                    <div className="admin-actions">
                      <button
                        className="approve-button"
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          handleReview(
                            "books",
                            submission.id,
                            "approve",
                          )
                        }
                      >
                        {processing ? "処理中..." : "承認して公開"}
                      </button>

                      <button
                        className="reject-button"
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          handleReview(
                            "books",
                            submission.id,
                            "reject",
                          )
                        }
                      >
                        却下
                      </button>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="section-label">PUBLISHED CONTENT</p>
            <h2>公開済みデータの削除</h2>
          </div>
          <span>{publishedItems.prompts.length + publishedItems.books.length}件</span>
        </div>

        <p className="admin-delete-notice">
          削除したデータは元に戻せません。対象をよく確認してから操作してください。
        </p>

        <h3>公開済みプロンプト</h3>
        <div className="admin-list compact-admin-list">
          {publishedItems.prompts.length === 0 ? (
            <p>公開済みプロンプトはありません。</p>
          ) : publishedItems.prompts.map((item) => {
            const key = `delete-prompts-${item.id}`;
            return (
              <article className="admin-published-row" key={item.id}>
                <div><strong>{item.title}</strong><span>{item.subject}・{item.difficulty}</span></div>
                <button className="delete-button" type="button" disabled={processingKey === key}
                  onClick={() => handleDelete("prompts", item.id, item.title)}>
                  {processingKey === key ? "削除中..." : "削除"}
                </button>
              </article>
            );
          })}
        </div>

        <h3 className="published-subheading">公開済み書籍レビュー</h3>
        <div className="admin-list compact-admin-list">
          {publishedItems.books.length === 0 ? (
            <p>公開済み書籍レビューはありません。</p>
          ) : publishedItems.books.map((item) => {
            const key = `delete-books-${item.id}`;
            return (
              <article className="admin-published-row" key={item.id}>
                <div><strong>{item.title}</strong><span>{item.author}・{item.subject}</span></div>
                <button className="delete-button" type="button" disabled={processingKey === key}
                  onClick={() => handleDelete("books", item.id, item.title)}>
                  {processingKey === key ? "削除中..." : "削除"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default AdminPage;
