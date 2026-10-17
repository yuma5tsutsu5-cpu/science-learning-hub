import { useState, type FormEvent } from "react";

import {
  submitPrompt,
  type PromptSubmissionData,
} from "../services/api";

const initialFormData: PromptSubmissionData = {
  title: "",
  subject: "物理学",
  category: "授業理解",
  difficulty: "基礎",
  description: "",
  prompt: "",
  reviewer: "",
};

function PromptSubmissionForm() {
  const [formData, setFormData] =
    useState<PromptSubmissionData>(initialFormData);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function updateField(
    field: keyof PromptSubmissionData,
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
      const response = await submitPrompt(formData);

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
        <label htmlFor="submission-title">
          タイトル
          <span className="required-label">必須</span>
        </label>

        <input
          id="submission-title"
          type="text"
          value={formData.title}
          onChange={(event) =>
            updateField("title", event.target.value)
          }
          placeholder="例：力学の問題を段階的に理解する"
          maxLength={100}
          required
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="submission-subject">科目</label>

          <select
            id="submission-subject"
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
          <label htmlFor="submission-category">学習目的</label>

          <select
            id="submission-category"
            value={formData.category}
            onChange={(event) =>
              updateField("category", event.target.value)
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
          <label htmlFor="submission-difficulty">難易度</label>

          <select
            id="submission-difficulty"
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
        <label htmlFor="submission-description">
          概要
          <span className="required-label">必須</span>
        </label>

        <textarea
          id="submission-description"
          value={formData.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
          placeholder="このプロンプトの目的や、どのような場面で使用するのかを入力してください。"
          rows={4}
          maxLength={500}
          required
        />

        <p className="character-count">
          {formData.description.length}/500文字
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="submission-prompt">
          プロンプト本文
          <span className="required-label">必須</span>
        </label>

        <textarea
          id="submission-prompt"
          value={formData.prompt}
          onChange={(event) =>
            updateField("prompt", event.target.value)
          }
          placeholder="ChatGPTへ入力するプロンプトを記載してください。"
          rows={9}
          maxLength={3000}
          required
        />

        <p className="character-count">
          {formData.prompt.length}/3000文字
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="submission-reviewer">
          投稿者のイニシャル
          <span className="required-label">必須</span>
        </label>

        <input
          id="submission-reviewer"
          type="text"
          value={formData.reviewer}
          onChange={(event) =>
            updateField("reviewer", event.target.value)
          }
          placeholder="例：K.T."
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
          送信された内容はすぐには公開されません。
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
        {sending ? "送信しています..." : "投稿を申請する"}
      </button>
    </form>
  );
}

export default PromptSubmissionForm;