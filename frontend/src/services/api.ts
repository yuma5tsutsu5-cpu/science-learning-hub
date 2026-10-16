import type {
  Book,
  PendingSubmissions,
  Prompt,
} from "../types";

const API_BASE_URL = "http://localhost:5000/api";

export async function getPrompts(): Promise<Prompt[]> {
  const response = await fetch(`${API_BASE_URL}/prompts`);

  if (!response.ok) {
    throw new Error("プロンプトを取得できませんでした");
  }

  return response.json();
}

export async function getPrompt(id: number): Promise<Prompt> {
  const response = await fetch(`${API_BASE_URL}/prompts/${id}`);

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("プロンプトを取得できませんでした");
  }

  return response.json();
}

export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`);

  if (!response.ok) {
    throw new Error("書籍レビューを取得できませんでした");
  }

  return response.json();
}

export async function getBook(id: number): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/books/${id}`);

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("書籍レビューを取得できませんでした");
  }

  return response.json();
}


export type PromptSubmissionData = {
  title: string;
  subject: string;
  category: string;
  difficulty: string;
  description: string;
  prompt: string;
  reviewer: string;
};

export type PromptSubmissionResponse = {
  message: string;
  submission: PromptSubmissionData & {
    id: number;
    status: string;
    submitted_at: string;
  };
};

export async function submitPrompt(
  data: PromptSubmissionData,
): Promise<PromptSubmissionResponse> {
  const response = await fetch(`${API_BASE_URL}/submissions/prompts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData.message || "プロンプトを申請できませんでした",
    );
  }

  return responseData;
}



export type BookSubmissionData = {
  title: string;
  author: string;
  subject: string;
  purpose: string;
  difficulty: string;
  review: string;
  reviewer: string;
};

export type BookSubmissionResponse = {
  message: string;
  submission: BookSubmissionData & {
    id: number;
    status: string;
    submitted_at: string;
  };
};

export async function submitBook(
  data: BookSubmissionData,
): Promise<BookSubmissionResponse> {
  const response = await fetch(`${API_BASE_URL}/submissions/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData.message || "書籍レビューを申請できませんでした",
    );
  }

  return responseData;
}



export type SubmissionKind = "prompts" | "books";
export type ReviewAction = "approve" | "reject";

export async function getPendingSubmissions(): Promise<PendingSubmissions> {
  const response = await fetch(`${API_BASE_URL}/admin/submissions`);

  if (!response.ok) {
    throw new Error("申請一覧を取得できませんでした");
  }

  return response.json();
}

export async function reviewSubmission(
  kind: SubmissionKind,
  id: number,
  action: ReviewAction,
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/submissions/${kind}/${id}/${action}`,
    {
      method: "POST",
    },
  );

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData.message || "申請を処理できませんでした",
    );
  }

  return responseData;
}