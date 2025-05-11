export function App() {
  const API_URL = "http://127.0.0.1:9999/extensions/";


  return (
    <div className="h-dvh bg-stone-800 text-center">
      IFRAME DOWN
      <div className="size-96 bg-red-500">
        <iframe title="plugin" src={`${API_URL}/index.html`} />
      </div>
    </div>
  );
}
