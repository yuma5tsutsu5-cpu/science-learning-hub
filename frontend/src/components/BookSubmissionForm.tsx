import { useState, type FormEvent } from "react";

import {
  submitBook,
  type BookSubmissionData,
} from "../services/api";

const initialFormData: BookSubmissionData = {
  title: "",
  author: "",
  subject: "物理学",
  purpose: "授業理解",
  difficulty: "基礎",
  review: "",
  reviewer: "",
  cosense_url: "",
};

function BookSubmissionForm() {
  const [formData, setFormData] =
    useState<BookSubmissionData>(initialFormData);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function updateField(
    field: keyof BookSubmissionData,
    value: string,
  ) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSending(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await submitBook(formData);

      setSuccessMessage(response.message);
      setFormData(initialFormData);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("投稿申請中にエラーが発生しました");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="book-title">
          書名
          <span className="required-label">必須</span>
        </label>

        <input
          id="book-title"
          type="text"
          value={formData.title}
          onChange={(event) =>
            updateField("title", event.target.value)
          }
          placeholder="例：物理学の基礎"
          maxLength={150}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="book-author">
          著者
          <span className="required-label">必須</span>
        </label>

        <input
          id="book-author"
          type="text"
          value={formData.author}
          onChange={(event) =>
            updateField("author", event.target.value)
          }
          placeholder="例：山田 太郎"
          maxLength={100}
          required
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="book-submission-subject">科目</label>

          <select
            id="book-submission-subject"
            value={formData.subject}
            onChange={(event) =>
              updateField("subject", event.target.value)
            }
          >
            <option value="物理学">物理学</option>
            <option value="化学">化学</option>
            <option value="生物学">生物学</option>
            <option value="数学">数学</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="book-submission-purpose">利用目的</label>

          <select
            id="book-submission-purpose"
            value={formData.purpose}
            onChange={(event) =>
              updateField("purpose", event.target.value)
            }
          >
            <option value="授業理解">授業理解</option>
            <option value="復習">復習</option>
            <option value="試験対策">試験対策</option>
            <option value="大学院入試">大学院入試</option>
            <option value="資格試験">資格試験</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="book-submission-difficulty">難易度</label>

          <select
            id="book-submission-difficulty"
            value={formData.difficulty}
            onChange={(event) =>
              updateField("difficulty", event.target.value)
            }
          >
            <option value="基礎">基礎</option>
            <option value="標準">標準</option>
            <option value="発展">発展</option>
          </select>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="book-review">
          レビュー
          <span className="required-label">必須</span>
        </label>

        <textarea
          id="book-review"
          value={formData.review}
          onChange={(event) =>
            updateField("review", event.target.value)
          }
          placeholder="本の特徴、良かった点、どのような学生におすすめかを入力してください。"
          rows={9}
          maxLength={2000}
          required
        />

        <p className="character-count">
          {formData.review.length}/2000文字
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="book-cosense-url">CosenseノートのURL（任意）</label>

        <input
          id="book-cosense-url"
          type="url"
          value={formData.cosense_url}
          onChange={(event) => updateField("cosense_url", event.target.value)}
          placeholder="https://scrapbox.io/プロジェクト名/ページ名"
          maxLength={500}
          pattern="https://(www\.)?scrapbox\.io/.+"
        />

        <p className="field-note">
          本についての公開ノートがある場合だけ入力してください。
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="book-reviewer">
          投稿者のイニシャル
          <span className="required-label">必須</span>
        </label>

        <input
          id="book-reviewer"
          type="text"
          value={formData.reviewer}
          onChange={(event) =>
            updateField("reviewer", event.target.value)
          }
          placeholder="例：M.S."
          maxLength={20}
          required
        />

        <p className="field-note">
          公開時には氏名ではなく、このイニシャルを表示します。
        </p>
      </div>

      <div className="submission-notice">
        <strong>投稿について</strong>
        <p>
          送信された書籍レビューはすぐには公開されません。
          管理者が内容を確認した後、公開データへ追加します。
        </p>
      </div>

      {error && (
        <p className="form-message form-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="form-message form-success" role="status">
          {successMessage}
        </p>
      )}

      <button
        className="submit-button"
        type="submit"
        disabled={sending}
      >
        {sending ? "送信しています..." : "書籍レビューを申請する"}
      </button>
    </form>
  );
}

export default BookSubmissionForm;
