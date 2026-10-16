import { useState } from "react";

import BookSubmissionForm from "../components/BookSubmissionForm";
import PromptSubmissionForm from "../components/PromptSubmissionForm";

type SubmissionType = "prompt" | "book";

function SubmitPage() {
  const [submissionType, setSubmissionType] =
    useState<SubmissionType>("prompt");

  return (
    <main className="main-content">
      <div className="page-heading">
        <p className="section-label">SUBMISSION</p>
        <h1>学習情報を投稿する</h1>
        <p>
          学習に役立ったプロンプトや書籍レビューを投稿できます。
          送信内容は確認後にサイトへ掲載されます。
        </p>
      </div>

      <div className="submission-type-selector">
        <button
          className={
            submissionType === "prompt"
              ? "submission-type-button active"
              : "submission-type-button"
          }
          type="button"
          onClick={() => setSubmissionType("prompt")}
        >
          <span className="submission-type-title">
            学習プロンプト
          </span>
          <span className="submission-type-description">
            ChatGPTで使用するプロンプトを投稿
          </span>
        </button>

        <button
          className={
            submissionType === "book"
              ? "submission-type-button active"
              : "submission-type-button"
          }
          type="button"
          onClick={() => setSubmissionType("book")}
        >
          <span className="submission-type-title">
            書籍レビュー
          </span>
          <span className="submission-type-description">
            学習に役立つ書籍を紹介
          </span>
        </button>
      </div>

      <div className="selected-form-heading">
        <p className="section-label">
          {submissionType === "prompt"
            ? "PROMPT SUBMISSION"
            : "BOOK REVIEW SUBMISSION"}
        </p>

        <h2>
          {submissionType === "prompt"
            ? "プロンプト投稿申請"
            : "書籍レビュー投稿申請"}
        </h2>
      </div>

      {submissionType === "prompt" ? (
        <PromptSubmissionForm />
      ) : (
        <BookSubmissionForm />
      )}
    </main>
  );
}

export default SubmitPage;