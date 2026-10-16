export type Book = {
  id: number;
  title: string;
  author: string;
  subject: string;
  difficulty: string;
  purpose: string;
  reviewer: string;
  review: string;
};

export type Prompt = {
  id: number;
  title: string;
  subject: string;
  category: string;
  difficulty: string;
  description: string;
  prompt: string;
};




export type PromptSubmission = {
  id: number;
  title: string;
  subject: string;
  category: string;
  difficulty: string;
  description: string;
  prompt: string;
  reviewer: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at?: string;
  published_id?: number;
};

export type BookSubmission = {
  id: number;
  title: string;
  author: string;
  subject: string;
  purpose: string;
  difficulty: string;
  review: string;
  reviewer: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at?: string;
  published_id?: number;
};

export type PendingSubmissions = {
  prompts: PromptSubmission[];
  books: BookSubmission[];
};