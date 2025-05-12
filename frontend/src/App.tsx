import { useExtension } from "./hooks/useExtension";

export function App() {

  const path = "launcher";
  const { htmlContent, error } = useExtension(path);

  if (error) return <div>Error: {error}</div>;
  if (!htmlContent) return <div>Loading…</div>;

  return (
    <div>
      <p>IFRAME DOWN</p>
      <iframe
        srcDoc={htmlContent}
        style={{ width: "100%", height: "100%" }}
        title={path}
      />
    </div>

  );
}
