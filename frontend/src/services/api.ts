import type { Book, Prompt } from "../types";

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