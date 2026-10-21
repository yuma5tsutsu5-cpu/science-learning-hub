import type { Book, PendingSubmissions, Prompt, PublishedItems } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, { ...init, credentials: "include" });
}

async function responseJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function getPrompts(): Promise<Prompt[]> {
  const response = await apiFetch("/prompts");
  if (!response.ok) throw new Error("プロンプトを取得できませんでした");
  return response.json();
}

export async function getPrompt(id: number): Promise<Prompt> {
  const response = await apiFetch(`/prompts/${id}`);
  if (response.status === 404) throw new Error("NOT_FOUND");
  if (!response.ok) throw new Error("プロンプトを取得できませんでした");
  return response.json();
}

export async function getBooks(): Promise<Book[]> {
  const response = await apiFetch("/books");
  if (!response.ok) throw new Error("書籍レビューを取得できませんでした");
  return response.json();
}

export async function getBook(id: number): Promise<Book> {
  const response = await apiFetch(`/books/${id}`);
  if (response.status === 404) throw new Error("NOT_FOUND");
  if (!response.ok) throw new Error("書籍レビューを取得できませんでした");
  return response.json();
}

export type PromptSubmissionData = { title: string; subject: string; category: string; difficulty: string; description: string; prompt: string; reviewer: string };
export type PromptSubmissionResponse = { message: string; submission: PromptSubmissionData & { id: number; status: string; submitted_at: string } };

export async function submitPrompt(data: PromptSubmissionData): Promise<PromptSubmissionResponse> {
  const response = await apiFetch("/submissions/prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const body = await responseJson(response);
  if (!response.ok) throw new Error(body.message || "プロンプトを申請できませんでした");
  return body;
}

export type BookSubmissionData = { title: string; author: string; subject: string; purpose: string; difficulty: string; review: string; reviewer: string; cosense_url: string };
export type BookSubmissionResponse = { message: string; submission: BookSubmissionData & { id: number; status: string; submitted_at: string } };

export async function submitBook(data: BookSubmissionData): Promise<BookSubmissionResponse> {
  const response = await apiFetch("/submissions/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const body = await responseJson(response);
  if (!response.ok) throw new Error(body.message || "書籍レビューを申請できませんでした");
  return body;
}

export type AuthSession = { authenticated: boolean; csrf_token: string | null };

export async function getAuthSession(): Promise<AuthSession> {
  const response = await apiFetch("/auth/session");
  if (!response.ok) throw new Error("認証状態を確認できませんでした");
  return response.json();
}

export async function loginAdmin(password: string, otp: string): Promise<AuthSession> {
  const response = await apiFetch("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, otp }) });
  const body = await responseJson(response);
  if (!response.ok) throw new Error(body.message || "ログインできませんでした");
  return { authenticated: body.authenticated, csrf_token: body.csrf_token };
}

export async function logoutAdmin(csrfToken: string): Promise<void> {
  const response = await apiFetch("/auth/logout", { method: "POST", headers: { "X-CSRF-Token": csrfToken } });
  const body = await responseJson(response);
  if (!response.ok) throw new Error(body.message || "ログアウトできませんでした");
}

export type SubmissionKind = "prompts" | "books";
export type ReviewAction = "approve" | "reject";

export async function getPendingSubmissions(): Promise<PendingSubmissions> {
  const response = await apiFetch("/admin/submissions");
  if (response.status === 401) throw new Error("AUTH_REQUIRED");
  if (!response.ok) throw new Error("申請一覧を取得できませんでした");
  return response.json();
}

export async function reviewSubmission(kind: SubmissionKind, id: number, action: ReviewAction, csrfToken: string): Promise<{ message: string }> {
  const response = await apiFetch(`/admin/submissions/${kind}/${id}/${action}`, { method: "POST", headers: { "X-CSRF-Token": csrfToken } });
  const body = await responseJson(response);
  if (!response.ok) throw new Error(body.message || "申請を処理できませんでした");
  return body;
}

export async function getPublishedItems(): Promise<PublishedItems> {
  const response = await apiFetch("/admin/published");
  if (response.status === 401) throw new Error("AUTH_REQUIRED");
  if (!response.ok) throw new Error("公開済みデータを取得できませんでした");
  return response.json();
}

export async function deletePublishedItem(kind: SubmissionKind, id: number, csrfToken: string): Promise<{ message: string }> {
  const response = await apiFetch(`/admin/published/${kind}/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken },
  });
  const body = await responseJson(response);
  if (!response.ok) throw new Error(body.message || "公開済みデータを削除できませんでした");
  return body;
}
