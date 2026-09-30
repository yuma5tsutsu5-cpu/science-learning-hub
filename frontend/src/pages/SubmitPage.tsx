import TestForm from "../components/TestForm";

function SubmitPage() {
  return (
    <main className="main-content">
      <div className="page-heading">
        <p className="section-label">SUBMIT</p>
        <h1>投稿通信テスト</h1>
        <p>ReactからFlaskへJSON形式でデータを送信します。</p>
      </div>

      <TestForm />
    </main>
  );
}

export default SubmitPage;