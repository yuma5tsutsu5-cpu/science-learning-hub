import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import BookDetailPage from "./pages/BookDetailPage";
import BooksPage from "./pages/BooksPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import PromptDetailPage from "./pages/PromptDetailPage";
import PromptsPage from "./pages/PromptsPage";
import SubmitPage from "./pages/SubmitPage";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />

        <Route path="prompts" element={<PromptsPage />} />
        <Route path="prompts/:id" element={<PromptDetailPage />} />

        <Route path="books" element={<BooksPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />

        <Route path="submit" element={<SubmitPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;