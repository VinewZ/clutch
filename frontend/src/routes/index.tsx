import { createFileRoute, Link } from "@tanstack/react-router";
import { Application } from "@wailsio/runtime";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const cmds = [
    {
      label: "Quit",
      exec: Application.Quit,
    },
  ];

  return (
    <div className="App">
      <Link to="/settings/general">settings</Link>
      <div>
        <ul>
          {cmds.map((cmd) => (
            <li key={cmd.label} onClick={cmd.exec}>
              {cmd.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
