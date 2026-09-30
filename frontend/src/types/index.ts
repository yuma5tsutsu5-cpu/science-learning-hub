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
